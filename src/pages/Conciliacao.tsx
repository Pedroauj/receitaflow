import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Download, Search, UploadCloud, FileSpreadsheet, X } from "lucide-react";
import {
  compareReports,
  exportNotLaunchedToExcel,
  parseSpreadsheetFile,
  type ComparisonRow,
  type ComparisonSummary,
  type DivergenceType,
} from "@/lib/conciliacao";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatCurrencyShort = (value: number) => {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
};

const abbreviateCNPJ = (cnpj: string) => {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length === 14) return cnpj.slice(0, 10) + "/…";
  return cnpj;
};

const emptySummary: ComparisonSummary = {
  totalGovernmentNotes: 0,
  totalSystemNotes: 0,
  reconciled: 0,
  notLaunchedCount: 0,
  divergencesCount: 0,
  notLaunchedValue: 0,
  divergencesValue: 0,
};

type BadgeVariant = "green" | "red" | "amber" | "yellow" | "blue" | "cyan" | "purple";

const typeBadge: Record<DivergenceType, { variant: BadgeVariant; label: string }> = {
  "Lançada":                { variant: "green",  label: "Lançada" },
  "Não lançada":            { variant: "red",    label: "Não lançada" },
  "Valor divergente":       { variant: "amber",  label: "Valor divergente" },
  "Data divergente":        { variant: "yellow", label: "Data divergente" },
  "NF divergente":          { variant: "blue",   label: "NF divergente" },
  "CNPJ divergente":        { variant: "cyan",   label: "CNPJ divergente" },
  "Múltiplas divergências": { variant: "purple", label: "Múltiplas diverg." },
};

const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  green:  { background: "rgba(99,153,34,.12)",   color: "#97C459", border: "0.5px solid rgba(99,153,34,.3)" },
  red:    { background: "rgba(226,75,74,.12)",   color: "#F09595", border: "0.5px solid rgba(226,75,74,.3)" },
  amber:  { background: "rgba(239,159,39,.10)",  color: "#FAC775", border: "0.5px solid rgba(239,159,39,.25)" },
  yellow: { background: "rgba(234,220,100,.10)", color: "#e8d96b", border: "0.5px solid rgba(234,220,100,.25)" },
  blue:   { background: "rgba(55,138,221,.10)",  color: "#85B7EB", border: "0.5px solid rgba(55,138,221,.25)" },
  cyan:   { background: "rgba(29,158,117,.10)",  color: "#5DCAA5", border: "0.5px solid rgba(29,158,117,.25)" },
  purple: { background: "rgba(127,119,221,.10)", color: "#AFA9EC", border: "0.5px solid rgba(127,119,221,.25)" },
};

function DonutChart({
  reconciled,
  notLaunched,
  divergences,
}: {
  reconciled: number;
  notLaunched: number;
  divergences: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const total = reconciled + notLaunched + divergences;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || total === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 96;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = 36;
    const lineW = 11;
    const gap = 0.03;

    const segments = [
      { value: reconciled,  color: "#639922" },
      { value: notLaunched, color: "#E24B4A" },
      { value: divergences, color: "#EF9F27" },
    ];

    let start = -Math.PI / 2;
    for (const { value, color } of segments) {
      const sweep = (value / total) * Math.PI * 2 - gap;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, start + sweep);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.lineCap = "butt";
      ctx.stroke();
      start += sweep + gap;
    }

    const pct = Math.round((reconciled / total) * 100);
    ctx.fillStyle = "#F5F5F0";
    ctx.font = `500 14px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${pct}%`, cx, cy);
  }, [reconciled, notLaunched, divergences, total]);

  return <canvas ref={canvasRef} />;
}

const Conciliacao = () => {
  const [systemFile, setSystemFile] = useState<File | null>(null);
  const [governmentFile, setGovernmentFile] = useState<File | null>(null);
  const [hasCompared, setHasCompared] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ComparisonRow[]>([]);
  const [summary, setSummary] = useState<ComparisonSummary>(emptySummary);
  const [filter, setFilter] = useState<"todos" | "nao-lancadas" | "divergencias">("todos");
  const [errorMessage, setErrorMessage] = useState("");
  const [draggingOver, setDraggingOver] = useState<"system" | "government" | null>(null);

  const canCompare = !!systemFile && !!governmentFile && !isProcessing;

  const filteredResults = useMemo(() => {
    if (filter === "nao-lancadas") return results.filter((r) => r.tipo === "Não lançada");
    if (filter === "divergencias") return results.filter((r) => r.tipo !== "Não lançada" && r.tipo !== "Lançada");
    return results;
  }, [filter, results]);

  const tabCounts = useMemo(() => ({
    todos: results.length,
    "nao-lancadas": results.filter((r) => r.tipo === "Não lançada").length,
    divergencias: results.filter((r) => r.tipo !== "Não lançada" && r.tipo !== "Lançada").length,
  }), [results]);

  const reconciliationRate =
    summary.totalGovernmentNotes > 0
      ? ((summary.reconciled / summary.totalGovernmentNotes) * 100).toFixed(1)
      : "0.0";

  const reset = () => {
    setHasCompared(false);
    setResults([]);
    setSummary(emptySummary);
    setErrorMessage("");
  };

  const handleSystemFileChange = (file: File | null) => { setSystemFile(file); reset(); };
  const handleGovernmentFileChange = (file: File | null) => { setGovernmentFile(file); reset(); };

  const handleDrop = (e: React.DragEvent, onChange: (f: File | null) => void, key: "system" | "government") => {
    e.preventDefault();
    setDraggingOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file) onChange(file);
  };

  const handleDragOver = (e: React.DragEvent, key: "system" | "government") => {
    e.preventDefault();
    setDraggingOver(key);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDraggingOver(null);
    }
  };

  const handleCompare = async () => {
    if (!systemFile || !governmentFile) return;
    try {
      setIsProcessing(true);
      setErrorMessage("");
      const [systemRecords, governmentRecords] = await Promise.all([
        parseSpreadsheetFile(systemFile, "system"),
        parseSpreadsheetFile(governmentFile, "government"),
      ]);
      const comparison = compareReports(governmentRecords, systemRecords);
      setResults(comparison.results);
      setSummary(comparison.summary);
      setHasCompared(true);
      setFilter("todos");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao processar as planilhas.");
      reset();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    try {
      exportNotLaunchedToExcel(results);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível exportar.");
    }
  };

  const showSystemValue = filter !== "nao-lancadas";

  return (
    <div className="min-h-screen px-8 py-8" style={{ background: "#111113" }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#BA7517", fontWeight: 500, margin: 0 }}>
            Auditoria e conferência
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 600, color: "#F5F5F0", margin: "6px 0 4px" }}>
            Conciliação de relatórios
          </h1>
          <p style={{ fontSize: 14, color: "#6E6E76", margin: 0 }}>
            {hasCompared
              ? `${summary.totalGovernmentNotes} notas no governo · ${summary.totalSystemNotes} no sistema`
              : "Compare a planilha do sistema com a planilha do governo para identificar divergências."}
          </p>
        </div>

        {/* ── Upload ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {([
            { label: "Planilha do sistema",  desc: "Clique ou arraste o arquivo aqui", file: systemFile,     onChange: handleSystemFileChange,     dragKey: "system"     as const },
            { label: "Planilha do governo",  desc: "Clique ou arraste o arquivo aqui", file: governmentFile, onChange: handleGovernmentFileChange, dragKey: "government" as const },
          ]).map(({ label, desc, file, onChange, dragKey }) => {
            const isDragging = draggingOver === dragKey;
            return (
              <label
                key={label}
                onDrop={(e) => handleDrop(e, onChange, dragKey)}
                onDragOver={(e) => handleDragOver(e, dragKey)}
                onDragLeave={handleDragLeave}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: isDragging ? "#1E1A0E" : file ? "#1A1208" : "#18181A",
                  border: `1.5px dashed ${isDragging ? "#BA7517" : file ? "#5B3A0D" : "#2E2E33"}`,
                  borderRadius: 12, padding: "18px 20px", cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                <input type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.files?.[0] || null)} />
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: isDragging ? "#2A1E06" : file ? "#2A1A06" : "#1E1E22",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}>
                  {file
                    ? <FileSpreadsheet style={{ width: 20, height: 20, color: "#FAC775" }} />
                    : <UploadCloud style={{ width: 20, height: 20, color: isDragging ? "#BA7517" : "#6E6E76" }} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F0", margin: 0 }}>{label}</p>
                  {file ? (
                    <p style={{ fontSize: 13, color: "#FAC775", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.name}
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: isDragging ? "#BA7517" : "#5A5A62", margin: "3px 0 0", transition: "color 0.15s" }}>
                      {isDragging ? "Solte para carregar" : desc}
                    </p>
                  )}
                </div>
                {file && (
                  <button type="button" onClick={(e) => { e.preventDefault(); onChange(null); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#5A5A62", display: "flex" }}>
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </label>
            );
          })}
        </div>

        {/* ── Compare button ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button type="button" onClick={handleCompare} disabled={!canCompare}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: canCompare ? "#BA7517" : "#222226",
              color: canCompare ? "#111113" : "#5A5A62",
              border: "none", borderRadius: 10,
              padding: "11px 24px", fontSize: 14, fontWeight: 600,
              cursor: canCompare ? "pointer" : "not-allowed",
            }}>
            <Search style={{ width: 16, height: 16 }} />
            {isProcessing ? "Processando…" : "Comparar relatórios"}
          </button>
        </div>

        {/* ── Error ── */}
        {!!errorMessage && (
          <div style={{ marginTop: 14, background: "#1E0E0E", border: "0.5px solid #5C2A2A", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#FFB4B4" }}>
            {errorMessage}
          </div>
        )}

        {/* ── Results ── */}
        {hasCompared && (
          <>
            {/* Primary metrics */}
            <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Conciliadas",  value: summary.reconciled,       color: "#97C459" },
                { label: "Não lançadas", value: summary.notLaunchedCount, color: "#F09595" },
                { label: "Divergências", value: summary.divergencesCount, color: "#FAC775" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "#1A1A1E", borderRadius: 10, padding: "18px 20px" }}>
                  <p style={{ fontSize: 13, color: "#6E6E76", margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 32, fontWeight: 600, color, margin: "6px 0 0", lineHeight: 1 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Secondary metrics */}
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Valor não lançado",     value: formatCurrencyShort(summary.notLaunchedValue),  accent: "#E24B4A", full: formatCurrency(summary.notLaunchedValue) },
                { label: "Valor com divergência", value: formatCurrencyShort(summary.divergencesValue),  accent: "#EF9F27", full: formatCurrency(summary.divergencesValue) },
                { label: "Taxa de conciliação",   value: `${reconciliationRate}%`,                        accent: "#7F77DD", full: `${summary.reconciled} de ${summary.totalGovernmentNotes} notas` },
              ].map(({ label, value, accent, full }) => (
                <div key={label} title={full}
                  style={{ background: "#1A1A1E", borderRadius: 10, padding: "14px 20px", borderLeft: `3px solid ${accent}` }}>
                  <p style={{ fontSize: 13, color: "#6E6E76", margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: accent, margin: "5px 0 0" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Donut + legend */}
            <div style={{ marginTop: 12, background: "#1A1A1E", borderRadius: 12, padding: "18px 24px", display: "flex", alignItems: "center", gap: 28 }}>
              <DonutChart
                reconciled={summary.reconciled}
                notLaunched={summary.notLaunchedCount}
                divergences={summary.divergencesCount}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { color: "#639922", label: `${summary.reconciled} conciliadas`,    pct: `${reconciliationRate}%` },
                  { color: "#E24B4A", label: `${summary.notLaunchedCount} não lançadas`, pct: `${((summary.notLaunchedCount / summary.totalGovernmentNotes) * 100).toFixed(1)}%` },
                  { color: "#EF9F27", label: `${summary.divergencesCount} divergências`,  pct: `${((summary.divergencesCount / summary.totalGovernmentNotes) * 100).toFixed(1)}%` },
                ].map(({ color, label, pct }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#9A9AA3" }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span>{label}</span>
                    <span style={{ color: "#5A5A62", marginLeft: "auto", paddingLeft: 24 }}>{pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{ marginTop: 24 }}>
              {/* Table header bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#F5F5F0", margin: 0 }}>
                  Pendências encontradas
                  <span style={{ fontSize: 13, color: "#5A5A62", fontWeight: 400, marginLeft: 10 }}>
                    ({filteredResults.length})
                  </span>
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Filter tabs */}
                  <div style={{ display: "flex", background: "#18181A", border: "0.5px solid #2C2C30", borderRadius: 9, padding: 4, gap: 3 }}>
                    {(["todos", "nao-lancadas", "divergencias"] as const).map((f) => (
                      <button key={f} type="button" onClick={() => setFilter(f)}
                        style={{
                          fontSize: 13, padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                          background: filter === f ? "#2B2B30" : "transparent",
                          color: filter === f ? "#F5F5F0" : "#6E6E76",
                          display: "inline-flex", alignItems: "center", gap: 7,
                        }}>
                        {f === "todos" ? "Todos" : f === "nao-lancadas" ? "Não lançadas" : "Divergências"}
                        <span style={{
                          fontSize: 11, padding: "1px 6px", borderRadius: 999,
                          background: filter === f ? "#3A3A40" : "#1E1E22",
                          color: filter === f ? "#C8C8CC" : "#5A5A62",
                        }}>
                          {tabCounts[f]}
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* Export button */}
                  <button type="button" onClick={handleExport}
                    disabled={!results.some((r) => r.tipo === "Não lançada")}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      fontSize: 13, color: "#FAC775",
                      background: "#1A1208", border: "0.5px solid #5B3A0D", borderRadius: 8,
                      padding: "7px 14px", cursor: "pointer",
                    }}>
                    <Download style={{ width: 14, height: 14 }} />
                    Exportar
                  </button>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "13%" }} />
                    {showSystemValue && <col style={{ width: "13%" }} />}
                    <col style={{ width: "14%" }} />
                    <col />
                  </colgroup>
                  <thead>
                    <tr style={{ background: "#111113" }}>
                      {["Data", "NF", "CNPJ", "Valor gov.", ...(showSystemValue ? ["Valor sist."] : []), "Tipo", "Observação"].map((h) => (
                        <th key={h} style={{
                          fontSize: 11, color: "#5A5A62", textTransform: "uppercase",
                          letterSpacing: "0.07em", padding: "0 12px 10px",
                          textAlign: "left", fontWeight: 500,
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.length > 0 ? filteredResults.map((row) => {
                      const badge = typeBadge[row.tipo];
                      return (
                        <tr key={row.id} style={{ borderTop: "0.5px solid #1E1E22" }}>
                          <td style={{ fontSize: 13, color: "#C8C8CC", padding: "11px 12px" }}>{row.dataEmissao}</td>
                          <td style={{ fontSize: 13, color: "#C8C8CC", padding: "11px 12px" }}>{row.numeroNF}</td>
                          <td style={{ fontSize: 13, color: "#9A9AA3", padding: "11px 12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {abbreviateCNPJ(row.cnpjPrestador)}
                          </td>
                          <td style={{ fontSize: 13, color: "#C8C8CC", padding: "11px 12px" }}>{formatCurrency(row.valor)}</td>
                          {showSystemValue && (
                            <td style={{ fontSize: 13, padding: "11px 12px", color: row.valorSistema !== null && row.valorSistema !== row.valor ? "#FAC775" : "#9A9AA3" }}>
                              {row.valorSistema !== null
                                ? formatCurrency(row.valorSistema)
                                : <span style={{ color: "#3A3A3E" }}>—</span>}
                            </td>
                          )}
                          <td style={{ padding: "11px 12px" }}>
                            <span style={{ display: "inline-block", fontSize: 12, padding: "3px 10px", borderRadius: 999, ...badgeStyles[badge.variant] }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ fontSize: 13, color: "#5A5A62", padding: "11px 12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.observacao}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={showSystemValue ? 7 : 6}
                          style={{ padding: "40px 12px", textAlign: "center", fontSize: 14, color: "#5A5A62" }}>
                          Nenhum item encontrado para o filtro selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {!hasCompared && !errorMessage && (
          <div style={{ marginTop: 72, textAlign: "center" }}>
            <div style={{
              width: 60, height: 60, borderRadius: 14, background: "#1A1A1E",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <Search style={{ width: 26, height: 26, color: "#3A3A3E" }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#3A3A3E", margin: 0 }}>Nenhuma comparação realizada</p>
            <p style={{ fontSize: 14, color: "#2A2A2E", margin: "6px 0 0" }}>Envie as duas planilhas e clique em comparar</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Conciliacao;