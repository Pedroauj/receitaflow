import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Download,
  Search,
  UploadCloud,
  FileSpreadsheet,
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock3,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  compareReports,
  exportFilteredToExcel,
  parseSpreadsheetFile,
  type ComparisonRow,
  type ComparisonSummary,
  type DivergenceType,
} from "@/lib/conciliacaoNFE";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatCurrencyShort = (value: number) => {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
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
  Lançada: { variant: "green", label: "Lançada" },
  "Não lançada": { variant: "red", label: "Não lançada" },
  "Valor divergente": { variant: "amber", label: "Valor divergente" },
  "Data divergente": { variant: "yellow", label: "Data divergente" },
  "NF divergente": { variant: "blue", label: "NF divergente" },
  "CNPJ divergente": { variant: "cyan", label: "CNPJ divergente" },
  "CNPJ errado": { variant: "cyan", label: "CNPJ errado" },
  "Múltiplas divergências": { variant: "purple", label: "Múltiplas diverg." },
};

const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  green: {
    background: "rgba(16, 185, 129, 0.12)",
    color: "#86EFAC",
    border: "1px solid rgba(16, 185, 129, 0.22)",
  },
  red: {
    background: "rgba(239, 68, 68, 0.12)",
    color: "#FCA5A5",
    border: "1px solid rgba(239, 68, 68, 0.22)",
  },
  amber: {
    background: "rgba(245, 158, 11, 0.12)",
    color: "#FCD34D",
    border: "1px solid rgba(245, 158, 11, 0.22)",
  },
  yellow: {
    background: "rgba(234, 179, 8, 0.12)",
    color: "#FDE68A",
    border: "1px solid rgba(234, 179, 8, 0.22)",
  },
  blue: {
    background: "rgba(59, 130, 246, 0.12)",
    color: "#93C5FD",
    border: "1px solid rgba(59, 130, 246, 0.22)",
  },
  cyan: {
    background: "rgba(34, 211, 238, 0.12)",
    color: "#A5F3FC",
    border: "1px solid rgba(34, 211, 238, 0.22)",
  },
  purple: {
    background: "rgba(139, 92, 246, 0.12)",
    color: "#C4B5FD",
    border: "1px solid rgba(139, 92, 246, 0.22)",
  },
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
    const radius = 33;
    const lineW = 10;
    const gap = 0.04;

    ctx.clearRect(0, 0, size, size);

    const segments = [
      { value: reconciled, color: "#10B981" },
      { value: notLaunched, color: "#EF4444" },
      { value: divergences, color: "#F59E0B" },
    ];

    let start = -Math.PI / 2;
    for (const { value, color } of segments) {
      const sweep = (value / total) * Math.PI * 2 - gap;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, start + sweep);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.lineCap = "round";
      ctx.stroke();
      start += sweep + gap;
    }

    const pct = Math.round((reconciled / total) * 100);
    ctx.fillStyle = "#F8FAFC";
    ctx.font = `600 14px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${pct}%`, cx, cy);
  }, [reconciled, notLaunched, divergences, total]);

  return <canvas ref={canvasRef} />;
}

const filterLabels: Record<string, string> = {
  todos: "Todos",
  "nao-lancadas": "Não lançadas",
  divergencias: "Divergências",
  "ativo-imobilizado": "Ativo imob.",
};

const panelStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17,24,39,0.96) 0%, rgba(10,15,27,0.98) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  boxShadow: "0 18px 48px rgba(0,0,0,.28)",
  backdropFilter: "blur(14px)",
};

const softCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  backdropFilter: "blur(10px)",
};

const ROWS_PER_PAGE = 25;

const ConciliacaoNFE = () => {
  const [systemFile, setSystemFile] = useState<File | null>(null);
  const [governmentFile, setGovernmentFile] = useState<File | null>(null);
  const [hasCompared, setHasCompared] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ComparisonRow[]>([]);
  const [summary, setSummary] = useState<ComparisonSummary>(emptySummary);
  const [filter, setFilter] = useState<
    "todos" | "nao-lancadas" | "divergencias" | "ativo-imobilizado"
  >("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [draggingOver, setDraggingOver] = useState<"system" | "government" | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const canCompare = !!systemFile && !!governmentFile && !isProcessing;

  const filteredResults = useMemo(() => {
    if (filter === "nao-lancadas") {
      return results.filter((r) => r.tipo === "Não lançada");
    }

    if (filter === "divergencias") {
      return results.filter((r) => r.tipo !== "Não lançada" && r.tipo !== "Lançada");
    }

    if (filter === "ativo-imobilizado") {
      return results.filter((r) => r.ativoImobilizado);
    }

    return results;
  }, [filter, results]);

  const searchedResults = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return filteredResults;

    return filteredResults.filter((row) =>
      [
        row.chave,
        row.numeroNF,
        row.dataEmissao,
        row.cnpjEmitente,
        row.nomeFornecedor,
        row.tags,
        row.observacao,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [filteredResults, searchTerm]);

  const tabCounts = useMemo(
    () => ({
      todos: results.length,
      "nao-lancadas": results.filter((r) => r.tipo === "Não lançada").length,
      divergencias: results.filter((r) => r.tipo !== "Não lançada" && r.tipo !== "Lançada").length,
      "ativo-imobilizado": results.filter((r) => r.ativoImobilizado).length,
    }),
    [results],
  );

  const reconciliationRate =
    summary.totalGovernmentNotes > 0
      ? ((summary.reconciled / summary.totalGovernmentNotes) * 100).toFixed(1)
      : "0.0";

  const notLaunchedRate =
    summary.totalGovernmentNotes > 0
      ? ((summary.notLaunchedCount / summary.totalGovernmentNotes) * 100).toFixed(1)
      : "0.0";

  const divergencesRate =
    summary.totalGovernmentNotes > 0
      ? ((summary.divergencesCount / summary.totalGovernmentNotes) * 100).toFixed(1)
      : "0.0";

  const totalPages = Math.max(1, Math.ceil(searchedResults.length / ROWS_PER_PAGE));
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;

  const paginatedResults = useMemo(() => {
    return searchedResults.slice(startIndex, endIndex);
  }, [searchedResults, startIndex, endIndex]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  }, [currentPage, totalPages]);

  const reset = () => {
    setHasCompared(false);
    setResults([]);
    setSummary(emptySummary);
    setSearchTerm("");
    setErrorMessage("");
    setCurrentPage(1);
  };

  const handleSystemFileChange = (file: File | null) => {
    setSystemFile(file);
    reset();
  };

  const handleGovernmentFileChange = (file: File | null) => {
    setGovernmentFile(file);
    reset();
  };

  const handleDrop = (
    e: React.DragEvent,
    onChange: (f: File | null) => void,
    key: "system" | "government",
  ) => {
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
      setSearchTerm("");
      setCurrentPage(1);
    } catch (error) {
      reset();
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao processar as planilhas.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    try {
      exportFilteredToExcel(searchedResults, filterLabels[filter]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível exportar.");
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, results]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div style={{ width: "100%", padding: "4px 0 20px" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 1480,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <section
          style={{
            ...panelStyle,
            position: "relative",
            overflow: "hidden",
            padding: "24px 24px 22px",
            background:
              "linear-gradient(135deg, rgba(17,24,39,0.98) 0%, rgba(10,15,27,0.99) 45%, rgba(6,10,20,1) 100%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(circle at top left, rgba(99,102,241,.18), transparent 30%), radial-gradient(circle at bottom right, rgba(59,130,246,.12), transparent 26%)",
            }}
          />

          <div
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(300px, 380px)",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 999,
                  padding: "7px 12px",
                  border: "1px solid rgba(99,102,241,.22)",
                  background: "rgba(99,102,241,.12)",
                  color: "#A5B4FC",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                <Sparkles style={{ width: 14, height: 14 }} />
                NF-e / NFS-e · Conciliação
              </div>

              <h1
                style={{
                  fontSize: 32,
                  lineHeight: 1.05,
                  fontWeight: 700,
                  color: "#F8FAFC",
                  margin: "16px 0 0",
                  letterSpacing: "-0.03em",
                }}
              >
                Comparação de notas
              </h1>

              <p
                style={{
                  fontSize: 14,
                  color: "#94A3B8",
                  margin: "10px 0 0",
                  maxWidth: 760,
                  lineHeight: 1.65,
                }}
              >
                Compare os arquivos do sistema com os relatórios do SIEG em uma visão mais
                limpa no topo e mais robusta no conteúdo analítico. A prioridade continua
                sendo a chave de acesso, exatamente como já funciona hoje.
              </p>

              {hasCompared && (
                <div
                  style={{
                    marginTop: 16,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                    padding: "10px 14px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#CBD5E1",
                    fontSize: 13,
                  }}
                >
                  <span>{summary.totalGovernmentNotes} notas no SIEG</span>
                  <span style={{ opacity: 0.35 }}>•</span>
                  <span>{summary.totalSystemNotes} notas no sistema</span>
                  <span style={{ opacity: 0.35 }}>•</span>
                  <span>{results.length} registros analisados</span>
                </div>
              )}
            </div>

            <div
              style={{
                ...softCardStyle,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 170,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#E2E8F0",
                    fontWeight: 700,
                  }}
                >
                  Ação principal
                </p>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 12,
                    color: "#94A3B8",
                    lineHeight: 1.6,
                  }}
                >
                  Envie os dois arquivos e inicie a comparação mantendo toda a regra atual.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCompare}
                disabled={!canCompare}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 18,
                  width: "100%",
                  height: 46,
                  borderRadius: 16,
                  border: "1px solid transparent",
                  background: canCompare
                    ? "linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)"
                    : "rgba(255,255,255,0.06)",
                  color: canCompare ? "#F8FAFC" : "#64748B",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: canCompare ? "pointer" : "not-allowed",
                  boxShadow: canCompare ? "0 14px 28px rgba(59,130,246,.22)" : "none",
                }}
              >
                <Search style={{ width: 16, height: 16 }} />
                {isProcessing ? "Processando…" : "Comparar relatórios"}
              </button>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {([
            {
              label: "Planilha do sistema",
              desc: "Clique ou arraste o arquivo aqui",
              file: systemFile,
              onChange: handleSystemFileChange,
              dragKey: "system" as const,
            },
            {
              label: "Planilha do SIEG",
              desc: "Clique ou arraste o arquivo aqui",
              file: governmentFile,
              onChange: handleGovernmentFileChange,
              dragKey: "government" as const,
            },
          ]).map(({ label, desc, file, onChange, dragKey }) => {
            const isDragging = draggingOver === dragKey;

            return (
              <label
                key={label}
                onDrop={(e) => handleDrop(e, onChange, dragKey)}
                onDragOver={(e) => handleDragOver(e, dragKey)}
                onDragLeave={handleDragLeave}
                style={{
                  ...panelStyle,
                  padding: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  cursor: "pointer",
                  transition: "transform .16s ease, border-color .16s ease, background .16s ease",
                  border: `1px solid ${
                    isDragging
                      ? "rgba(99,102,241,.45)"
                      : file
                        ? "rgba(59,130,246,.22)"
                        : "rgba(255,255,255,.08)"
                  }`,
                  background: isDragging
                    ? "linear-gradient(180deg, rgba(30,41,59,0.98) 0%, rgba(15,23,42,0.99) 100%)"
                    : file
                      ? "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(9,14,26,0.99) 100%)"
                      : "linear-gradient(180deg, rgba(17,24,39,0.96) 0%, rgba(10,15,27,0.98) 100%)",
                }}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: "none" }}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onChange(e.target.files?.[0] || null)
                  }
                />

                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    flexShrink: 0,
                    background: file
                      ? "rgba(59,130,246,.14)"
                      : isDragging
                        ? "rgba(99,102,241,.18)"
                        : "rgba(255,255,255,.05)",
                    border: "1px solid rgba(255,255,255,.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {file ? (
                    <FileSpreadsheet style={{ width: 21, height: 21, color: "#93C5FD" }} />
                  ) : (
                    <UploadCloud
                      style={{
                        width: 21,
                        height: 21,
                        color: isDragging ? "#A5B4FC" : "#94A3B8",
                      }}
                    />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>
                    {label}
                  </p>

                  {file ? (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#93C5FD",
                        margin: "6px 0 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </p>
                  ) : (
                    <p
                      style={{
                        fontSize: 13,
                        color: isDragging ? "#C7D2FE" : "#94A3B8",
                        margin: "6px 0 0",
                      }}
                    >
                      {isDragging ? "Solte para carregar" : desc}
                    </p>
                  )}
                </div>

                {file && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onChange(null);
                    }}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer",
                      padding: 7,
                      borderRadius: 12,
                      color: "#94A3B8",
                      display: "flex",
                    }}
                  >
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </label>
            );
          })}
        </section>

        {!!errorMessage && (
          <div
            style={{
              background: "rgba(127, 29, 29, 0.32)",
              border: "1px solid rgba(239,68,68,.28)",
              borderRadius: 18,
              padding: "14px 16px",
              fontSize: 14,
              color: "#FCA5A5",
            }}
          >
            {errorMessage}
          </div>
        )}

        {hasCompared && (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
                gap: 16,
              }}
            >
              <div
                style={{
                  ...panelStyle,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 14,
                  }}
                >
                  {[
                    {
                      label: "Conciliadas",
                      value: summary.reconciled,
                      color: "#86EFAC",
                      subtitle: "Notas localizadas e validadas com sucesso",
                      icon: ShieldCheck,
                      bg: "rgba(16,185,129,.10)",
                      border: "rgba(16,185,129,.18)",
                    },
                    {
                      label: "Não lançadas",
                      value: summary.notLaunchedCount,
                      color: "#FCA5A5",
                      subtitle: "Notas do SIEG sem vínculo encontrado",
                      icon: Clock3,
                      bg: "rgba(239,68,68,.10)",
                      border: "rgba(239,68,68,.18)",
                    },
                    {
                      label: "Divergências",
                      value: summary.divergencesCount,
                      color: "#FCD34D",
                      subtitle: "Diferenças de valor, data, CNPJ ou outros campos",
                      icon: AlertTriangle,
                      bg: "rgba(245,158,11,.10)",
                      border: "rgba(245,158,11,.18)",
                    },
                  ].map(({ label, value, color, subtitle, icon: Icon, bg, border }) => (
                    <div
                      key={label}
                      style={{
                        ...softCardStyle,
                        padding: 16,
                        background: bg,
                        border: `1px solid ${border}`,
                        minHeight: 134,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 600 }}>
                          {label}
                        </span>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(255,255,255,.06)",
                            border: "1px solid rgba(255,255,255,.08)",
                          }}
                        >
                          <Icon style={{ width: 16, height: 16, color }} />
                        </div>
                      </div>

                      <p
                        style={{
                          fontSize: 34,
                          lineHeight: 1,
                          fontWeight: 700,
                          color,
                          margin: "16px 0 10px",
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {value}
                      </p>

                      <p
                        style={{
                          fontSize: 12,
                          color: "#94A3B8",
                          margin: 0,
                          lineHeight: 1.55,
                        }}
                      >
                        {subtitle}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 14,
                  }}
                >
                  {[
                    {
                      label: "Valor não lançado",
                      value: formatCurrencyShort(summary.notLaunchedValue),
                      accent: "#F87171",
                      full: formatCurrency(summary.notLaunchedValue),
                    },
                    {
                      label: "Valor com divergência",
                      value: formatCurrencyShort(summary.divergencesValue),
                      accent: "#FBBF24",
                      full: formatCurrency(summary.divergencesValue),
                    },
                    {
                      label: "Taxa de conciliação",
                      value: `${reconciliationRate}%`,
                      accent: "#A5B4FC",
                      full: `${summary.reconciled} de ${summary.totalGovernmentNotes} notas`,
                    },
                  ].map(({ label, value, accent, full }) => (
                    <div
                      key={label}
                      title={full}
                      style={{
                        ...softCardStyle,
                        padding: "16px 16px 15px",
                        borderLeft: `4px solid ${accent}`,
                      }}
                    >
                      <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>{label}</p>
                      <p
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: accent,
                          margin: "10px 0 0",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  ...panelStyle,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(99,102,241,.12)",
                      border: "1px solid rgba(99,102,241,.18)",
                    }}
                  >
                    <BarChart3 style={{ width: 16, height: 16, color: "#A5B4FC" }} />
                  </div>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#F8FAFC",
                      }}
                    >
                      Distribuição da conciliação
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: "#94A3B8",
                      }}
                    >
                      Visão executiva da qualidade do cruzamento
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    ...softCardStyle,
                    padding: "18px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    flexWrap: "wrap",
                  }}
                >
                  <DonutChart
                    reconciled={summary.reconciled}
                    notLaunched={summary.notLaunchedCount}
                    divergences={summary.divergencesCount}
                  />

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 220, flex: 1 }}>
                    {[
                      {
                        color: "#10B981",
                        label: `${summary.reconciled} conciliadas`,
                        pct: `${reconciliationRate}%`,
                      },
                      {
                        color: "#EF4444",
                        label: `${summary.notLaunchedCount} não lançadas`,
                        pct: `${notLaunchedRate}%`,
                      },
                      {
                        color: "#F59E0B",
                        label: `${summary.divergencesCount} divergências`,
                        pct: `${divergencesRate}%`,
                      },
                    ].map(({ color, label, pct }) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          fontSize: 13,
                          color: "#CBD5E1",
                        }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: color,
                            flexShrink: 0,
                          }}
                        />
                        <span>{label}</span>
                        <span style={{ color: "#94A3B8", marginLeft: "auto", paddingLeft: 14 }}>
                          {pct}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 10,
                  }}
                >
                  {[
                    {
                      label: "Notas no SIEG",
                      value: summary.totalGovernmentNotes,
                    },
                    {
                      label: "Notas no sistema",
                      value: summary.totalSystemNotes,
                    },
                    {
                      label: "Registros no resultado",
                      value: results.length,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        ...softCardStyle,
                        padding: "14px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 14,
                      }}
                    >
                      <span style={{ fontSize: 13, color: "#CBD5E1" }}>{item.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#F8FAFC" }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section
              style={{
                ...panelStyle,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 26,
                      lineHeight: 1.05,
                      fontWeight: 700,
                      color: "#F8FAFC",
                      margin: 0,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    Pendências encontradas
                  </p>
                  <p style={{ fontSize: 14, color: "#94A3B8", margin: "8px 0 0" }}>
                    {searchedResults.length} registros no filtro atual
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 320,
                      minWidth: 240,
                    }}
                  >
                    <Search
                      style={{
                        width: 15,
                        height: 15,
                        color: "#64748B",
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar chave, nota, CNPJ, fornecedor..."
                      style={{
                        width: "100%",
                        height: 44,
                        padding: "0 14px 0 39px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 14,
                        color: "#F8FAFC",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      background: "rgba(255,255,255,0.035)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      padding: 4,
                      gap: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    {(["todos", "nao-lancadas", "divergencias", "ativo-imobilizado"] as const).map(
                      (f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFilter(f)}
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            width: f === "ativo-imobilizado" ? 166 : 150,
                            height: 42,
                            borderRadius: 12,
                            border: "none",
                            cursor: "pointer",
                            background:
                              filter === f
                                ? "linear-gradient(135deg, rgba(99,102,241,.18) 0%, rgba(59,130,246,.18) 100%)"
                                : "transparent",
                            color: filter === f ? "#F8FAFC" : "#94A3B8",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                          }}
                        >
                          {filterLabels[f]}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 999,
                              background:
                                filter === f ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
                              color: filter === f ? "#E2E8F0" : "#64748B",
                              minWidth: 30,
                              textAlign: "center",
                            }}
                          >
                            {tabCounts[f]}
                          </span>
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={searchedResults.length === 0}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      width: 122,
                      height: 44,
                      justifyContent: "center",
                      color: searchedResults.length > 0 ? "#BFDBFE" : "#64748B",
                      background:
                        searchedResults.length > 0
                          ? "rgba(59,130,246,0.10)"
                          : "rgba(255,255,255,0.04)",
                      border: `1px solid ${
                        searchedResults.length > 0
                          ? "rgba(59,130,246,0.20)"
                          : "rgba(255,255,255,0.08)"
                      }`,
                      borderRadius: 14,
                      cursor: searchedResults.length > 0 ? "pointer" : "not-allowed",
                    }}
                  >
                    <Download style={{ width: 14, height: 14 }} />
                    Exportar
                  </button>
                </div>
              </div>

              <div
                style={{
                  ...softCardStyle,
                  overflowX: "auto",
                  borderRadius: 20,
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                    minWidth: 1680,
                  }}
                >
                  <colgroup>
                    <col style={{ width: 148 }} />
                    <col style={{ width: 280 }} />
                    <col style={{ width: 140 }} />
                    <col style={{ width: 110 }} />
                    <col style={{ width: 180 }} />
                    <col style={{ width: 230 }} />
                    <col style={{ width: 210 }} />
                    <col style={{ width: 140 }} />
                    <col style={{ width: 140 }} />
                    <col />
                  </colgroup>

                  <thead>
                    <tr
                      style={{
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      {[
                        "Tipo",
                        "Chave",
                        "NF",
                        "Data",
                        "CNPJ",
                        "Fornecedor",
                        "Tags",
                        "Valor SIEG",
                        "Valor sist.",
                        "Observação",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            fontSize: 11,
                            color: "#64748B",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            padding: "16px 14px",
                            textAlign: "left",
                            fontWeight: 700,
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedResults.length > 0 ? (
                      paginatedResults.map((row) => {
                        const badge = typeBadge[row.tipo];

                        return (
                          <tr
                            key={row.id}
                            style={{
                              borderBottom: "1px solid rgba(255,255,255,0.06)",
                              transition: "background .12s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <td style={{ padding: "16px 14px", verticalAlign: "middle" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: "fit-content",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: "5px 11px",
                                    borderRadius: 999,
                                    whiteSpace: "nowrap",
                                    ...badgeStyles[badge.variant],
                                  }}
                                >
                                  {badge.label}
                                </span>

                                {row.ativoImobilizado && (
                                  <span
                                    style={{
                                      display: "inline-block",
                                      width: "fit-content",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: "5px 11px",
                                      borderRadius: 999,
                                      whiteSpace: "nowrap",
                                      background: "rgba(59,130,246,.12)",
                                      color: "#93C5FD",
                                      border: "1px solid rgba(59,130,246,.22)",
                                    }}
                                  >
                                    Ativo imobilizado
                                  </span>
                                )}
                              </div>
                            </td>

                            <td
                              style={{
                                fontSize: 13,
                                color: "#E2E8F0",
                                padding: "16px 14px",
                                verticalAlign: "middle",
                                fontWeight: 600,
                                lineHeight: 1.35,
                                wordBreak: "break-all",
                                overflowWrap: "anywhere",
                              }}
                              title={row.chave}
                            >
                              {row.chave || "—"}
                            </td>

                            <td
                              style={{
                                fontSize: 14,
                                color: "#E2E8F0",
                                padding: "16px 14px",
                                verticalAlign: "middle",
                                fontWeight: 600,
                                lineHeight: 1.2,
                                wordBreak: "break-all",
                                overflowWrap: "anywhere",
                              }}
                              title={row.numeroNF}
                            >
                              {row.numeroNF || "—"}
                            </td>

                            <td
                              style={{
                                fontSize: 14,
                                color: "#E2E8F0",
                                padding: "16px 14px",
                                whiteSpace: "nowrap",
                                verticalAlign: "middle",
                                fontWeight: 600,
                              }}
                            >
                              {row.dataEmissao || "—"}
                            </td>

                            <td
                              style={{
                                fontSize: 14,
                                color: "#E2E8F0",
                                padding: "16px 14px",
                                verticalAlign: "middle",
                                fontWeight: 600,
                                lineHeight: 1.35,
                                wordBreak: "break-all",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {row.cnpjEmitente || "—"}
                            </td>

                            <td style={{ padding: "16px 14px", verticalAlign: "middle" }}>
                              <div
                                style={{
                                  fontSize: 14,
                                  color: "#F8FAFC",
                                  lineHeight: 1.35,
                                  fontWeight: 600,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {row.nomeFornecedor || "Fornecedor não informado"}
                              </div>
                            </td>

                            <td style={{ padding: "16px 14px", verticalAlign: "middle" }}>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "#A1A1AA",
                                  lineHeight: 1.5,
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                                title={row.tags || ""}
                              >
                                {row.tags || "—"}
                              </div>
                            </td>

                            <td
                              style={{
                                fontSize: 14,
                                color: "#E2E8F0",
                                padding: "16px 14px",
                                whiteSpace: "nowrap",
                                verticalAlign: "middle",
                                fontWeight: 600,
                              }}
                            >
                              {formatCurrency(Number(row.valor ?? 0))}
                            </td>

                            <td
                              style={{
                                fontSize: 14,
                                padding: "16px 14px",
                                whiteSpace: "nowrap",
                                verticalAlign: "middle",
                                fontWeight: 600,
                                color:
                                  row.valorSistema !== null && row.valorSistema !== row.valor
                                    ? "#FCD34D"
                                    : "#CBD5E1",
                              }}
                            >
                              {row.valorSistema !== null && row.valorSistema !== undefined ? (
                                formatCurrency(Number(row.valorSistema))
                              ) : (
                                <span style={{ color: "#475569" }}>—</span>
                              )}
                            </td>

                            <td style={{ padding: "16px 14px", verticalAlign: "middle" }}>
                              <p
                                style={{
                                  fontSize: 13,
                                  color: "#A1A1AA",
                                  margin: 0,
                                  lineHeight: 1.5,
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                                title={row.observacao}
                              >
                                {row.observacao}
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          style={{
                            padding: "52px 14px",
                            textAlign: "center",
                            fontSize: 14,
                            color: "#94A3B8",
                          }}
                        >
                          {searchTerm.trim()
                            ? "Nenhuma nota encontrada para a busca informada."
                            : "Nenhum item encontrado para o filtro selecionado."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {searchedResults.length > 0 && (
                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: "#94A3B8",
                    }}
                  >
                    Exibindo{" "}
                    <span style={{ color: "#E2E8F0", fontWeight: 700 }}>
                      {startIndex + 1}
                    </span>{" "}
                    até{" "}
                    <span style={{ color: "#E2E8F0", fontWeight: 700 }}>
                      {Math.min(endIndex, searchedResults.length)}
                    </span>{" "}
                    de{" "}
                    <span style={{ color: "#E2E8F0", fontWeight: 700 }}>
                      {searchedResults.length}
                    </span>{" "}
                    registros
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.04)",
                        color: currentPage === 1 ? "#475569" : "#CBD5E1",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ChevronLeft style={{ width: 16, height: 16 }} />
                    </button>

                    {visiblePages[0] > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(1)}
                          style={{
                            minWidth: 38,
                            height: 38,
                            padding: "0 10px",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.04)",
                            color: "#CBD5E1",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          1
                        </button>
                        {visiblePages[0] > 2 && (
                          <span style={{ color: "#64748B", padding: "0 2px" }}>…</span>
                        )}
                      </>
                    )}

                    {visiblePages.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        style={{
                          minWidth: 38,
                          height: 38,
                          padding: "0 10px",
                          borderRadius: 12,
                          border:
                            currentPage === page
                              ? "1px solid rgba(99,102,241,0.28)"
                              : "1px solid rgba(255,255,255,0.08)",
                          background:
                            currentPage === page
                              ? "linear-gradient(135deg, rgba(99,102,241,.18) 0%, rgba(59,130,246,.18) 100%)"
                              : "rgba(255,255,255,0.04)",
                          color: currentPage === page ? "#F8FAFC" : "#CBD5E1",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {page}
                      </button>
                    ))}

                    {visiblePages[visiblePages.length - 1] < totalPages && (
                      <>
                        {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                          <span style={{ color: "#64748B", padding: "0 2px" }}>…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(totalPages)}
                          style={{
                            minWidth: 38,
                            height: 38,
                            padding: "0 10px",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.04)",
                            color: "#CBD5E1",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.04)",
                        color: currentPage === totalPages ? "#475569" : "#CBD5E1",
                        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ChevronRight style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {!hasCompared && !errorMessage && (
          <div
            style={{
              marginTop: 56,
              textAlign: "center",
              padding: "8px 12px 4px",
            }}
          >
            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#E2E8F0",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Nenhuma comparação realizada
            </p>
            <p
              style={{
                fontSize: 14,
                color: "#94A3B8",
                margin: "10px 0 0",
                lineHeight: 1.6,
              }}
            >
              Envie as duas planilhas e clique em comparar para visualizar a conciliação.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConciliacaoNFE;