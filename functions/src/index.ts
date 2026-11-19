import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { OllamaProvider } from './providers/ollama.provider';
import { AIService } from './services/ai.service';
import { AIMessage } from './providers/provider.types';
import { QueryInterpreterAgent } from './agents/query-interpreter.agent';

// Definición de secretos y configuración según directrices de Firebase Gen 2
const ollamaApiKeySecret = defineSecret('OLLAMA_API_KEY');
const ollamaModelConfig = defineString('OLLAMA_MODEL', { default: 'gpt-oss:20b' });

/**
 * Helper para inicializar el servicio de IA de forma segura con la clave del Secret Manager
 */
function createAIService(modelName?: string): { aiService: AIService; modelToUse: string } {
  let apiKey = '';
  try {
    apiKey = ollamaApiKeySecret.value();
  } catch {
    apiKey = process.env.OLLAMA_API_KEY || '';
  }

  if (!apiKey) {
    throw new HttpsError(
      'failed-precondition',
      'Configuración incompleta: OLLAMA_API_KEY no se encuentra disponible en los secretos del backend.'
    );
  }

  let defaultModel = 'gpt-oss:20b';
  try {
    defaultModel = ollamaModelConfig.value() || 'gpt-oss:20b';
  } catch {
    defaultModel = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
  }

  const modelToUse = modelName || defaultModel;

  const ollamaProvider = new OllamaProvider({
    apiKey,
    baseUrl: 'https://ollama.com',
    defaultModel: modelToUse,
  });

  return {
    aiService: new AIService([ollamaProvider]),
    modelToUse,
  };
}

/**
 * Función Callable (onCall) para interpretación estructurada de consultas (Fase 3: Agente Intérprete)
 */
export const interpretQuery = onCall(
  {
    secrets: [ollamaApiKeySecret],
    cors: true,
  },
  async (request) => {
    const data = request.data || {};
    const query = typeof data.query === 'string' ? data.query.trim() : '';
    const requestedModel = typeof data.model === 'string' && data.model.trim() ? data.model.trim() : undefined;

    if (!query) {
      throw new HttpsError('invalid-argument', 'La consulta a interpretar no puede estar vacía.');
    }

    if (query.length > 2000) {
      throw new HttpsError('invalid-argument', 'La consulta supera el límite de 2000 caracteres.');
    }

    const { aiService, modelToUse } = createAIService(requestedModel);
    const agent = new QueryInterpreterAgent(aiService, modelToUse);

    const interpretation = await agent.interpret(query, modelToUse);

    return {
      success: true,
      interpretation,
    };
  }
);

/**
 * Función Callable (onCall) de chat genérico
 */
export const queryModel = onCall(
  {
    secrets: [ollamaApiKeySecret],
    cors: true,
  },
  async (request) => {
    const data = request.data || {};
    const prompt = typeof data.prompt === 'string' ? data.prompt.trim() : '';
    const requestedModel = typeof data.model === 'string' && data.model.trim() ? data.model.trim() : undefined;
    const history: AIMessage[] = Array.isArray(data.history) ? data.history : [];

    if (!prompt) {
      throw new HttpsError('invalid-argument', 'La consulta no puede estar vacía.');
    }

    if (prompt.length > 4000) {
      throw new HttpsError('invalid-argument', 'La consulta supera el límite de 4000 caracteres.');
    }

    const { aiService, modelToUse } = createAIService(requestedModel);

    const messages: AIMessage[] = [
      ...history,
      { role: 'user', content: prompt },
    ];

    const response = await aiService.executeChat({
      provider: 'ollama',
      model: modelToUse,
      messages,
    });

    if (!response.success) {
      const statusCode = response.error?.statusCode;
      const errorCode = response.error?.code || 'UNKNOWN_ERROR';
      const errorMessage = response.error?.message || 'Error al comunicarse con Ollama Cloud.';

      if (statusCode === 402) {
        throw new HttpsError(
          'resource-exhausted',
          `Ollama Cloud: Cuenta sin créditos de uso suficientes para inferencia. ${errorMessage}`,
          { code: errorCode, statusCode }
        );
      }

      if (statusCode === 401) {
        throw new HttpsError(
          'unauthenticated',
          `Ollama Cloud: API Key no autorizada o inválida. ${errorMessage}`,
          { code: errorCode, statusCode }
        );
      }

      throw new HttpsError('internal', errorMessage, {
        code: errorCode,
        statusCode,
        details: response.error?.details,
      });
    }

    return {
      success: true,
      content: response.content,
      executionInfo: response.executionInfo,
    };
  }
);
