/**
 * DataLens AI — Fase 4: Contratos de Orquestación
 *
 * Define todos los tipos, interfaces y enumeraciones del sistema de orquestación.
 * Estos contratos son la fuente de verdad para la comunicación entre:
 *   - Frontend React (Capa A)
 *   - Orquestador (Capa B)
 *   - Adaptadores de proveedores (Capa C)
 *
 * NO depende de tipos específicos de un proveedor.
 * Extiende los tipos de la Fase 3 sin modificarlos.
 */

import type { QueryInterpretation } from '../ai/ai.types';
import type { AgentSkill, GeneratedReport } from '../../types/agent';

// ─── Identificadores ──────────────────────────────────────────────────────────

/** Formato: `op_<base36_timestamp>_<random5>` */
export type OperationId = string;

// ─── Estados de operación (Sección 5 del spec) ───────────────────────────────

export type OperationStatus =
  | 'queued'
  | 'running'
  | 'waiting_provider'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'interrupted'
  | 'recoverable';

// ─── Estados de etapa ─────────────────────────────────────────────────────────

export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

// ─── Etapas del pipeline ──────────────────────────────────────────────────────

export type StageId =
  | 'reception'
  | 'interpretation'
  | 'agent_selection'
  | 'inference'
  | 'finalization';

export interface OrchestrationStage {
  id: StageId;
  label: string;
  detail: string;
  status: StageStatus;
  provider?: string;              // Nombre del proveedor que ejecutó esta etapa
  startedAt?: number;             // timestamp ms
  completedAt?: number;           // timestamp ms
  durationMs?: number;
  error?: string;
}

// ─── Preferencias de proveedor ────────────────────────────────────────────────

export interface ProviderPreferences {
  primaryProvider?: string;       // 'ollama' | 'deepseek' | futuro
  skipProviders?: string[];       // Proveedores a excluir
  maxTokens?: number;
  timeoutMs?: number;
}

// ─── Dataset context (futuro) ─────────────────────────────────────────────────

export interface DatasetContext {
  datasetId?: string;
  columns?: string[];
  rowCount?: number;
  schema?: Record<string, string>;  // columna → tipo
}

// ─── OrchestrationRequest (Sección 5) ─────────────────────────────────────────

export interface OrchestrationRequest {
  operationId: OperationId;
  conversationId?: string;
  // userId: Se obtiene del token Firebase Auth en el backend, NO se envía desde el cliente
  query: string;
  interpretation?: QueryInterpretation;   // Resultado de Fase 3, si ya se obtuvo
  datasetContext?: DatasetContext;
  providerPreferences?: ProviderPreferences;
  skill?: AgentSkill;
  isDeep?: boolean;
  createdAt: number;                      // timestamp ms
  requestVersion: string;                 // '4.0'
}

// ─── Resultado de DeepSeek ────────────────────────────────────────────────────

export interface DeepSeekAnalysisResult {
  analysis?: string;
  structured?: Record<string, unknown>;
  confidence?: number;
  raw?: unknown;
}

// ─── OrchestrationResponse (Sección 5) ────────────────────────────────────────

export interface OrchestrationResponse {
  operationId: OperationId;
  status: OperationStatus;
  currentStage: StageId;
  provider?: string;
  result?: {
    interpretation?: QueryInterpretation;
    deepSeekAnalysis?: DeepSeekAnalysisResult;
    report?: GeneratedReport;
  };
  error?: {
    message: string;
    stage: StageId;
    isRecoverable: boolean;
    code?: string;
  };
  createdAt: number;
  updatedAt: number;
}

// ─── Estado completo de la operación (gestionado internamente) ───────────────

export interface OperationState {
  operationId: OperationId;
  status: OperationStatus;
  request: OrchestrationRequest;
  stages: OrchestrationStage[];
  interpretation?: QueryInterpretation;
  deepSeekAnalysis?: DeepSeekAnalysisResult;
  report?: GeneratedReport;
  startedAt: number;
  lastUpdatedAt: number;
  error?: {
    message: string;
    stage: StageId;
    isRecoverable: boolean;
    code?: string;
  };
  retryCount: number;
}

// ─── Health check de proveedores ──────────────────────────────────────────────

export type ProviderHealthStatus = 'unknown' | 'available' | 'unavailable' | 'degraded';

export interface ProviderHealth {
  provider: string;
  status: ProviderHealthStatus;
  lastChecked: number;
  details?: string;
}

export interface SystemHealthState {
  providers: Record<string, ProviderHealth>;
  lastChecked: number;
}

// ─── Opciones de recuperación ─────────────────────────────────────────────────

export interface RecoveryOptions {
  maxAgeMs: number;         // Máximo tiempo de vida de una operación recuperable
  storageKey: string;       // Clave en localStorage
}

// ─── Interfaz del proveedor (adaptador) ───────────────────────────────────────

export interface ProviderAdapter {
  readonly id: string;
  readonly displayName: string;

  /**
   * Ejecuta una solicitud contra el proveedor.
   * Retorna el resultado o un error estructurado.
   */
  execute(request: ProviderExecutionRequest): Promise<ProviderExecutionResult>;

  /**
   * Comprueba la disponibilidad del proveedor.
   */
  checkHealth(): Promise<ProviderHealth>;
}

export interface ProviderExecutionRequest {
  operationId: OperationId;
  prompt: string;
  context?: {
    interpretation?: QueryInterpretation;
    query?: string;
  };
  maxTokens?: number;
  timeoutMs?: number;
}

export interface ProviderExecutionResult {
  success: boolean;
  data?: DeepSeekAnalysisResult;
  error?: string;
  statusCode?: number;
  durationMs?: number;
  provider: string;
}

// ─── Configuración de reintentos ──────────────────────────────────────────────

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Códigos HTTP que NO deben reintentarse */
  nonRetryableStatusCodes: number[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 800,
  maxDelayMs: 5000,
  nonRetryableStatusCodes: [400, 401, 403, 422],
};
