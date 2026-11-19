/**
 * Tipos e interfaces para el Agente Intérprete de Consultas (DataLens AI - Fase 3)
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
