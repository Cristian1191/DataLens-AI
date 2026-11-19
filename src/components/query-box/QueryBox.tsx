import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Plus, Paperclip, X } from 'lucide-react';
import { AgentSkill, QueryFilters } from '../../types/agent';
import { SkillSelector } from './SkillSelector';
import { FilterPopover } from './FilterPopover';
import { QuickPrompts } from './QuickPrompts';

interface QueryBoxProps {
  onSubmitQuery: (query: string, options: { skill: AgentSkill; isDeep: boolean; filters: QueryFilters }) => void;
  isGenerating?: boolean;
  initialQuery?: string;
}

export const QueryBox: React.FC<QueryBoxProps> = ({
  onSubmitQuery,
  isGenerating = false,
  initialQuery = '',
}) => {
  const [text, setText] = useState<string>(initialQuery);
  const [selectedSkill, setSelectedSkill] = useState<AgentSkill>('deep_analysis');
  const [isDeep, setIsDeep] = useState<boolean>(true);
  const [filters, setFilters] = useState<QueryFilters>({
    dateRange: 'all',
    sourceType: 'all',
    minConfidence: 85,
    strictEvidence: true,
  });
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialQuery) {
      setText(initialQuery);
      adjustTextareaHeight();
    }
  }, [initialQuery]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // limit max height to 180px
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;

    onSubmitQuery(trimmed, {
      skill: selectedSkill,
      isDeep,
      filters,
    });

    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleAttachMockFile = () => {
    const mockFileNames = ['dataset_evaluation_rag_2026.pdf', 'benchmark_metrics.csv', 'compliance_audit.json'];
    const randomFile = mockFileNames[Math.floor(Math.random() * mockFileNames.length)];
    if (!attachedFiles.includes(randomFile)) {
      setAttachedFiles((prev) => [...prev, randomFile]);
    }
  };

  const removeAttachedFile = (fileName: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f !== fileName));
  };

  const canSubmit = text.trim().length > 0 && !isGenerating;

  return (
    <div className="w-full">
      {/* Attached Files Pills (if any) */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 px-1">
          {attachedFiles.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#232323] border border-[#3D3D3D] text-[10px] text-[#14B8A6] font-mono"
            >
              <Paperclip className="w-3 h-3" />
              <span className="truncate max-w-[140px]">{f}</span>
              <button
                type="button"
                onClick={() => removeAttachedFile(f)}
                className="text-[#9CA3AF] hover:text-red-400 ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Consensus Styled Main QueryBox */}
      <div className="relative rounded-2xl bg-[#2E2E2E] border border-[#3D3D3D] transition-all duration-200 focus-within:border-[#14B8A6]/60 focus-within:ring-1 focus-within:ring-[#14B8A6]/30 shadow-lg">
        {/* Input Area */}
        <div className="px-3.5 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder="Escribe tu consulta o instruye al agente..."
            className="w-full bg-transparent text-[#F3F4F6] placeholder-[#9CA3AF] text-sm resize-none outline-none leading-relaxed min-h-[38px] max-h-[180px] overflow-y-auto"
          />
        </div>

        {/* Bottom Control Bar inside the Box */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 gap-2 border-t border-[#3D3D3D]/40">
          {/* Left Controls: Plus (Attach) + SkillSelector + Deep+ */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Attachment Button */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleAttachMockFile}
              className="w-7 h-7 rounded-full bg-[#363636] hover:bg-[#424242] border border-[#3D3D3D] flex items-center justify-center text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors focus:outline-none disabled:opacity-50"
              title="Adjuntar archivo de contexto o dataset"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Skill Selector Dropdown */}
            <SkillSelector
              selectedSkill={selectedSkill}
              onSelectSkill={setSelectedSkill}
              disabled={isGenerating}
            />

            {/* Deep Toggle Pill */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setIsDeep(!isDeep)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isDeep
                  ? 'border border-dashed border-[#14B8A6] text-[#14B8A6] bg-[#14B8A6]/10 shadow-[0_0_12px_rgba(20,184,166,0.15)]'
                  : 'bg-[#363636] hover:bg-[#424242] border border-[#3D3D3D] text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
              title={isDeep ? 'Búsqueda profunda activa (Multi-hop reasoning)' : 'Activar búsqueda profunda'}
            >
              <span className="font-semibold">Deep</span>
              <span>{isDeep ? '✓' : '+'}</span>
            </button>
          </div>

          {/* Right Controls: Filter + Submit Arrow */}
          <div className="flex items-center gap-1.5">
            <FilterPopover
              filters={filters}
              onFiltersChange={setFilters}
              disabled={isGenerating}
            />

            {/* Circular Blue Send Button */}
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${
                canSubmit
                  ? 'bg-[#0F74DE] hover:bg-[#1A84F2] text-white shadow-md hover:scale-105 active:scale-95'
                  : 'bg-[#363636] text-[#9CA3AF]/40 cursor-not-allowed border border-[#3D3D3D]'
              }`}
              title={isGenerating ? 'Generando análisis...' : 'Enviar consulta al agente'}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Suggestion Prompts below QueryBox */}
      <QuickPrompts
        onSelectPrompt={(promptText) => {
          setText(promptText);
          adjustTextareaHeight();
        }}
        disabled={isGenerating}
      />
    </div>
  );
};
