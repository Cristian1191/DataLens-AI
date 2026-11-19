import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  Sparkles,
  Layers,
  Search,
  Filter,
  TrendingUp,
  FileText,
  BarChart3,
  BookOpen,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';
import { Citation, GeneratedReport, TableRowData } from '../../types/agent';

interface ReportBlocksProps {
  report: GeneratedReport;
}

export const ReportBlocks: React.FC<ReportBlocksProps> = ({ report }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [tableSearch, setTableSearch] = useState<string>('');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');
  const [activeCitationTooltip, setActiveCitationTooltip] = useState<number | null>(null);
  const [copiedTable, setCopiedTable] = useState<boolean>(false);

  const handleCopySynthesis = () => {
    const textToCopy = `${report.title}\n\n${report.executiveSummary}\n\nGenerado con DataLens AI.`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    const mdContent = `# ${report.title}
## ${report.subtitle}
*Generado: ${report.createdAt} | Skill: ${report.skillUsed}*

### Resumen Ejecutivo
${report.executiveSummary}

### Métricas Clave
${report.metrics.map((m) => `- **${m.label}**: ${m.value} (${m.change || ''}) - ${m.description}`).join('\n')}

### Secciones
${report.sections
  .map(
    (s) => `#### ${s.title}\n${s.summary}\n\n${s.paragraphs.join('\n\n')}`
  )
  .join('\n\n')}

### Referencias y Citas
${report.citations.map((c) => `[${c.id}] ${c.title} (${c.year}) - ${c.source}`).join('\n')}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyTableCSV = () => {
    if (!report.tableData) return;
    const header = report.tableData.columns.map((c) => c.label).join('\t');
    const rows = report.tableData.rows
      .map((r) => `${r.dimension}\t${r.category}\t${r.solutionA}\t${r.solutionB}\t${r.verdict}\t${r.confidence}%`)
      .join('\n');
    navigator.clipboard.writeText(`${header}\n${rows}`);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2000);
  };

  // Filter table rows
  const filteredRows = (report.tableData?.rows || []).filter((row) => {
    const matchesSearch =
      row.dimension.toLowerCase().includes(tableSearch.toLowerCase()) ||
      row.category.toLowerCase().includes(tableSearch.toLowerCase()) ||
      row.solutionA.toLowerCase().includes(tableSearch.toLowerCase()) ||
      row.solutionB.toLowerCase().includes(tableSearch.toLowerCase());

    const matchesVerdict =
      verdictFilter === 'all' || row.verdict === verdictFilter;

    return matchesSearch && matchesVerdict;
  });

  const getCitation = (id: number): Citation | undefined => {
    return report.citations.find((c) => c.id === id);
  };

  const renderTextWithCitations = (text: string) => {
    // Regex matching [1], [2], etc.
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const citationId = parseInt(match[1], 10);
        const citation = getCitation(citationId);
        return (
          <span key={index} className="relative inline-block mx-0.5">
            <button
              type="button"
              onClick={() =>
                setActiveCitationTooltip(
                  activeCitationTooltip === citationId ? null : citationId
                )
              }
              onMouseEnter={() => setActiveCitationTooltip(citationId)}
              onMouseLeave={() => setActiveCitationTooltip(null)}
              className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#14B8A6] bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 border border-[#14B8A6]/30 rounded cursor-pointer transition-colors"
            >
              [{citationId}]
            </button>

            {/* Hover Tooltip */}
            {activeCitationTooltip === citationId && citation && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-2.5 rounded-lg bg-[#191919] border border-[#14B8A6]/40 text-[#F3F4F6] shadow-2xl z-50 text-left pointer-events-none animate-in fade-in zoom-in-95">
                <div className="text-[10px] text-[#14B8A6] font-mono mb-0.5 flex items-center justify-between">
                  <span>Cita de Evidencia [{citation.id}]</span>
                  <span>{citation.year}</span>
                </div>
                <div className="text-xs font-semibold leading-snug mb-1">
                  {citation.title}
                </div>
                <div className="text-[11px] text-[#9CA3AF] mb-1 italic">
                  {citation.source}
                </div>
                {citation.snippet && (
                  <div className="text-[10px] text-[#9CA3AF] bg-[#232323] p-1.5 rounded border border-[#3D3D3D] leading-tight">
                    "{citation.snippet}"
                  </div>
                )}
              </div>
            )}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full space-y-8 pb-16">
      {/* 1. Header of the Report */}
      <div className="border-b border-[#3D3D3D]/60 pb-6">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Consensus Synthesis</span>
            </span>
            {report.isDeep && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-[#14B8A6] text-[#14B8A6] bg-[#14B8A6]/5 font-mono">
                Deep Reasoning
              </span>
            )}
            <span className="text-xs text-[#9CA3AF] font-mono">
              • {report.createdAt}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySynthesis}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#363636] hover:bg-[#424242] border border-[#3D3D3D] text-[#F3F4F6] text-xs font-medium transition-colors"
              title="Copiar texto del reporte"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#14B8A6]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#363636] hover:bg-[#424242] border border-[#3D3D3D] text-[#F3F4F6] text-xs font-medium transition-colors"
              title="Descargar reporte en formato Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar MD</span>
            </button>
          </div>
        </div>

        <h1 className="text-2xl lg:text-3xl font-bold text-[#F3F4F6] tracking-tight leading-snug">
          {report.title}
        </h1>
        <p className="text-sm text-[#9CA3AF] mt-2 leading-relaxed max-w-4xl">
          {renderTextWithCitations(report.subtitle)}
        </p>
      </div>

      {/* 2. Executive Summary / Consensus Card */}
      <div className="relative rounded-xl bg-[#282828] border-l-4 border-l-[#14B8A6] border-y border-r border-[#3D3D3D] p-5 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#14B8A6] uppercase tracking-wider mb-2.5">
          <Layers className="w-4 h-4" />
          <span>Resumen de Consenso y Hallazgo Principal</span>
        </div>
        <p className="text-sm text-[#F3F4F6] leading-relaxed">
          {renderTextWithCitations(report.executiveSummary)}
        </p>
      </div>

      {/* 3. Key Metrics Cards Grid */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">
          <BarChart3 className="w-4 h-4 text-[#14B8A6]" />
          <span>Métricas Cuantitativas de Referencia</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {report.metrics.map((metric, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-[#282828] border border-[#3D3D3D] p-4 hover:border-[#14B8A6]/40 transition-colors shadow-sm"
            >
              <div className="text-xs text-[#9CA3AF] font-medium truncate mb-1">
                {metric.label}
              </div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-2xl font-bold text-[#F3F4F6] font-mono tracking-tight">
                  {metric.value}
                </span>
                {metric.change && (
                  <span
                    className={`text-[11px] font-medium font-mono ${
                      metric.isPositive ? 'text-[#14B8A6]' : 'text-amber-400'
                    }`}
                  >
                    {metric.change}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#9CA3AF] leading-snug">
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Structured Sections */}
      <div className="space-y-6">
        {report.sections.map((section) => (
          <div
            key={section.id}
            className="rounded-xl bg-[#282828] border border-[#3D3D3D] p-6 shadow-sm space-y-3"
          >
            <h3 className="text-base font-semibold text-[#F3F4F6] flex items-center justify-between border-b border-[#3D3D3D]/60 pb-3">
              <span>{section.title}</span>
              <span className="text-[11px] text-[#14B8A6] font-mono font-normal">
                {section.citations.length} fuentes validadas
              </span>
            </h3>
            <p className="text-xs font-medium text-[#14B8A6] italic">
              {section.summary}
            </p>
            <div className="space-y-3 pt-1">
              {section.paragraphs.map((p, idx) => (
                <p key={idx} className="text-sm text-[#F3F4F6] leading-relaxed">
                  {renderTextWithCitations(p)}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 5. Interactive Comparative Table */}
      {report.tableData && (
        <div className="rounded-xl bg-[#282828] border border-[#3D3D3D] overflow-hidden shadow-lg">
          {/* Table Header & Controls */}
          <div className="p-4 bg-[#262626] border-b border-[#3D3D3D] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#F3F4F6] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#14B8A6]" />
                {report.tableData.title}
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {report.tableData.description}
              </p>
            </div>

            {/* Filter & Export Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search in table */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar en tabla..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="pl-8 pr-2.5 py-1.5 rounded-lg bg-[#363636] border border-[#3D3D3D] text-xs text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              {/* Verdict filter */}
              <select
                value={verdictFilter}
                onChange={(e) => setVerdictFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[#363636] border border-[#3D3D3D] text-xs text-[#F3F4F6] focus:outline-none focus:border-[#14B8A6]"
              >
                <option value="all">Todos los veredictos</option>
                <option value="Superior">Superior</option>
                <option value="Paridad">Paridad</option>
                <option value="Inferior">Inferior</option>
              </select>

              {/* Copy table CSV */}
              <button
                type="button"
                onClick={handleCopyTableCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#363636] hover:bg-[#424242] border border-[#3D3D3D] text-[#F3F4F6] text-xs font-medium transition-colors"
                title="Copiar datos tabulares en formato CSV / TSV"
              >
                {copiedTable ? <Check className="w-3.5 h-3.5 text-[#14B8A6]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTable ? 'Copiada' : 'Copiar TSV'}</span>
              </button>
            </div>
          </div>

          {/* Table Responsive Wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#3D3D3D] bg-[#232323] text-[#9CA3AF] uppercase text-[10px] tracking-wider font-semibold">
                  {report.tableData.columns.map((col) => (
                    <th key={col.key} className="py-3 px-4">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3D3D3D]/50 text-[#F3F4F6]">
                {filteredRows.length > 0 ? (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-[#303030] transition-colors"
                    >
                      <td className="py-3 px-4 font-medium flex items-center gap-1.5">
                        <span>{row.dimension}</span>
                        {row.citationIndex && (
                          <span className="text-[10px] font-mono text-[#14B8A6]">
                            [{row.citationIndex}]
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#9CA3AF]">
                        <span className="px-2 py-0.5 rounded-full bg-[#363636] border border-[#3D3D3D] text-[10px]">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#F3F4F6]">
                        {row.solutionA}
                      </td>
                      <td className="py-3 px-4 text-[#9CA3AF]">
                        {row.solutionB}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            row.verdict === 'Superior'
                              ? 'bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/40'
                              : row.verdict === 'Paridad'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {row.verdict}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-[#F3F4F6]">
                            {row.confidence}%
                          </span>
                          <div className="w-16 h-1.5 bg-[#363636] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#14B8A6] rounded-full"
                              style={{ width: `${row.confidence}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={report.tableData.columns.length}
                      className="py-8 text-center text-[#9CA3AF]"
                    >
                      No se encontraron filas que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Citations & References Section */}
      <div className="rounded-xl bg-[#282828] border border-[#3D3D3D] p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#3D3D3D]/60 mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F3F4F6]">
            <BookOpen className="w-4 h-4 text-[#14B8A6]" />
            <span>Fuentes Académicas y Evidencia Citada ({report.citations.length})</span>
          </div>
          <span className="text-[10px] text-[#9CA3AF] font-mono">
            Indexación Verificada Consensus
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.citations.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-lg bg-[#222222] border border-[#3D3D3D] hover:border-[#14B8A6]/50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold text-[#14B8A6]">
                    [{c.id}] {c.year}
                  </span>
                  {c.relevanceScore && (
                    <span className="text-[9px] font-mono text-[#9CA3AF] bg-[#363636] px-1.5 py-0.5 rounded">
                      {c.relevanceScore}% relevancia
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-[#F3F4F6] leading-snug mb-1 line-clamp-2">
                  {c.title}
                </h4>
                <p className="text-[11px] text-[#9CA3AF] mb-1.5">{c.source}</p>
                {c.snippet && (
                  <p className="text-[10px] text-[#9CA3AF] italic bg-[#282828] p-1.5 rounded border border-[#3D3D3D]/50 line-clamp-2">
                    "{c.snippet}"
                  </p>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-[#3D3D3D]/40 flex justify-end">
                <a
                  href={c.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-[#14B8A6] hover:underline flex items-center gap-1 font-mono"
                >
                  Ver estudio indexado <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
