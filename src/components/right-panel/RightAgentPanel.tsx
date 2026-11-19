import React, { useState } from 'react';
import {
  Bot,
  User,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Wand2,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { AgentSkill, ChatMessage, QueryFilters } from '../../types/agent';
import { QueryBox } from '../query-box/QueryBox';

interface RightAgentPanelProps {
  messages: ChatMessage[];
  onSendMessage: (query: string, options: { skill: AgentSkill; isDeep: boolean; filters: QueryFilters }) => void;
  onApplyRefinement: (refinement: string) => void;
  isGenerating: boolean;
}

export const RightAgentPanel: React.FC<RightAgentPanelProps> = ({
  messages,
  onSendMessage,
  onApplyRefinement,
  isGenerating,
}) => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);

  // Clarification questions / suggested agent queries
  const clarifyingQuestions = [
    '¿Deseas enfocar el análisis en reducción de TCO o latencia?',
    '¿Incluir benchmarks empíricos de Q1/Q2 2026?',
    '¿Añadir filtrado por cumplimiento de normativas GDPR?',
  ];

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#1E1E1E] border-l border-[#3D3D3D] transition-all duration-300 ease-in-out select-none z-10 ${
        isPanelCollapsed ? 'w-12' : 'w-[400px]'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between h-14 px-3.5 border-b border-[#3D3D3D]/60 bg-[#1A1A1A]">
        {!isPanelCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-7 h-7 rounded-lg bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/30 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#14B8A6] ring-2 ring-[#1E1E1E]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-[#F3F4F6]">Copilot Agéntico</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/30 font-mono">
                    Online
                  </span>
                </div>
                <span className="text-[10px] text-[#9CA3AF]">Consensus Reasoning Engine</span>
              </div>
            </div>

            <button
              onClick={() => setIsPanelCollapsed(true)}
              className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#363636] transition-colors"
              title="Colapsar panel de consulta"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsPanelCollapsed(false)}
            className="mx-auto p-1.5 rounded-md text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#363636] transition-colors"
            title="Expandir panel de consulta"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Conversation & Refinement Flow */}
      {!isPanelCollapsed ? (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* Welcome / Agent Instruction Notice */}
          <div className="p-3 rounded-xl bg-[#232323] border border-[#3D3D3D]/70 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#14B8A6]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instrucciones Agénticas</span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              Formula preguntas complejas o hipótesis de investigación. El agente sintetizará
              estudios con rigor metodológico y generará el reporte en el lienzo central.
            </p>
          </div>

          {/* Chat Messages */}
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'agent' && (
                  <div className="w-6 h-6 rounded-full bg-[#14B8A6]/15 text-[#14B8A6] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#14B8A6]/30">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#0F74DE] text-white shadow-sm'
                      : 'bg-[#2E2E2E] text-[#F3F4F6] border border-[#3D3D3D]'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="block text-[9px] opacity-60 text-right mt-1 font-mono">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-[#363636] text-[#F3F4F6] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#3D3D3D]">
                    <User className="w-3.5 h-3.5 text-[#14B8A6]" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Clarifying Questions Chips from Agent */}
          <div className="pt-2">
            <div className="flex items-center gap-1 text-[11px] font-medium text-[#9CA3AF] mb-1.5">
              <HelpCircle className="w-3 h-3 text-[#14B8A6]" />
              <span>Aclaraciones sugeridas:</span>
            </div>
            <div className="space-y-1.5">
              {clarifyingQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => onApplyRefinement(q)}
                  className="w-full text-left p-2 rounded-lg bg-[#2E2E2E]/60 hover:bg-[#363636] border border-[#3D3D3D] text-[11px] text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors leading-snug flex items-start gap-1.5 group"
                >
                  <span className="text-[#14B8A6] opacity-70 group-hover:opacity-100 font-bold">›</span>
                  <span className="flex-1">{q}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Refinement Actions */}
          <div className="pt-2 border-t border-[#3D3D3D]/50">
            <div className="flex items-center gap-1 text-[11px] font-medium text-[#9CA3AF] mb-2">
              <Wand2 className="w-3 h-3 text-purple-400" />
              <span>Refinar Reporte Central:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Profundizar en el punto 2 (Seguridad)',
                'Convertir en tabla comparativa',
                'Extraer solo citas indexadas',
              ].map((refine, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => onApplyRefinement(refine)}
                  className="px-2.5 py-1 rounded-md bg-[#363636] hover:bg-[#424242] border border-[#3D3D3D] text-[10px] text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
                >
                  {refine}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center py-6 gap-6">
          <div className="writing-vertical-rl text-xs text-[#9CA3AF] tracking-wider uppercase rotate-180 font-mono">
            Panel de Consulta
          </div>
        </div>
      )}

      {/* Bottom Anchored QueryBox */}
      {!isPanelCollapsed && (
        <div className="p-3 bg-[#1A1A1A] border-t border-[#3D3D3D]/60 shadow-2xl">
          <QueryBox
            onSubmitQuery={onSendMessage}
            isGenerating={isGenerating}
          />
        </div>
      )}
    </aside>
  );
};
