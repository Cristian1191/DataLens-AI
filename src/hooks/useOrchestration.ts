/**
 * DataLens AI — Fase 4: Hook de orquestación para React
 *
 * Encapsula toda la lógica de orquestación fuera de los componentes React.
 * Proporciona:
 * - Estado reactivo de la operación actual
 * - Función para ejecutar una nueva consulta
 * - Control de duplicados (bloqueo durante ejecución)
 * - Integración con el sistema de recuperación post-recarga
 * - Mapeo automático de stages a AgentStep para el tracker de UI
 *
 * Los componentes solo consumen estado; nunca ejecutan lógica de orquestación.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { orchestratorService, providerRegistry } from '../services/orchestration';
import { deepSeekAdapter } from '../services/providers/deepseek.adapter';
import { operationRecoveryService } from '../services/orchestration/operation-recovery.service';
import type {
  OrchestrationStage,
  OperationStatus,
  ProviderPreferences,
} from '../services/orchestration/orchestration.types';
import type { QueryInterpretation } from '../services/ai/ai.types';
import type { AgentSkill, AgentStep, GeneratedReport, ChatMessage } from '../types/agent';

// ─── Estado del hook ──────────────────────────────────────────────────────────

export interface OrchestrationHookState {
  /** Reporte generado actual */
  activeReport: GeneratedReport | null;
  /** Interpretación de Fase 3 */
  interpretation: QueryInterpretation | null;
  /** Si hay una operación en curso */
  isGenerating: boolean;
  /** Estado actual de la operación */
  operationStatus: OperationStatus | 'idle';
  /** Pasos para el AgentStepTracker (formato de UI) */
  agentSteps: AgentStep[];
  /** Mensajes del chat del agente */
  messages: ChatMessage[];
  /** Último error (null si no hay) */
  lastError: string | null;
  /** Si hay una operación recuperable */
  hasRecoverableOperation: boolean;
}

// ─── Mapeo de stages a AgentSteps ─────────────────────────────────────────────

function stagesToAgentSteps(stages: OrchestrationStage[]): AgentStep[] {
  // Mapear las 5 etapas del orquestador a 3 pasos visibles en la UI
  // (reception es instantánea, se omite; agent_selection se combina con interpretation)
  const interpret = stages.find((s) => s.id === 'interpretation');
  const inference = stages.find((s) => s.id === 'inference');
  const finalize = stages.find((s) => s.id === 'finalization');

  const mapStatus = (s?: OrchestrationStage): AgentStep['status'] => {
    if (!s) return 'pending';
    switch (s.status) {
      case 'in_progress': return 'in_progress';
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      case 'skipped': return 'completed'; // Skipped se muestra como completado en UI
      default: return 'pending';
    }
  };

  return [
    {
      id: 'step-1',
      label: interpret?.label ?? 'Agente Intérprete: Analizando consulta',
      detail: interpret?.detail ?? 'Procesando...',
      status: mapStatus(interpret),
      durationMs: interpret?.durationMs,
    },
    {
      id: 'step-2',
      label: inference?.label ?? 'Ejecutando análisis especializado',
      detail: inference?.detail ?? 'En espera...',
      status: mapStatus(inference),
      durationMs: inference?.durationMs,
    },
    {
      id: 'step-3',
      label: finalize?.label ?? 'Generando reporte',
      detail: finalize?.detail ?? 'En espera...',
      status: mapStatus(finalize),
      durationMs: finalize?.durationMs,
    },
  ];
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useOrchestration() {
  // Registrar proveedores al montar (solo una vez)
  const providersRegistered = useRef(false);
  if (!providersRegistered.current) {
    providerRegistry.register(deepSeekAdapter);
    providersRegistered.current = true;
  }

  const [activeReport, setActiveReport] = useState<GeneratedReport | null>(null);
  const [interpretation, setInterpretation] = useState<QueryInterpretation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [operationStatus, setOperationStatus] = useState<OperationStatus | 'idle'>('idle');
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([
    { id: 'step-1', label: 'Agente Intérprete: Analizando consulta', detail: '', status: 'pending' },
    { id: 'step-2', label: 'Ejecutando análisis especializado', detail: '', status: 'pending' },
    { id: 'step-3', label: 'Generando reporte', detail: '', status: 'pending' },
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'agent',
      text: '¡Hola! Soy tu asistente agéntico en DataLens AI. Escribe cualquier hipótesis, consulta técnica o dilema arquitectónico para generar una síntesis con evidencia y datos comparativos.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [hasRecoverableOperation, setHasRecoverableOperation] = useState(false);

  // Guard contra ejecución concurrente
  const executionLock = useRef(false);

  // ─── Verificar recuperación al montar ────────────────────────────────────

  useEffect(() => {
    const recoverable = operationRecoveryService.recover();
    if (recoverable) {
      setHasRecoverableOperation(true);

      // Restaurar estado visual sin re-ejecutar
      if (recoverable.interpretation) {
        setInterpretation(recoverable.interpretation);
      }
      if (recoverable.stages) {
        setAgentSteps(stagesToAgentSteps(recoverable.stages));
      }

      // Notificar al usuario
      const recoveryMsg: ChatMessage = {
        id: `msg-recovery-${Date.now()}`,
        sender: 'system',
        text: `⚠️ Se detectó una operación interrumpida: "${recoverable.request.query.slice(0, 50)}..." — Puedes reintentar la consulta o iniciar una nueva.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, recoveryMsg]);

      // Limpiar la operación persistida (ya fue notificada)
      operationRecoveryService.clear();
    }
  }, []); // Solo al montar

  // ─── Ejecutar pipeline de orquestación ───────────────────────────────────

  const executeQuery = useCallback(
    async (
      query: string,
      options?: {
        skill?: AgentSkill;
        isDeep?: boolean;
        providerPreferences?: ProviderPreferences;
      }
    ) => {
      // Guard: evitar ejecución concurrente
      if (executionLock.current) {
        console.warn('[useOrchestration] Operación ya en curso, ignorando solicitud duplicada.');
        return;
      }

      const trimmed = query.trim();
      if (!trimmed) return;

      executionLock.current = true;
      setIsGenerating(true);
      setLastError(null);
      setHasRecoverableOperation(false);

      // Añadir mensaje del usuario
      const userMsg: ChatMessage = {
        id: `msg-user-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const response = await orchestratorService.execute(
          trimmed,
          {
            skill: options?.skill,
            isDeep: options?.isDeep,
            providerPreferences: options?.providerPreferences,
          },
          {
            onStatusUpdate: (status) => {
              setOperationStatus(status);
            },
            onStageUpdate: () => {
              // Individual stage updates handled by onStagesSnapshot
            },
            onStagesSnapshot: (stages) => {
              setAgentSteps(stagesToAgentSteps(stages));
            },
            onInterpretation: (interp) => {
              setInterpretation(interp);

              // Si necesita aclaración, enviar mensaje al chat
              if (interp.needs_clarification && interp.clarification_question) {
                const clarMsg: ChatMessage = {
                  id: `msg-clarification-${Date.now()}`,
                  sender: 'agent',
                  text: `⚠️ He detectado ambigüedad en la consulta. ${interp.clarification_question}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                setMessages((prev) => [...prev, clarMsg]);
              }
            },
            onReport: (report) => {
              setActiveReport(report);
            },
            onError: (err) => {
              setLastError(err.message);
            },
          }
        );

        // Mensaje de confirmación del agente
        if (response.status === 'completed' && response.result?.interpretation) {
          const interp = response.result.interpretation;
          const agentReply: ChatMessage = {
            id: `msg-agent-${Date.now()}`,
            sender: 'agent',
            text: `He interpretado tu consulta como [${interp.intent.toUpperCase()}]: "${interp.objective}". ${
              interp.needs_clarification
                ? 'Nota: Se recomienda clarificar las variables para un cálculo de alta fidelidad.'
                : 'He estructurado el reporte y las métricas objetivo en el lienzo central.'
            }`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, agentReply]);
        }

        if (response.status === 'failed' && response.error) {
          const errorMsg: ChatMessage = {
            id: `msg-error-${Date.now()}`,
            sender: 'system',
            text: `❌ Error: ${response.error.message}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, errorMsg]);
        }
      } catch (err) {
        const errText = err instanceof Error ? err.message : 'Error inesperado en la orquestación.';
        setLastError(errText);
        setOperationStatus('failed');

        const errorMsg: ChatMessage = {
          id: `msg-error-${Date.now()}`,
          sender: 'system',
          text: `❌ Error inesperado: ${errText}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsGenerating(false);
        executionLock.current = false;
      }
    },
    [] // Sin dependencias externas; usa refs para lock
  );

  // ─── Funciones auxiliares ────────────────────────────────────────────────

  const resetToNewQuery = useCallback(() => {
    setActiveReport(null);
    setInterpretation(null);
    setLastError(null);
    setOperationStatus('idle');
    setAgentSteps([
      { id: 'step-1', label: 'Agente Intérprete: Analizando consulta', detail: '', status: 'pending' },
      { id: 'step-2', label: 'Ejecutando análisis especializado', detail: '', status: 'pending' },
      { id: 'step-3', label: 'Generando reporte', detail: '', status: 'pending' },
    ]);
  }, []);

  const dismissRecovery = useCallback(() => {
    setHasRecoverableOperation(false);
    operationRecoveryService.clear();
  }, []);

  return {
    // Estado
    activeReport,
    interpretation,
    isGenerating,
    operationStatus,
    agentSteps,
    messages,
    lastError,
    hasRecoverableOperation,

    // Acciones
    executeQuery,
    resetToNewQuery,
    dismissRecovery,
    setActiveReport,
    setMessages,
  };
}
