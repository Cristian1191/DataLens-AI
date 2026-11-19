import {
  AIProviderId,
  AIProviderRequest,
  AIProviderResponse,
  IAIProvider,
} from '../providers/provider.types';

/**
 * Capa común de acceso a modelos de IA para DataLens AI.
 * Permite registrar proveedores independientes manteniendo un contrato único.
 */
export class AIService {
  private providers: Map<AIProviderId, IAIProvider> = new Map();
  private defaultProviderId: AIProviderId = 'ollama';

  constructor(initialProviders?: IAIProvider[]) {
    if (initialProviders) {
      for (const p of initialProviders) {
        this.registerProvider(p);
      }
    }
  }

  /**
   * Registra un proveedor de IA (p. ej., Ollama, y en el futuro Gemini).
   */
  public registerProvider(provider: IAIProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Ejecuta una consulta a través del proveedor indicado o el proveedor por defecto.
   */
  public async executeChat(request: AIProviderRequest): Promise<AIProviderResponse> {
    const providerId = request.provider || this.defaultProviderId;
    const provider = this.providers.get(providerId);

    if (!provider) {
      return {
        success: false,
        content: '',
        executionInfo: {
          provider: providerId,
          model: request.model || 'unknown',
          durationMs: 0,
        },
        error: {
          code: 'PROVIDER_NOT_FOUND',
          message: `El proveedor de IA "${providerId}" no está registrado ni disponible en el backend.`,
        },
      };
    }

    return provider.generateChat(request);
  }
}
