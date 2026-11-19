import {
  AIMessage,
  AIProviderRequest,
  AIProviderResponse,
  IAIProvider,
} from './provider.types';

export interface OllamaProviderOptions {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeoutMs?: number;
}

export class OllamaProvider implements IAIProvider {
  public readonly id = 'ollama';
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeoutMs: number;

  constructor(options: OllamaProviderOptions) {
    if (!options.apiKey || !options.apiKey.trim()) {
      throw new Error('[OllamaProvider] Error: Se requiere una API Key válida para autenticar con Ollama Cloud.');
    }
    this.apiKey = options.apiKey.trim();
    this.baseUrl = options.baseUrl || 'https://ollama.com';
    this.defaultModel = options.defaultModel || 'gpt-oss:20b';
    this.timeoutMs = options.timeoutMs || 45000;
  }

  public async generateChat(request: AIProviderRequest): Promise<AIProviderResponse> {
    const startTime = Date.now();
    const targetModel = request.model?.trim() || this.defaultModel;

    // Construcción del payload oficial según https://docs.ollama.com/api/chat
    const payload = {
      model: targetModel,
      messages: request.messages.map((m: AIMessage) => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
      options: {
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
        ...(request.maxTokens !== undefined ? { num_predict: request.maxTokens } : {}),
      },
    };

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);
      const durationMs = Date.now() - startTime;

      // Lectura del cuerpo de la respuesta
      const textResponse = await response.text();
      let parsedData: any = null;
      try {
        parsedData = JSON.parse(textResponse);
      } catch {
        parsedData = { raw: textResponse };
      }

      // Si la respuesta no es 2xx, interpretar el error de Ollama Cloud
      if (!response.ok) {
        const errorMsg =
          parsedData?.error ||
          parsedData?.message ||
          `Ollama Cloud error HTTP ${response.status}: ${response.statusText}`;

        return {
          success: false,
          content: '',
          executionInfo: {
            provider: 'ollama',
            model: targetModel,
            durationMs,
          },
          rawResponse: parsedData,
          error: {
            code: `HTTP_${response.status}`,
            message: errorMsg,
            statusCode: response.status,
            details: parsedData,
          },
        };
      }

      // Validar estructura de respuesta: message.content
      const content = parsedData?.message?.content;
      if (typeof content !== 'string') {
        return {
          success: false,
          content: '',
          executionInfo: {
            provider: 'ollama',
            model: targetModel,
            durationMs,
          },
          rawResponse: parsedData,
          error: {
            code: 'INVALID_RESPONSE_FORMAT',
            message: 'La respuesta de Ollama Cloud no contiene el campo "message.content" esperado.',
            statusCode: response.status,
            details: parsedData,
          },
        };
      }

      return {
        success: true,
        content,
        executionInfo: {
          provider: 'ollama',
          model: targetModel,
          durationMs,
          totalTokens: parsedData?.eval_count,
          promptTokens: parsedData?.prompt_eval_count,
        },
        rawResponse: parsedData,
      };
    } catch (err: any) {
      clearTimeout(timeoutHandle);
      const durationMs = Date.now() - startTime;

      if (err.name === 'AbortError') {
        return {
          success: false,
          content: '',
          executionInfo: {
            provider: 'ollama',
            model: targetModel,
            durationMs,
          },
          error: {
            code: 'TIMEOUT',
            message: `La solicitud a Ollama Cloud superó el tiempo límite de ${this.timeoutMs}ms.`,
            statusCode: 408,
          },
        };
      }

      return {
        success: false,
        content: '',
        executionInfo: {
          provider: 'ollama',
          model: targetModel,
          durationMs,
        },
        error: {
          code: 'NETWORK_ERROR',
          message: err?.message || 'Error desconocido al conectar con Ollama Cloud.',
          details: err,
        },
      };
    }
  }
}
