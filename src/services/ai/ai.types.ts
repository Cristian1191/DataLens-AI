/**
 * Tipos e interfaces base para los servicios de Inteligencia Artificial en DataLens AI.
 * Frontend desacoplado de la API Key: la comunicación se realiza vía backend (Firebase Functions).
 */

export type InterpretationIntent =
  | 'descriptive'
  | 'comparison'
  | 'trend'
  | 'relationship'
  | 'filter'
  | 'informational'
  | 'exploratory'
  | 'ambiguous';

export type AnalysisType =
  | 'descriptive'
  | 'comparative'
  | 'time_series'
  | 'correlation'
  | 'distribution'
  | 'filtering'
  | 'advisory';

export interface InterpretationVariables {
  target: string[];
  group_by: string[];
  time: string[];
}

export interface InterpretationFilter {
  column?: string;
  operator?: string;
  value?: string | number | boolean;
  rawExpression?: string;
}

export interface QueryInterpretation {
  intent: InterpretationIntent;
  objective: string;
  analysis_type: AnalysisType[];
  variables: InterpretationVariables;
  filters: (string | InterpretationFilter)[];
  requested_metrics: string[];
  requirements: string[];
  missing_information: string[];
  needs_clarification: boolean;
  clarification_question: string | null;
  confidence: number; // 0.0 - 1.0
  metadata?: {
    rawPrompt?: string;
    modelUsed?: string;
    durationMs?: number;
    source?: 'ollama-cloud' | 'semantic-fallback';
    warning?: string;
  };
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface BackendExecutionInfo {
  provider: string;
  model: string;
  durationMs: number;
  totalTokens?: number;
  promptTokens?: number;
}

export interface AIQueryResult {
  success: boolean;
  content: string;
  executionInfo?: BackendExecutionInfo;
  error?: string;
}

export interface AIQueryOptions {
  model?: string;
  history?: AIMessage[];
}

export interface OllamaConfig {
  baseUrl: string;
  defaultModel: string;
}

export interface OllamaModelInfo {
  name: string;
  modified_at?: string;
  size?: number;
  digest?: string;
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaGenerateRequest {
  prompt: string;
  model?: string;
  stream?: boolean;
  system?: string;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
    [key: string]: unknown;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaChatRequest {
  messages: OllamaChatMessage[];
  model?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    [key: string]: unknown;
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaChatMessage;
  done: boolean;
  total_duration?: number;
}

export interface AIProviderStatus {
  provider: 'ollama' | 'firebase-ai';
  isAvailable: boolean;
  details?: string;
  version?: string;
}
