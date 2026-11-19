/**
 * DataLens AI - Fase 4: Contratos y tipos para el Agente Analista Estadístico
 * Esquema tipado y versionado (schema_version: '1.0').
 */

import { QueryInterpretation } from './interpreter.types';

export type ColumnType = 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'text';

export interface ColumnMetadata {
  name: string;
  type: ColumnType;
  nullCount: number;
  totalCount: number;
  cardinality: number;
  sampleValues?: (string | number | boolean)[];
  statistics?: {
    min?: number;
    max?: number;
    mean?: number;
    std?: number;
    median?: number;
  };
}

export interface DatasetMetadata {
  datasetId: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnMetadata[];
  description?: string;
  appliedFilters?: string[];
}

export type StatisticalCategory =
  | 'descriptive'
  | 'inferential'
  | 'correlation'
  | 'regression'
  | 'hypothesis_testing'
  | 'group_comparison'
  | 'distribution'
  | 'anomaly_detection'
  | 'time_series'
  | 'multivariate';

export interface StatisticalMethodDefinition {
  id: string;
  name: string;
  category: StatisticalCategory;
  description: string;
  supportedVariableTypes: {
    target: ColumnType[];
    group_by?: ColumnType[];
    secondary?: ColumnType[];
  };
  minSampleSize: number;
  assumptionsToCheck: string[];
  alternatives: string[];
  executionId: string;
}

export interface AnalysisMethodPlan {
  method_id: string;
  purpose: string;
  input_variables: string[];
  assumptions_to_check: string[];
  alternatives: string[];
  execution_id: string;
}

export type PlanStatus =
  | 'success'
  | 'needs_clarification'
  | 'invalid_plan'
  | 'unsupported_analysis'
  | 'error';

export interface AnalysisValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StatisticalAnalysisPlan {
  schema_version: '1.0';
  agent: 'statistical_analyst';
  status: PlanStatus;
  objective: string;
  analysis_plan: {
    dataset_requirements: string[];
    variables: string[];
    methods: AnalysisMethodPlan[];
  };
  validation: AnalysisValidationResult;
  execution_required: boolean;
  reasoning_summary: string;
  metadata?: {
    modelUsed?: string;
    durationMs?: number;
    provider?: string;
    source?: 'deepseek-r1' | 'methodological-fallback';
    errorDetails?: string;
  };
}

export interface AnalystAgentRequest {
  interpretation: QueryInterpretation;
  dataset: DatasetMetadata;
  preferredModel?: string;
}
