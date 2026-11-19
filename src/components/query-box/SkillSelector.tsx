import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Cpu, Sparkles, Scale, FileText, Compass, TrendingUp, Check } from 'lucide-react';
import { AgentSkill, SkillOption } from '../../types/agent';
import { AVAILABLE_SKILLS } from '../../data/mockReports';

interface SkillSelectorProps {
  selectedSkill: AgentSkill;
  onSelectSkill: (skill: AgentSkill) => void;
  disabled?: boolean;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({
  selectedSkill,
  onSelectSkill,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentSkill = AVAILABLE_SKILLS.find((s) => s.id === selectedSkill) || AVAILABLE_SKILLS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSkillIcon = (id: AgentSkill) => {
    switch (id) {
      case 'deep_analysis':
        return <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />;
      case 'comparative':
        return <Scale className="w-3.5 h-3.5 text-blue-400" />;
      case 'executive_summary':
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'gap_detection':
        return <Compass className="w-3.5 h-3.5 text-purple-400" />;
      case 'trend_forecast':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-[#14B8A6]" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Pill Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#363636] hover:bg-[#424242] border border-[#3D3D3D] text-[#F3F4F6] text-xs font-medium transition-all focus:outline-none focus:ring-1 focus:ring-[#14B8A6]/50 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Seleccionar agente especializado / Skill"
      >
        <span className="flex items-center gap-1">
          {getSkillIcon(currentSkill.id)}
          <span className="truncate max-w-[110px]">{currentSkill.label}</span>
        </span>
        <ChevronDown className={`w-3 h-3 text-[#9CA3AF] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-72 rounded-xl bg-[#232323] border border-[#3D3D3D] shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 border-b border-[#3D3D3D]/60 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Skills de Razonamiento
            </span>
            <span className="text-[10px] text-[#14B8A6] font-mono">Consensus Agent</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 py-1">
            {AVAILABLE_SKILLS.map((skill: SkillOption) => {
              const isSelected = skill.id === selectedSkill;
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => {
                    onSelectSkill(skill.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-[#2E2E2E] border border-[#14B8A6]/40 text-[#F3F4F6]'
                      : 'hover:bg-[#2E2E2E]/70 text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  <div className="mt-0.5">{getSkillIcon(skill.id)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-medium ${isSelected ? 'text-[#14B8A6]' : 'text-[#F3F4F6]'}`}>
                        {skill.label}
                      </span>
                      {skill.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#363636] text-[#9CA3AF] border border-[#3D3D3D] font-mono">
                          {skill.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] leading-snug line-clamp-2 mt-0.5">
                      {skill.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#14B8A6] flex-shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
