import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  History,
  Bookmark,
  Settings,
  Sparkles,
  Search,
  ExternalLink,
  User,
  ShieldCheck,
} from 'lucide-react';

interface LeftSidebarProps {
  onNewQuery: () => void;
  activeReportId?: string;
  onSelectHistoryItem?: (id: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onNewQuery,
  activeReportId,
  onSelectHistoryItem,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const historyItems = [
    { id: 'rep-rag-vs-finetuning', title: 'RAG vs Fine-tuning en producción', date: 'Hoy' },
    { id: 'rep-vector-db', title: 'Benchmarking Vector DBs 2026', date: 'Ayer' },
    { id: 'rep-graph-rag', title: 'GraphRAG en finanzas y compliance', date: '14 Nov' },
    { id: 'rep-reasoning-llm', title: 'Modelos de razonamiento autónomo', date: '10 Nov' },
  ];

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#191919] border-r border-[#3D3D3D] transition-all duration-300 ease-in-out select-none z-20 ${
        isCollapsed ? 'w-16' : 'w-[240px]'
      }`}
    >
      {/* Top Header: Logo + Collapse Toggle */}
      <div className="flex items-center justify-between h-14 px-3.5 border-b border-[#3D3D3D]/60">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-[#F3F4F6] leading-none">
                DataLens<span className="text-[#14B8A6]">.ai</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] font-mono tracking-wider uppercase mt-0.5">
                Consensus UI
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto flex items-center justify-center w-8 h-8 rounded-lg bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/30">
            <Sparkles className="w-4 h-4" />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          className={`p-1.5 rounded-md text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#363636] transition-colors ${
            isCollapsed ? 'mt-2 mx-auto' : ''
          }`}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Action: New Query Button */}
      <div className="p-3">
        <button
          onClick={onNewQuery}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#363636] hover:bg-[#424242] border border-[#3D3D3D] text-[#F3F4F6] text-xs font-medium transition-all shadow-sm group ${
            isCollapsed ? 'px-0' : ''
          }`}
          title="Iniciar nueva consulta agéntica"
        >
          <Plus className="w-4 h-4 text-[#14B8A6] group-hover:scale-110 transition-transform" />
          {!isCollapsed && <span>Nueva consulta</span>}
        </button>
      </div>

      {/* Navigation & History Section */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
        {/* History Group */}
        <div>
          {!isCollapsed && (
            <div className="px-2 mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              <span>Historial</span>
              <History className="w-3 h-3 opacity-60" />
            </div>
          )}
          <nav className="space-y-0.5">
            {historyItems.map((item) => {
              const isActive = activeReportId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectHistoryItem?.(item.id)}
                  title={item.title}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs text-left transition-colors truncate ${
                    isActive
                      ? 'bg-[#2E2E2E] text-[#14B8A6] font-medium border-l-2 border-[#14B8A6]'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#2E2E2E]/60'
                  }`}
                >
                  <History className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#14B8A6]' : 'opacity-70'}`} />
                  {!isCollapsed && <span className="truncate">{item.title}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Saved & Quick Links */}
        <div>
          {!isCollapsed && (
            <div className="px-2 mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              <span>Biblioteca</span>
              <Bookmark className="w-3 h-3 opacity-60" />
            </div>
          )}
          <nav className="space-y-0.5">
            <button
              title="Guardados y marcadores"
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#2E2E2E]/60 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
              {!isCollapsed && <span>Guardados</span>}
            </button>
            <button
              title="Configuración de agentes y modelos"
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#2E2E2E]/60 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
              {!isCollapsed && <span>Configuración</span>}
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom Profile / Status Area */}
      <div className="p-3 border-t border-[#3D3D3D]/60 bg-[#161616]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[#363636] border border-[#3D3D3D] flex items-center justify-center text-xs font-semibold text-[#F3F4F6]">
                <User className="w-3.5 h-3.5 text-[#14B8A6]" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-medium text-[#F3F4F6] truncate">Investigador Pro</span>
                <span className="text-[10px] text-[#14B8A6] flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-2.5 h-2.5" /> Plan Enterprise
                </span>
              </div>
            </div>
            <a
              href="https://consensus.app"
              target="_blank"
              rel="noreferrer"
              title="Inspirado en Consensus.app"
              className="p-1 rounded text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#363636] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-7 h-7 rounded-full bg-[#363636] border border-[#3D3D3D] flex items-center justify-center text-xs font-semibold text-[#F3F4F6]">
              <User className="w-3.5 h-3.5 text-[#14B8A6]" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
