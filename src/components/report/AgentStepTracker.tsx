import React, { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { AgentStep } from '../../types/agent';

interface AgentStepTrackerProps {
  steps: AgentStep[];
  isGenerating: boolean;
  totalTimeSeconds?: number;
}

export const AgentStepTracker: React.FC<AgentStepTrackerProps> = ({
  steps,
  isGenerating,
  totalTimeSeconds = 1.8,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const isAllCompleted = completedCount === steps.length && steps.length > 0;

  return (
    <div className="w-full mb-6 rounded-xl bg-[#282828] border border-[#3D3D3D] shadow-md overflow-hidden transition-all duration-200">
      {/* Header Summary Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-2.5 bg-[#2E2E2E] hover:bg-[#333333] cursor-pointer transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#14B8A6]/20 text-[#14B8A6]">
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="text-xs font-semibold text-[#F3F4F6] tracking-wide">
            {isGenerating
              ? 'Ejecutando pipeline de razonamiento agéntico...'
              : 'Síntesis agéntica completada con éxito'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#363636] text-[#14B8A6] border border-[#3D3D3D] font-mono">
            {completedCount}/{steps.length} pasos
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#9CA3AF] font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isGenerating ? 'Calculando...' : `${totalTimeSeconds.toFixed(1)}s`}
          </span>
          <button
            type="button"
            className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Steps Details */}
      {isExpanded && (
        <div className="p-3.5 bg-[#242424] border-t border-[#3D3D3D]/50 space-y-2">
          {/* Breadcrumb style summary on top */}
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF] flex-wrap pb-2 border-b border-[#3D3D3D]/30">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <span
                  className={`flex items-center gap-1 transition-colors ${
                    step.status === 'completed'
                      ? 'text-[#14B8A6] font-medium'
                      : step.status === 'in_progress'
                      ? 'text-white font-semibold'
                      : 'text-[#9CA3AF]/60'
                  }`}
                >
                  {step.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                  {step.status === 'in_progress' && <Loader2 className="w-3 h-3 animate-spin text-[#14B8A6]" />}
                  {step.status === 'pending' && <span className="w-2 h-2 rounded-full bg-[#3D3D3D]" />}
                  <span>{step.label}</span>
                </span>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-[#3D3D3D]" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Detailed step cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-2 rounded-lg border text-xs transition-all ${
                  step.status === 'completed'
                    ? 'bg-[#2A2A2A] border-[#14B8A6]/40 text-[#F3F4F6]'
                    : step.status === 'in_progress'
                    ? 'bg-[#2E2E2E] border-[#14B8A6] text-white ring-1 ring-[#14B8A6]/40 shadow-sm'
                    : 'bg-[#222222] border-[#3D3D3D] text-[#9CA3AF]/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-[#9CA3AF]">Paso 0{index + 1}</span>
                  {step.status === 'completed' && (
                    <span className="text-[10px] text-[#14B8A6] font-mono flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> OK
                    </span>
                  )}
                  {step.status === 'in_progress' && (
                    <span className="text-[10px] text-[#14B8A6] font-mono animate-pulse">
                      Procesando...
                    </span>
                  )}
                </div>
                <div className="font-medium text-[11px] mb-0.5 truncate">{step.label}</div>
                {step.detail && (
                  <div className="text-[10px] text-[#9CA3AF] line-clamp-2 leading-tight">
                    {step.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
