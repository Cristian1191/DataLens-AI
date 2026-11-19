/**
 * DataLens AI — Fase 4: Adaptador DeepSeek para el frontend
 *
 * Implementa la interfaz ProviderAdapter para comunicarse con el gateway
 * `analyzeWithDeepSeek` (codebase deepseek/) vía Firebase Functions.
 *
 * Ruta: React → este adaptador → Firebase Function (analyzeWithDeepSeek) → FastAPI/Colab → Modelo
 *
 * El frontend NUNCA llama directamente al Colab/FastAPI.
 * La URL del gateway se determina por el projectId de Firebase, no por el usuario.
 * La autenticación usa Firebase Auth ID Token.
 */

import { getAuth } from 'firebase/auth';
import { app } from '../../firebase';
import type {
  ProviderAdapter,
  ProviderExecutionRequest,
  ProviderExecutionResult,
  ProviderHealth,
} from '../orchestration/orchestration.types';

// ─── Configuración ───────────────────────────────────────────────────────────

/**
 * URL del gateway Firebase Function.
 * Se construye a partir del projectId configurado en firebase.js.
 * El usuario NO puede cambiar esta URL.
 */
const GATEWAY_BASE_URL = 'https://us-central1-datalens-ai-73f03.cloudfunctions.net';
const FUNCTION_NAME = 'analyzeWithDeepSeek';
const GATEWAY_URL = `${GATEWAY_BASE_URL}/${FUNCTION_NAME}`;

/** Timeout del cliente: 260s (margen sobre el timeout del backend de 240s) */
const CLIENT_TIMEOUT_MS = 260_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Obtiene el ID Token del usuario autenticado con Firebase Auth.
 * Lanza error si no hay sesión activa.
 */
async function getIdToken(): Promise<string> {
  const auth = getAuth(app);
  const user = auth.currentUser;

  if (!user) {
    throw new DeepSeekAuthError(
      'El usuario debe estar autenticado para usar el análisis con DeepSeek.'
    );
  }

  return user.getIdToken(false);
}

class DeepSeekAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeepSeekAuthError';
  }
}

// ─── Implementación del adaptador ─────────────────────────────────────────────

export class DeepSeekAdapter implements ProviderAdapter {
  readonly id = 'deepseek';
  readonly displayName = 'DeepSeek (Colab/FastAPI)';

  async execute(request: ProviderExecutionRequest): Promise<ProviderExecutionResult> {
    const startMs = Date.now();
    const timeoutMs = request.timeoutMs ?? CLIENT_TIMEOUT_MS;

    // 1. Obtener token de autenticación
    let idToken: string;
    try {
      idToken = await getIdToken();
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error de autenticación',
        statusCode: 401,
        provider: this.id,
        durationMs: Date.now() - startMs,
      };
    }

    // 2. Ejecutar solicitud con timeout
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const maxTokens = request.maxTokens ?? 1024;

      // Validar límites antes de enviar
      if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 4096) {
        return {
          success: false,
          error: 'max_new_tokens debe estar entre 1 y 4096.',
          statusCode: 400,
          provider: this.id,
          durationMs: Date.now() - startMs,
        };
      }

      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          max_new_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);

      const responseText = await response.text();

      // 3. Manejar errores HTTP
      if (!response.ok) {
        const errorMsg = this.parseErrorMessage(responseText, response.status);
        return {
          success: false,
          error: errorMsg,
          statusCode: response.status,
          provider: this.id,
          durationMs: Date.now() - startMs,
        };
      }

      // 4. Parsear respuesta JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        return {
          success: false,
          error: 'La respuesta del gateway DeepSeek no es un JSON válido.',
          statusCode: 502,
          provider: this.id,
          durationMs: Date.now() - startMs,
        };
      }

      // 5. Normalizar a DeepSeekAnalysisResult
      const data = this.normalizeResponse(parsed);

      return {
        success: true,
        data,
        statusCode: 200,
        provider: this.id,
        durationMs: Date.now() - startMs,
      };
    } catch (err) {
      clearTimeout(timeoutHandle);

      if (err instanceof Error && err.name === 'AbortError') {
        return {
          success: false,
          error: 'Tiempo de espera agotado al conectar con el agente DeepSeek (>4 min).',
          statusCode: 504,
          provider: this.id,
          durationMs: Date.now() - startMs,
        };
      }

      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error de red al conectar con DeepSeek.',
        statusCode: 503,
        provider: this.id,
        durationMs: Date.now() - startMs,
      };
    }
  }

  async checkHealth(): Promise<ProviderHealth> {
    // El gateway DeepSeek no tiene un endpoint /health propio.
    // Verificamos conectividad enviando una solicitud OPTIONS o HEAD.
    // Si el usuario no está autenticado, no podemos verificar.
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) {
      return {
        provider: this.id,
        status: 'unknown',
        lastChecked: Date.now(),
        details: 'No se puede verificar sin sesión de usuario autenticada.',
      };
    }

    try {
      const idToken = await user.getIdToken(false);

      // Enviamos un POST con prompt vacío para provocar un 400 controlado
      // (confirma que el gateway está accesible y responde).
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ prompt: '' }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // 400 = gateway accesible, rechazó prompt vacío → funcional
      // 502/503 = servidor upstream caído
      if (response.status === 400) {
        return {
          provider: this.id,
          status: 'available',
          lastChecked: Date.now(),
          details: 'Gateway DeepSeek accesible y respondiendo.',
        };
      }

      if (response.status === 502 || response.status === 503) {
        return {
          provider: this.id,
          status: 'unavailable',
          lastChecked: Date.now(),
          details: 'Gateway accesible, pero el servidor de inferencia no responde.',
        };
      }

      return {
        provider: this.id,
        status: 'degraded',
        lastChecked: Date.now(),
        details: `Gateway respondió con HTTP ${response.status}.`,
      };
    } catch (err) {
      return {
        provider: this.id,
        status: 'unavailable',
        lastChecked: Date.now(),
        details: err instanceof Error ? err.message : 'No se pudo conectar con el gateway.',
      };
    }
  }

  // ─── Helpers privados ───────────────────────────────────────────────────

  private parseErrorMessage(responseText: string, status: number): string {
    try {
      const errJson = JSON.parse(responseText) as { message?: string };
      if (errJson.message) return errJson.message;
    } catch {
      // No es JSON
    }

    switch (status) {
      case 401: return 'Autenticación requerida o token inválido.';
      case 400: return 'Solicitud inválida al gateway DeepSeek.';
      case 502: return 'El servidor de inferencia DeepSeek no pudo procesar la solicitud.';
      case 503: return 'El servidor de inferencia DeepSeek no está disponible.';
      case 504: return 'Tiempo de espera agotado en el servidor de inferencia.';
      default: return `Error HTTP ${status} del gateway DeepSeek.`;
    }
  }

  private normalizeResponse(parsed: unknown): import('../orchestration/orchestration.types').DeepSeekAnalysisResult {
    const result: import('../orchestration/orchestration.types').DeepSeekAnalysisResult = {
      raw: parsed,
    };

    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      if (typeof obj['analysis'] === 'string') result.analysis = obj['analysis'];
      if (typeof obj['confidence'] === 'number') result.confidence = obj['confidence'];
      if (obj['structured'] && typeof obj['structured'] === 'object') {
        result.structured = obj['structured'] as Record<string, unknown>;
      }
      // Si viene de FastAPI con estructura { result: "...", generated_text: "..." }
      if (typeof obj['result'] === 'string' && !result.analysis) {
        result.analysis = obj['result'];
      }
      if (typeof obj['generated_text'] === 'string' && !result.analysis) {
        result.analysis = obj['generated_text'];
      }
    }

    return result;
  }
}

/** Instancia singleton del adaptador DeepSeek */
export const deepSeekAdapter = new DeepSeekAdapter();
