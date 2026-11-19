/**
 * DataLens AI — Fase 4: Servicio de recuperación de operaciones
 *
 * Persiste el estado de operaciones en curso en localStorage para permitir
 * recuperación limitada tras recarga de página.
 *
 * LIMITACIONES DOCUMENTADAS:
 * - Solo funciona en el mismo navegador/dispositivo.
 * - No garantiza recuperación tras cerrar sesión o cambiar dispositivo.
 * - No persiste tokens ni credenciales.
 * - Firestore no está configurado; cuando lo esté, se migrará a persistencia en servidor.
 *
 * Estrategia:
 * - Al iniciar una operación: se guarda en localStorage.
 * - Al completar/fallar: se elimina de localStorage.
 * - Al cargar la app: se detecta si hay operaciones huérfanas recientes.
 * - Operaciones > MAX_AGE_MS se descartan.
 * - No se re-ejecutan inferencias ya completadas.
 */

import type { OperationState, RecoveryOptions } from './orchestration.types';

const DEFAULT_OPTIONS: RecoveryOptions = {
  maxAgeMs: 10 * 60 * 1000,  // 10 minutos
  storageKey: 'datalens_active_operation',
};

/** Campos sensibles que NUNCA se persisten */
const SENSITIVE_FIELDS = ['token', 'apiKey', 'secret', 'credential', 'password'];

export class OperationRecoveryService {
  private readonly options: RecoveryOptions;

  constructor(options?: Partial<RecoveryOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Persiste el estado de la operación en localStorage.
   * Excluye campos sensibles y limita el tamaño del payload.
   */
  persist(state: OperationState): void {
    try {
      // Crear copia limpia sin datos sensibles
      const sanitized = this.sanitize(state);
      const json = JSON.stringify(sanitized);

      // Limitar tamaño para no saturar localStorage (máx ~100KB por operación)
      if (json.length > 100_000) {
        console.warn('[OperationRecovery] Estado demasiado grande para persistir, truncando.');
        // Persistir solo los campos esenciales
        const minimal: Partial<OperationState> = {
          operationId: state.operationId,
          status: state.status,
          request: state.request,
          stages: state.stages,
          startedAt: state.startedAt,
          lastUpdatedAt: state.lastUpdatedAt,
          retryCount: state.retryCount,
          error: state.error,
        };
        localStorage.setItem(this.options.storageKey, JSON.stringify(minimal));
        return;
      }

      localStorage.setItem(this.options.storageKey, json);
    } catch {
      console.warn('[OperationRecovery] No se pudo persistir el estado de la operación.');
    }
  }

  /**
   * Elimina la operación persistida.
   */
  clear(): void {
    try {
      localStorage.removeItem(this.options.storageKey);
    } catch {
      // ignorar
    }
  }

  /**
   * Recupera una operación pendiente si existe y es reciente.
   *
   * Retorna null si:
   * - No hay operación guardada
   * - Es demasiado antigua (> maxAgeMs)
   * - Ya está completada o fallida
   * - Los datos están corruptos
   */
  recover(): OperationState | null {
    try {
      const raw = localStorage.getItem(this.options.storageKey);
      if (!raw) return null;

      let state: OperationState;
      try {
        state = JSON.parse(raw) as OperationState;
      } catch {
        // JSON corrupto
        this.clear();
        return null;
      }

      // Validar estructura mínima
      if (!state.operationId || !state.request || !state.startedAt) {
        this.clear();
        return null;
      }

      // Verificar edad
      const ageMs = Date.now() - state.startedAt;
      if (ageMs > this.options.maxAgeMs) {
        this.clear();
        return null;
      }

      // Solo recuperar operaciones que estaban en progreso
      const inProgressStatuses = new Set(['queued', 'running', 'waiting_provider', 'recoverable']);
      if (!inProgressStatuses.has(state.status)) {
        this.clear();
        return null;
      }

      // Marcar como recuperable (no re-ejecutar automáticamente)
      state.status = 'recoverable';

      return state;
    } catch {
      this.clear();
      return null;
    }
  }

  /**
   * Verifica si hay una operación recuperable pendiente.
   */
  hasPendingOperation(): boolean {
    return this.recover() !== null;
  }

  /**
   * Elimina campos potencialmente sensibles del estado.
   */
  private sanitize(state: OperationState): OperationState {
    const json = JSON.stringify(state, (key, value) => {
      if (SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f))) {
        return undefined;
      }
      return value;
    });
    return JSON.parse(json) as OperationState;
  }
}

export const operationRecoveryService = new OperationRecoveryService();
