/**
 * DataLens AI - Abstracción de Proveedor para DeepSeek-R1 (Fase 4)
 * Permite gestionar inferencia tanto en Ollama Cloud como en endpoints GPU dedicados (vLLM / Transformers).
 */

import { AIMessage } from './provider.types';

export interface DeepSeekInferenceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface DeepSeekInferenceResponse {
  success: boolean;
  content: string;
  durationMs: number;
  model: string;
  error?: {
    code: string;
    message: string;
    statusCode?: number;
  };
}

export interface IDeepSeekClient {
  generateReasoning(
    systemPrompt: string,
    userPrompt: string,
    options?: DeepSeekInferenceOptions
  ): Promise<DeepSeekInferenceResponse>;
}

export class DeepSeekClient implements IDeepSeekClient {
  private apiKey: string;
  private endpointUrl: string;
  private defaultModel: string;
  private defaultTimeoutMs: number;

  constructor(options: {
    apiKey: string;
    endpointUrl?: string;
    defaultModel?: string;
    defaultTimeoutMs?: number;
  }) {
    this.apiKey = options.apiKey?.trim() || '';
    this.endpointUrl = options.endpointUrl || 'https://ollama.com';
    this.defaultModel = options.defaultModel || 'deepseek-v4.1-flash';
    this.defaultTimeoutMs = options.defaultTimeoutMs || 60000;
  }

  public async generateReasoning(
    systemPrompt: string,
    userPrompt: string,
    options?: DeepSeekInferenceOptions
  ): Promise<DeepSeekInferenceResponse> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;
    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const payload = {
      model,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.1,
        ...(options?.maxTokens ? { num_predict: options.maxTokens } : {}),
      },
    };

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.endpointUrl}/api/chat`, {
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
      const text = await response.text();

      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { raw: text };
      }

      if (!response.ok) {
        return {
          success: false,
          content: '',
          durationMs,
          model,
          error: {
            code: `HTTP_${response.status}`,
            message: parsed?.error || `Error HTTP ${response.status} de inferencia en DeepSeek-R1`,
            statusCode: response.status,
          },
        };
      }

      const content = parsed?.message?.content || '';
      return {
        success: true,
        content,
        durationMs,
        model,
      };
    } catch (err: any) {
      clearTimeout(timeoutHandle);
      const durationMs = Date.now() - startTime;

      return {
        success: false,
        content: '',
        durationMs,
        model,
        error: {
          code: err.name === 'AbortError' ? 'TIMEOUT' : 'CONNECTION_ERROR',
          message: err.message || 'Error de comunicación con el motor de inferencia DeepSeek-R1',
        },
      };
    }
  }
}
