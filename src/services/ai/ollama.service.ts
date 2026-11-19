import {
  AIProviderStatus,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaConfig,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaModelInfo,
} from './ai.types';

/**
 * Servicio base de infraestructura para conectar con Ollama (Local AI).
 * Diseñado de forma agnóstica a la UI, usando fetch nativo sin dependencias externas.
 */
export class OllamaService {
  private config: OllamaConfig;

  constructor(customConfig?: Partial<OllamaConfig>) {
    this.config = {
      baseUrl:
        customConfig?.baseUrl ||
        (import.meta.env.VITE_OLLAMA_BASE_URL as string) ||
        'http://localhost:11434',
      defaultModel:
        customConfig?.defaultModel ||
        (import.meta.env.VITE_OLLAMA_DEFAULT_MODEL as string) ||
        'llama3',
    };
  }

  /**
   * Obtiene la configuración actual del servicio.
   */
  public getConfig(): Readonly<OllamaConfig> {
    return { ...this.config };
  }

  /**
   * Verifica la conectividad y disponibilidad del servidor Ollama local.
   */
  public async checkHealth(): Promise<AIProviderStatus> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/version`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return {
          provider: 'ollama',
          isAvailable: false,
          details: `Servidor respondió con estado HTTP ${response.status}`,
        };
      }

      const data = (await response.json()) as { version?: string };
      return {
        provider: 'ollama',
        isAvailable: true,
        version: data.version,
        details: 'Servidor Ollama en línea y accesible.',
      };
    } catch (error) {
      return {
        provider: 'ollama',
        isAvailable: false,
        details: error instanceof Error ? error.message : 'No se pudo conectar con Ollama',
      };
    }
  }

  /**
   * Lista los modelos disponibles localmente en la instancia de Ollama.
   */
  public async listModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status} al consultar modelos locales`);
      }

      const data = (await response.json()) as { models?: OllamaModelInfo[] };
      return data.models || [];
    } catch (error) {
      console.warn('[OllamaService] Error al listar modelos:', error);
      return [];
    }
  }

  /**
   * Envía una solicitud básica de generación de texto (/api/generate).
   * Modo no-stream por defecto para la fase de preparación de infraestructura.
   */
  public async generate(req: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
    const payload = {
      model: req.model || this.config.defaultModel,
      prompt: req.prompt,
      stream: req.stream ?? false,
      system: req.system,
      options: req.options,
    };

    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Ollama generate error: HTTP ${response.status}`);
    }

    return (await response.json()) as OllamaGenerateResponse;
  }

  /**
   * Envía una conversación multi-turno básica (/api/chat).
   */
  public async chat(req: OllamaChatRequest): Promise<OllamaChatResponse> {
    const payload = {
      model: req.model || this.config.defaultModel,
      messages: req.messages,
      stream: req.stream ?? false,
      options: req.options,
    };

    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Ollama chat error: HTTP ${response.status}`);
    }

    return (await response.json()) as OllamaChatResponse;
  }
}

// Instancia singleton por defecto para uso directo
export const defaultOllamaService = new OllamaService();
