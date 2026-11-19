/**
 * Contrato común para proveedores de IA en DataLens AI (Backend / Firebase Functions)
 * Diseñado para admitir múltiples proveedores (Ollama Cloud, Gemini, modelos especializados).
 */

export type AIProviderId = 'ollama' | 'gemini' | 'specialized';

export type AIMessageRole = 'system' | 'user' | 'assistant';

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

export interface AIProviderRequest {
  provider?: AIProviderId;
  model?: string;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AIExecutionInfo {
  provider: AIProviderId;
  model: string;
  durationMs: number;
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
}

export interface AIProviderResponse {
  success: boolean;
  content: string;
  executionInfo: AIExecutionInfo;
  rawResponse?: unknown;
  error?: {
    code: string;
    message: string;
    statusCode?: number;
    details?: unknown;
  };
}

export interface IAIProvider {
  readonly id: AIProviderId;
  generateChat(request: AIProviderRequest): Promise<AIProviderResponse>;
}
