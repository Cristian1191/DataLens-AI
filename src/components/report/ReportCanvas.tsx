import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Database,
  Search,
  Scale,
  BrainCircuit,
  Compass,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { AgentStep, GeneratedReport } from '../../types/agent';
import { QueryInterpretation } from '../../services/ai/ai.types';
import { AgentStepTracker } from './AgentStepTracker';
import { ReportBlocks } from './ReportBlocks';

interface ReportCanvasProps {
  activeReport: GeneratedReport | null;
  isGenerating: boolean;
  agentSteps: AgentStep[];
  interpretation?: QueryInterpretation | null;
  onSelectSampleQuery: (query: string) => void;
}

export const ReportCanvas: React.FC<ReportCanvasProps> = ({
  activeReport,
  isGenerating,
  agentSteps,
  interpretation,
  onSelectSampleQuery,
}) => {
  const samplePrompts = [
    {
      title: 'RAG vs Fine-tuning en producción',
      description: 'Comparativa de latencia, precisión contextual, costo y gobernanza de datos empresariales.',
      icon: <Scale className="w-5 h-5 text-[#14B8A6]" />,
      badge: 'Popular',
    },
    {
      title: 'Benchmark Vector Databases 2026',
      description: 'Análisis de rendimiento entre Pinecone, Qdrant, Milvus y pgvector con filtrado de metadatos.',
      icon: <Database className="w-5 h-5 text-blue-400" />,
      badge: 'Benchmarks',
    },
    {
      title: 'Modelos de Razonamiento vs LLMs estándar',
      description: 'Evaluación empírica en tareas lógicas complejas, matemáticas y auditoría de código.',
      icon: <BrainCircuit className="w-5 h-5 text-purple-400" />,
      badge: 'Research',
    },
    {
      title: 'Identificar brechas en seguridad agéntica',
      description: 'Vectores de ataque indirecto (Prompt Injection) y aislamiento sandbox de agentes.',
      icon: <Compass className="w-5 h-5 text-emerald-400" />,
      badge: 'Security',
    },
  ];

  return (
    <main className="flex-1 h-full bg-[#232323] overflow-y-auto relative flex flex-col">
      {/* If there is no active report and not generating, show Initial Empty State */}
      {!activeReport && !isGenerating && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 max-w-4xl mx-auto w-full text-center select-none animate-in fade-in duration-300">
          {/* Brand Icon in #14B8A6 */}
          <div className="w-16 h-16 rounded-2xl bg-[#14B8A6]/10 border border-[#14B8A6]/30 flex items-center justify-center text-[#14B8A6] mb-6 shadow-[0_0_30px_rgba(20,184,166,0.12)]">
            <Sparkles className="w-8 h-8" />
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#F3F4F6] tracking-tight mb-3">
            ¿Qué deseas consultar hoy?
          </h1>
          <p className="text-sm lg:text-base text-[#9CA3AF] max-w-xl mb-10 leading-relaxed">
            DataLens AI sintetiza evidencia científica y benchmarks en tiempo real. Escribe
            tu pregunta en la barra inferior del <span className="text-[#14B8A6] font-medium">panel derecho</span> o selecciona una investigación recomendada.
          </p>

          {/* Quick Start Suggested Queries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
            {samplePrompts.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSampleQuery(sample.title)}
                className="p-4 rounded-xl bg-[#282828] hover:bg-[#2E2E2E] border border-[#3D3D3D] hover:border-[#14B8A6]/50 transition-all duration-200 group flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-[#363636] border border-[#3D3D3D]">
                      {sample.icon}
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#363636] text-[#9CA3AF] border border-[#3D3D3D]">
                      {sample.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#F3F4F6] group-hover:text-[#14B8A6] transition-colors mb-1">
                    {sample.title}
                  </h3>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed line-clamp-2">
                    {sample.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-[#14B8A6] mt-4 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <span>Ejecutar síntesis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>

          {/* Hint guide footer */}
          <div className="mt-12 flex items-center gap-2 text-xs text-[#9CA3AF]/70 font-mono">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Inspirado en la estética e indexación de Consensus.app</span>
          </div>
        </div>
      )}

      {/* Active Report or Generating State */}
      {(activeReport || isGenerating) && (
        <div className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto w-full">
          {/* Agent Step Tracker (Collapsible live progress) */}
          <AgentStepTracker
            steps={agentSteps}
            isGenerating={isGenerating}
          />

          {/* Structured Query Interpretation Banner (Fase 3: Agente Intérprete) */}
          {interpretation && (
            <div className="mb-6 rounded-xl bg-[#282828] border border-[#3D3D3D] p-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#3D3D3D]/60 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30 font-mono">
                    Intención: {interpretation.intent.toUpperCase()}
                  </span>
                  {interpretation.analysis_type?.map((t, idx) => (
                    <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#363636] text-[#9CA3AF] border border-[#3D3D3D]">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#9CA3AF]">
                  <span>Confianza: {(interpretation.confidence * 100).toFixed(0)}%</span>
                  {interpretation.metadata?.source && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#191919] text-[#14B8A6] border border-[#3D3D3D]">
                      {interpretation.metadata.source}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-[#F3F4F6] font-medium mb-2">
                <span className="text-[#9CA3AF]">Objetivo Analítico:</span> {interpretation.objective}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#9CA3AF] pt-1">
                <div className="p-2 rounded-lg bg-[#222222] border border-[#3D3D3D]">
                  <span className="font-semibold text-[#F3F4F6] block mb-0.5">Variables Objetivo</span>
                  <span>{interpretation.variables.target.join(', ') || 'Sin variable objetivo'}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#222222] border border-[#3D3D3D]">
                  <span className="font-semibold text-[#F3F4F6] block mb-0.5">Segmentación / Filtros</span>
                  <span>
                    {interpretation.variables.group_by.length > 0
                      ? `Agrupado por: ${interpretation.variables.group_by.join(', ')}`
                      : interpretation.filters.length > 0
                      ? `${interpretation.filters.length} filtro(s) activo(s)`
                      : 'Sin filtros'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#222222] border border-[#3D3D3D]">
                  <span className="font-semibold text-[#F3F4F6] block mb-0.5">Métricas Solicitadas</span>
                  <span>{interpretation.requested_metrics.join(', ') || 'No especificadas'}</span>
                </div>
              </div>

              {interpretation.needs_clarification && interpretation.clarification_question && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                  <span className="font-bold">⚠️ Aclaración requerida:</span>
                  <span className="flex-1">{interpretation.clarification_question}</span>
                </div>
              )}
            </div>
          )}

          {/* Render Full Generated Report */}
          {activeReport && (
            <ReportBlocks report={activeReport} />
          )}
        </div>
      )}
    </main>
  );
};
