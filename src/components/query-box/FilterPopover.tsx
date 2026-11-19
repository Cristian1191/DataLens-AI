import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check, RotateCcw } from 'lucide-react';
import { QueryFilters } from '../../types/agent';

interface FilterPopoverProps {
  filters: QueryFilters;
  onFiltersChange: (filters: QueryFilters) => void;
  disabled?: boolean;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  filters,
  onFiltersChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters =
    filters.dateRange !== 'all' ||
    filters.sourceType !== 'all' ||
    filters.strictEvidence ||
    filters.minConfidence > 80;

  const resetFilters = () => {
    onFiltersChange({
      dateRange: 'all',
      sourceType: 'all',
      minConfidence: 80,
      strictEvidence: true,
    });
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Filter Pill Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
          hasActiveFilters
            ? 'bg-[#363636] border-[#14B8A6] text-[#14B8A6]'
            : 'bg-[#363636] hover:bg-[#424242] border-[#3D3D3D] text-[#F3F4F6]'
        }`}
        title="Filtros de evidencia y fuentes"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filter</span>
        {hasActiveFilters && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-80 rounded-xl bg-[#232323] border border-[#3D3D3D] shadow-2xl p-3 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#3D3D3D]/60">
            <span className="text-xs font-semibold text-[#F3F4F6] flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#14B8A6]" />
              Filtros de Búsqueda
            </span>
            <button
              onClick={resetFilters}
              className="text-[11px] text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reiniciar
            </button>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1.5">
              Ventana Temporal
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'last_5_years', label: '5 años' },
                  { id: 'last_year', label: '1 año' },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    onFiltersChange({ ...filters, dateRange: option.id })
                  }
                  className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
                    filters.dateRange === option.id
                      ? 'bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6]'
                      : 'bg-[#2E2E2E] border-[#3D3D3D] text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Source Type */}
          <div>
            <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1.5">
              Tipología de Fuentes
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'all', label: 'Todas las fuentes' },
                  { id: 'peer_reviewed', label: 'Revisión por pares' },
                  { id: 'industry', label: 'Reportes de Industria' },
                  { id: 'whitepaper', label: 'Whitepapers' },
                ] as const
              ).map((src) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() =>
                    onFiltersChange({ ...filters, sourceType: src.id })
                  }
                  className={`px-2 py-1 rounded-md text-xs text-left truncate border transition-colors ${
                    filters.sourceType === src.id
                      ? 'bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6]'
                      : 'bg-[#2E2E2E] border-[#3D3D3D] text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strict Evidence Toggle */}
          <div className="pt-1 border-t border-[#3D3D3D]/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-[#F3F4F6]">Evidencia Estricta</div>
              <div className="text-[10px] text-[#9CA3AF]">
                Excluir fuentes no citadas directamente
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  strictEvidence: !filters.strictEvidence,
                })
              }
              className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                filters.strictEvidence ? 'bg-[#14B8A6]' : 'bg-[#363636]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  filters.strictEvidence ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
