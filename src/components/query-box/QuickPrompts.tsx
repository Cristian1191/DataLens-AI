import React from 'react';
import { Sparkles, Scale, Compass } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  const prompts = [
    {
      label: 'Identificar brechas',
      query: 'Identificar brechas metodológicas en arquitecturas RAG y modelos de razonamiento',
      icon: <Compass className="w-3 h-3 text-purple-400" />,
    },
    {
      label: 'Generar revisión profunda',
      query: 'Generar revisión profunda: Arquitectura RAG vs Fine-tuning en producción',
      icon: <Sparkles className="w-3 h-3 text-[#14B8A6]" />,
    },
    {
      label: 'Crear tabla comparativa',
      query: 'Crear tabla comparativa: Vector Databases y costos de inferencia 2026',
      icon: <Scale className="w-3 h-3 text-blue-400" />,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2">
      {prompts.map((item, idx) => (
        <button
          key={idx}
          type="button"
          disabled={disabled}
          onClick={() => onSelectPrompt(item.query)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#363636] hover:bg-[#424242] border border-[#3D3D3D] text-[#F3F4F6] text-[11px] font-medium transition-all hover:border-[#14B8A6]/40 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
          title={`Ejecutar: "${item.query}"`}
        >
          <span className="opacity-80 group-hover:opacity-100 transition-opacity">
            {item.icon}
          </span>
          <span className="truncate max-w-[170px] text-[#9CA3AF] group-hover:text-[#F3F4F6]">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};
