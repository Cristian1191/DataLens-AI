export type AgentSkill = 
  | 'deep_analysis'
  | 'comparative'
  | 'executive_summary'
  | 'gap_detection'
  | 'trend_forecast';

export interface SkillOption {
  id: AgentSkill;
  label: string;
  description: string;
  icon?: string;
  badge?: string;
}

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface AgentStep {
  id: string;
  label: string;
  detail?: string;
  status: StepStatus;
  durationMs?: number;
}

export interface Citation {
  id: number;
  title: string;
  source: string;
  year?: number;
  url?: string;
  relevanceScore?: number;
  snippet?: string;
}

export interface MetricCardData {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  description: string;
}

export interface TableRowData {
  id: string;
  dimension: string;
  category: string;
  solutionA: string;
  solutionB: string;
  verdict: 'Superior' | 'Paridad' | 'Inferior' | 'Requiere Datos';
  confidence: number; // 0 - 100
  citationIndex?: number;
}

export interface ReportSection {
  id: string;
  title: string;
  summary: string;
  paragraphs: string[];
  citations: number[]; // Refers to Citation id
}

export interface GeneratedReport {
  id: string;
  query: string;
  title: string;
  subtitle: string;
  skillUsed: AgentSkill;
  isDeep: boolean;
  createdAt: string;
  executiveSummary: string;
  metrics: MetricCardData[];
  sections: ReportSection[];
  tableData?: {
    title: string;
    description: string;
    columns: { key: keyof TableRowData; label: string }[];
    rows: TableRowData[];
  };
  citations: Citation[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  suggestedQuestions?: string[];
  refinements?: string[];
  linkedReportId?: string;
}

export interface QueryFilters {
  dateRange: 'all' | 'last_year' | 'last_5_years' | 'custom';
  sourceType: 'all' | 'peer_reviewed' | 'industry' | 'whitepaper';
  minConfidence: number;
  strictEvidence: boolean;
}
