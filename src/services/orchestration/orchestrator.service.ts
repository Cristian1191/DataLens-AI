/**
 * DataLens AI — Fase 4: Servicio de orquestación
 *
 * Coordina el pipeline completo de procesamiento de consultas:
 *   ETAPA 1 → Recepción y validación
 *   ETAPA 2 → Interpretación (Fase 3 via functions/interpretQuery)
 *   ETAPA 3 → Selección de agente especializado
 *   ETAPA 4 → Inferencia (DeepSeek via deepseek/analyzeWithDeepSeek)
 *   ETAPA 5 → Finalización y síntesis del reporte
 *
 * Principios:
 * - Desacoplado de React (no importa hooks ni componentes)
 * - Desacoplado de proveedores (usa ProviderAdapter vía ProviderRegistry)
 * - Deduplicación de operaciones por operationId
 * - Reintentos con backoff exponencial solo para errores transitorios
 * - Persistencia de estado para recuperación post-recarga
 * - Callbacks reactivos para actualizar la UI en tiempo real
 * - NO modifica functions/src/ (Fase 3 congelada)
 */

import type { QueryInterpretation } from '../ai/ai.types';
import { defaultBackendAIService } from '../ai/backend-ai.service';
import { MOCK_REPORTS_DATABASE } from '../../data/mockReports';
import type { GeneratedReport, AgentSkill } from '../../types/agent';
import { providerRegistry } from './provider-registry';
import { operationRecoveryService } from './operation-recovery.service';
import {
  validateOrchestrationRequest,
  validateInterpretation,
  validateProviderResult,
} from './orchestration.schemas';
import type {
  OperationId,
  OperationState,
  OperationStatus,
  OrchestrationRequest,
  OrchestrationResponse,
  OrchestrationStage,
  StageId,
  ProviderPreferences,
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
  SystemHealthState,
} from './orchestration.types';

// Re-import the constant value (not just the type)
const RETRY_DEFAULTS: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 800,
  maxDelayMs: 5000,
  nonRetryableStatusCodes: [400, 401, 403, 422],
};

// ─── Callbacks para la UI ─────────────────────────────────────────────────────

export interface OrchestratorCallbacks {
  onStatusUpdate: (status: OperationStatus) => void;
  onStageUpdate: (stage: OrchestrationStage) => void;
  onStagesSnapshot: (stages: OrchestrationStage[]) => void;
  onInterpretation?: (interp: QueryInterpretation) => void;
  onReport?: (report: GeneratedReport) => void;
  onError?: (error: { message: string; stage: StageId; isRecoverable: boolean }) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateOperationId(): OperationId {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).substring(2, 7);
  return `op_${ts}_${rnd}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoff(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelayMs);
}

function isRetryable(statusCode: number | undefined, config: RetryConfig): boolean {
  if (statusCode === undefined) return true; // Network error → retryable
  return !config.nonRetryableStatusCodes.includes(statusCode);
}

// ─── Clase principal ──────────────────────────────────────────────────────────

export class OrchestratorService {
  private currentOperation: OperationState | null = null;
  private activeOperationIds = new Set<OperationId>();
  private retryConfig: RetryConfig;

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = { ...RETRY_DEFAULTS, ...retryConfig };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PIPELINE PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════

  public async execute(
    query: string,
    options: {
      skill?: AgentSkill;
      isDeep?: boolean;
      providerPreferences?: ProviderPreferences;
    },
    callbacks: OrchestratorCallbacks
  ): Promise<OrchestrationResponse> {
    // ── ETAPA 1: Recepción ─────────────────────────────────────────────────

    const operationId = generateOperationId();
    const now = Date.now();

    const request: OrchestrationRequest = {
      operationId,
      query: query.trim(),
      skill: options.skill,
      isDeep: options.isDeep ?? true,
      providerPreferences: options.providerPreferences,
      createdAt: now,
      requestVersion: '4.0',
    };

    // Validar solicitud
    const reqValidation = validateOrchestrationRequest(request);
    if (!reqValidation.valid) {
      const errMsg = reqValidation.errors.join(' ');
      callbacks.onError?.({ message: errMsg, stage: 'reception', isRecoverable: false });
      return this.buildResponse(operationId, 'failed', 'reception', now, {
        error: { message: errMsg, stage: 'reception', isRecoverable: false },
      });
    }

    // Deduplicación: si ya hay una operación en curso con la misma query
    if (this.currentOperation && this.isInProgress(this.currentOperation.status)) {
      if (this.currentOperation.request.query === request.query) {
        const errMsg = 'Ya existe una operación idéntica en curso. Espera a que finalice.';
        callbacks.onError?.({ message: errMsg, stage: 'reception', isRecoverable: false });
        return this.buildResponse(operationId, 'failed', 'reception', now, {
          error: { message: errMsg, stage: 'reception', isRecoverable: false },
        });
      }
    }

    // Registrar operación
    this.activeOperationIds.add(operationId);

    const stages = this.buildInitialStages(request.query);

    this.currentOperation = {
      operationId,
      status: 'queued',
      request,
      stages,
      startedAt: now,
      lastUpdatedAt: now,
      retryCount: 0,
    };

    this.persistState();
    callbacks.onStatusUpdate('running');
    callbacks.onStagesSnapshot(stages);

    // ── ETAPA 2: Interpretación (Fase 3) ───────────────────────────────────

    this.updateStage('interpretation', {
      status: 'in_progress',
      startedAt: Date.now(),
      detail: `Analizando: "${request.query.length > 50 ? request.query.slice(0, 47) + '...' : request.query}"`,
    }, callbacks);

    this.updateOperationStatus('running', callbacks);

    let interpretation: QueryInterpretation | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await defaultBackendAIService.interpretQuery(request.query);
        if (result.interpretation) {
          // Validar interpretación antes de aceptarla
          const interpValidation = validateInterpretation(result.interpretation);
          if (interpValidation.valid) {
            interpretation = result.interpretation;
            break;
          } else {
            console.warn('[Orchestrator] Interpretación inválida:', interpValidation.errors);
            // Si la validación falla en el último intento, aceptarla con advertencia
            if (attempt === this.retryConfig.maxRetries) {
              interpretation = result.interpretation;
            }
          }
        }
      } catch (err) {
        console.warn(`[Orchestrator] Intento ${attempt + 1} de interpretación falló:`, err);
        if (attempt < this.retryConfig.maxRetries) {
          await sleep(computeBackoff(attempt, this.retryConfig));
        }
      }
    }

    if (!interpretation) {
      this.updateStage('interpretation', {
        status: 'failed',
        completedAt: Date.now(),
        error: 'No se pudo interpretar la consulta tras varios intentos.',
      }, callbacks);
      return this.failOperation(operationId, 'interpretation',
        'No se pudo interpretar la consulta tras varios intentos.', false, callbacks);
    }

    // Interpretación exitosa
    this.updateStage('interpretation', {
      status: 'completed',
      completedAt: Date.now(),
      durationMs: Date.now() - (this.getStage('interpretation')?.startedAt ?? Date.now()),
      detail: `Intención: [${interpretation.intent.toUpperCase()}] • ${interpretation.objective}`,
      provider: interpretation.metadata?.source === 'ollama-cloud' ? 'ollama' : 'fallback-semántico',
    }, callbacks);

    if (this.currentOperation) {
      this.currentOperation.interpretation = interpretation;
    }
    callbacks.onInterpretation?.(interpretation);
    this.persistState();

    // Si necesita aclaración, la operación continúa pero se señala
    // (el frontend decide si preguntar al usuario)

    // ── ETAPA 3: Selección de agente ───────────────────────────────────────

    this.updateStage('agent_selection', {
      status: 'in_progress',
      startedAt: Date.now(),
      detail: 'Determinando el agente especializado más adecuado...',
    }, callbacks);

    const skipProviders = options.providerPreferences?.skipProviders;
    const selectedProvider = providerRegistry.selectProvider(interpretation, skipProviders);

    if (selectedProvider) {
      this.updateStage('agent_selection', {
        status: 'completed',
        completedAt: Date.now(),
        detail: `Agente seleccionado: ${selectedProvider.displayName}`,
        provider: selectedProvider.id,
      }, callbacks);
    } else {
      // No se necesita proveedor especializado (consulta informacional/ambigua)
      this.updateStage('agent_selection', {
        status: 'completed',
        completedAt: Date.now(),
        detail: 'No se requiere agente especializado para esta consulta.',
      }, callbacks);
    }

    this.persistState();

    // ── ETAPA 4: Inferencia (si se seleccionó proveedor) ───────────────────

    if (selectedProvider) {
      this.updateStage('inference', {
        status: 'in_progress',
        startedAt: Date.now(),
        detail: `Enviando al agente ${selectedProvider.displayName}...`,
        provider: selectedProvider.id,
      }, callbacks);

      this.updateOperationStatus('waiting_provider', callbacks);

      const inferencePrompt = this.buildInferencePrompt(request.query, interpretation);

      let inferenceSuccess = false;

      for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
        const result = await selectedProvider.execute({
          operationId,
          prompt: inferencePrompt,
          context: { interpretation, query: request.query },
          maxTokens: options.providerPreferences?.maxTokens ?? 1024,
          timeoutMs: options.providerPreferences?.timeoutMs,
        });

        // Validar resultado del proveedor
        const resultValidation = validateProviderResult(result);
        if (!resultValidation.valid) {
          console.warn('[Orchestrator] Resultado de proveedor inválido:', resultValidation.errors);
        }

        if (result.success && result.data) {
          if (this.currentOperation) {
            this.currentOperation.deepSeekAnalysis = result.data;
          }
          inferenceSuccess = true;

          this.updateStage('inference', {
            status: 'completed',
            completedAt: Date.now(),
            durationMs: result.durationMs,
            detail: `Análisis completado${result.data.confidence ? ` (confianza: ${Math.round(result.data.confidence * 100)}%)` : ''}.`,
          }, callbacks);
          break;
        }

        // Verificar si el error es retryable
        if (!isRetryable(result.statusCode, this.retryConfig)) {
          this.updateStage('inference', {
            status: 'failed',
            completedAt: Date.now(),
            durationMs: result.durationMs,
            error: result.error ?? 'Error no recuperable del proveedor.',
          }, callbacks);
          break;
        }

        if (attempt < this.retryConfig.maxRetries) {
          await sleep(computeBackoff(attempt, this.retryConfig));
        }
      }

      if (!inferenceSuccess) {
        // Fallback gracioso: continuar sin resultado de inferencia
        this.updateStage('inference', {
          status: 'skipped',
          completedAt: Date.now(),
          detail: 'Proveedor no disponible. Continuando con la interpretación base.',
        }, callbacks);
      }

      this.persistState();
    } else {
      // No se seleccionó proveedor → saltar etapa
      this.updateStage('inference', {
        status: 'skipped',
        detail: 'Sin proveedor especializado requerido.',
      }, callbacks);
    }

    // ── ETAPA 5: Finalización ──────────────────────────────────────────────

    this.updateStage('finalization', {
      status: 'in_progress',
      startedAt: Date.now(),
      detail: 'Generando reporte de resultados...',
    }, callbacks);

    this.updateOperationStatus('running', callbacks);

    const report = this.synthesizeReport(
      request.query,
      interpretation,
      this.currentOperation?.deepSeekAnalysis,
      options.skill,
      options.isDeep
    );

    if (this.currentOperation) {
      this.currentOperation.report = report;
    }
    callbacks.onReport?.(report);

    this.updateStage('finalization', {
      status: 'completed',
      completedAt: Date.now(),
      detail: 'Reporte generado y listo en el lienzo central.',
    }, callbacks);

    // Marcar operación como completada
    this.updateOperationStatus('completed', callbacks);
    this.activeOperationIds.delete(operationId);
    operationRecoveryService.clear();

    const totalDurationMs = Date.now() - request.createdAt;

    const response = this.buildResponse(operationId, 'completed', 'finalization', now, {
      result: {
        interpretation,
        deepSeekAnalysis: this.currentOperation?.deepSeekAnalysis,
        report,
      },
      updatedAt: Date.now(),
    });

    this.currentOperation = null;

    return response;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════════════════

  public async checkHealth(): Promise<SystemHealthState> {
    return providerRegistry.checkAllHealth();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADO PÚBLICO
  // ═══════════════════════════════════════════════════════════════════════════

  public getCurrentOperation(): OperationState | null {
    return this.currentOperation ? { ...this.currentOperation } : null;
  }

  public isIdle(): boolean {
    return this.currentOperation === null || !this.isInProgress(this.currentOperation.status);
  }

  public isOperationActive(operationId: OperationId): boolean {
    return this.activeOperationIds.has(operationId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════

  private isInProgress(status: OperationStatus): boolean {
    return status === 'queued' || status === 'running' || status === 'waiting_provider';
  }

  private buildInitialStages(query: string): OrchestrationStage[] {
    return [
      {
        id: 'reception',
        label: 'Recibiendo solicitud',
        detail: 'Validando entrada y generando identificador de operación.',
        status: 'completed',
        startedAt: Date.now(),
        completedAt: Date.now(),
      },
      {
        id: 'interpretation',
        label: 'Agente Intérprete: Descomponiendo intención analítica',
        detail: 'Procesando consulta con el motor de interpretación...',
        status: 'pending',
      },
      {
        id: 'agent_selection',
        label: 'Seleccionando agente especializado',
        detail: 'Determinando el modelo más adecuado para la consulta...',
        status: 'pending',
      },
      {
        id: 'inference',
        label: 'Ejecutando análisis con modelo especializado',
        detail: 'En espera de la selección de agente.',
        status: 'pending',
      },
      {
        id: 'finalization',
        label: 'Sintetizando reporte y validando resultados',
        detail: 'Generación del lienzo de resultados.',
        status: 'pending',
      },
    ];
  }

  private updateStage(
    stageId: StageId,
    patch: Partial<OrchestrationStage>,
    callbacks: OrchestratorCallbacks
  ): void {
    if (!this.currentOperation) return;

    this.currentOperation.stages = this.currentOperation.stages.map((s) =>
      s.id === stageId ? { ...s, ...patch } : s
    );
    this.currentOperation.lastUpdatedAt = Date.now();

    const updatedStage = this.currentOperation.stages.find((s) => s.id === stageId);
    if (updatedStage) {
      callbacks.onStageUpdate(updatedStage);
    }
    callbacks.onStagesSnapshot([...this.currentOperation.stages]);
  }

  private getStage(stageId: StageId): OrchestrationStage | undefined {
    return this.currentOperation?.stages.find((s) => s.id === stageId);
  }

  private updateOperationStatus(status: OperationStatus, callbacks: OrchestratorCallbacks): void {
    if (!this.currentOperation) return;
    this.currentOperation.status = status;
    this.currentOperation.lastUpdatedAt = Date.now();
    callbacks.onStatusUpdate(status);
  }

  private persistState(): void {
    if (this.currentOperation) {
      operationRecoveryService.persist(this.currentOperation);
    }
  }

  private failOperation(
    operationId: OperationId,
    stage: StageId,
    message: string,
    isRecoverable: boolean,
    callbacks: OrchestratorCallbacks
  ): OrchestrationResponse {
    if (this.currentOperation) {
      this.currentOperation.status = 'failed';
      this.currentOperation.error = { message, stage, isRecoverable };
      this.currentOperation.lastUpdatedAt = Date.now();
    }

    this.activeOperationIds.delete(operationId);
    operationRecoveryService.clear();
    callbacks.onStatusUpdate('failed');
    callbacks.onError?.({ message, stage, isRecoverable });

    this.currentOperation = null;

    return this.buildResponse(operationId, 'failed', stage, Date.now(), {
      error: { message, stage, isRecoverable },
    });
  }

  private buildResponse(
    operationId: OperationId,
    status: OperationStatus,
    currentStage: StageId,
    createdAt: number,
    extra?: Partial<OrchestrationResponse>
  ): OrchestrationResponse {
    return {
      operationId,
      status,
      currentStage,
      createdAt,
      updatedAt: Date.now(),
      ...extra,
    };
  }

  /**
   * Construye el prompt contextualizado para el proveedor especializado.
   * Incluye la interpretación de Fase 3 como contexto estructurado.
   */
  private buildInferencePrompt(query: string, interp: QueryInterpretation): string {
    return `Eres un agente analista estadístico experto. Analiza la siguiente solicitud y proporciona un plan estadístico detallado en español.

CONSULTA ORIGINAL DEL USUARIO:
${query}

INTERPRETACIÓN ESTRUCTURADA (Agente Intérprete, Fase 3):
- Intención: ${interp.intent}
- Objetivo: ${interp.objective}
- Tipo de análisis: ${interp.analysis_type.join(', ')}
- Variables objetivo: ${interp.variables.target.join(', ') || 'No especificadas'}
- Variables de agrupación: ${interp.variables.group_by.join(', ') || 'Ninguna'}
- Variables temporales: ${interp.variables.time.join(', ') || 'Ninguna'}
- Métricas solicitadas: ${interp.requested_metrics.join(', ') || 'Generales'}
- Filtros: ${interp.filters.length > 0 ? JSON.stringify(interp.filters) : 'Ninguno'}
- Confianza de interpretación: ${Math.round(interp.confidence * 100)}%

Responde EXCLUSIVAMENTE con un JSON estructurado:
{
  "analysis": "descripción del plan de análisis recomendado",
  "methods": ["método_estadístico_1", "método_estadístico_2"],
  "confidence": 0.0-1.0,
  "structured": {
    "primary_method": "nombre_del_método_principal",
    "assumptions": ["supuesto_1", "supuesto_2"],
    "steps": ["paso_1", "paso_2", "paso_3"]
  }
}`;
  }

  /**
   * Genera el reporte final a partir de la interpretación y (opcionalmente) el análisis.
   * Por ahora usa los reportes mock como base; cuando el motor estadístico esté activo,
   * este método se reemplazará con la síntesis real.
   */
  private synthesizeReport(
    query: string,
    interpretation: QueryInterpretation,
    deepSeekAnalysis: import('./orchestration.types').DeepSeekAnalysisResult | undefined,
    skill?: AgentSkill,
    isDeep?: boolean
  ): GeneratedReport {
    const base = MOCK_REPORTS_DATABASE['default'];

    return {
      ...base,
      id: `rep-${Date.now()}`,
      query,
      title: query.length > 20 ? query : `Síntesis: ${query}`,
      subtitle: `${interpretation.objective} [1][2]`,
      skillUsed: skill || 'deep_analysis',
      isDeep: isDeep ?? true,
      createdAt: 'Hace un momento',
    };
  }
}

/** Instancia singleton del orquestador */
export const orchestratorService = new OrchestratorService();
