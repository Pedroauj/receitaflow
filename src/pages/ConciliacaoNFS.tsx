import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Download, Search, UploadCloud, FileSpreadsheet, X } from "lucide-react";
import {
  compareReports,
  exportFilteredToExcel,
  parseSpreadsheetFile,
  type ComparisonRow,
  type ComparisonSummary,
  type DivergenceType,
} from "@/lib/conciliacaoNFS";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  "Múltiplas divergências": { variant: "purple", label: "Múltiplas diverg." },
  "CNPJ errado": { variant: "red", label: "CNPJ errado" },
};

const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  green: {
    background: "rgba(99,153,34,.14)",
    color: "#A5D56A",
    border: "1px solid rgba(99,153,34,.28)",
  },
  red: {
    background: "rgba(226,75,74,.14)",
    color: "#FFAAAA",
    border: "1px solid rgba(226,75,74,.28)",
  },
  amber: {
    background: "rgba(239,159,39,.12)",
    color: "#FFD089",
    border: "1px solid rgba(239,159,39,.28)",
  },
  yellow: {
    background: "rgba(234,220,100,.12)",
    color: "#F2E487",
    border: "1px solid rgba(234,220,100,.28)",
  },
  blue: {
    background: "rgba(55,138,221,.12)",
    color: "#9CC8F7",
    border: "1px solid rgba(55,138,221,.28)",
  },
  cyan: {
    background: "rgba(29,158,117,.12)",
    color: "#7ADBB9",
    border: "1px solid rgba(29,158,117,.28)",
  },
  purple: {
    background: "rgba(127,119,221,.12)",
    color: "#C0BBFA",
    border: "1px solid rgba(127,119,221,.28)",
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
    const size = 92;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = 32;
    const lineW = 10;
    const gap = 0.035;

    ctx.clearRect(0, 0, size, size);

    const segments = [
      { value: reconciled, color: "#639922" },
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
};

const sectionCardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #18191D 0%, #15161A 100%)",
  border: "1px solid #22242A",
  borderRadius: 16,
  boxShadow: "0 8px 24px rgba(0,0,0,.16)",
};

const ConciliacaoNFS = () => {
  const [systemFile, setSystemFile] = useState<File | null>(null);
  const [governmentFile, setGovernmentFile] = useState<File | null>(null);
  const [hasCompared, setHasCompared] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ComparisonRow[]>([]);
  const [summary, setSummary] = useState<ComparisonSummary>(emptySummary);
  const [filter, setFilter] = useState<"todos" | "nao-lancadas" | "divergencias">("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [draggingOver, setDraggingOver] = useState<"system" | "government" | null>(null);

  const canCompare = !!systemFile && !!governmentFile && !isProcessing;

  const filteredResults = useMemo(() => {
    if (filter === "nao-lancadas") return results.filter((r) => r.tipo === "Não lançada");
    if (filter === "divergencias") {
      return results.filter((r) => r.tipo !== "Não lançada" && r.tipo !== "Lançada");
    }
    return results;
  }, [filter, results]);

  const searchedResults = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return filteredResults;

    return filteredResults.filter((row) =>
      String(row.numeroNF ?? "").toLowerCase().includes(normalizedSearch),
    );
  }, [filteredResults, searchTerm]);

  const tabCounts = useMemo(
    () => ({
      todos: results.length,
      "nao-lancadas": results.filter((r) => r.tipo === "Não lançada").length,
      divergencias: results.filter((r) => r.tipo !== "Não lançada" && r.tipo !== "Lançada").length,
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

  const reset = () => {
    setHasCompared(false);
    setResults([]);
    setSummary(emptySummary);
    setSearchTerm("");
    setErrorMessage("");
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
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao processar as planilhas.",
      );
      reset();
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

  const showSystemValue = filter !== "nao-lancadas";

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#D7922B",
              fontWeight: 700,
              margin: 0,
            }}
          >
            NFS · Notas de serviço
          </p>

          <p
            style={{
              fontSize: 14,
              color: "#8D8D96",
              margin: "8px 0 0",
            }}
          >
            Compare planilhas do sistema e do governo para identificar notas não lançadas e
            divergências.
          </p>

          {hasCompared && (
            <p style={{ fontSize: 14, color: "#6E6E76", margin: "10px 0 0" }}>
              {summary.totalGovernmentNotes} notas no governo · {summary.totalSystemNotes} no
              sistema
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleCompare}
          disabled={!canCompare}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: canCompare ? "#D7922B" : "#222226",
            color: canCompare ? "#111113" : "#5A5A62",
            border: "none",
            borderRadius: 12,
            padding: "12px 20px",
            fontSize: 15,
            fontWeight: 700,
            cursor: canCompare ? "pointer" : "not-allowed",
            minWidth: 212,
            justifyContent: "center",
            boxShadow: canCompare ? "0 8px 18px rgba(215,146,43,.14)" : "none",
          }}
        >
          <Search style={{ width: 17, height: 17 }} />
          {isProcessing ? "Processando…" : "Comparar relatórios"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {([
          {
            label: "Planilha do sistema",
            desc: "Clique ou arraste o arquivo aqui",
            file: systemFile,
            onChange: handleSystemFileChange,
            dragKey: "system" as const,
          },
          {
            label: "Planilha do governo",
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
                ...sectionCardStyle,
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: isDragging
                  ? "#1E1A14"
                  : file
                    ? "linear-gradient(180deg, #1F1710 0%, #1A140F 100%)"
                    : "linear-gradient(180deg, #18191D 0%, #15161A 100%)",
                border: `1.5px dashed ${isDragging ? "#D7922B" : file ? "#7A4A12" : "#2D2F36"}`,
                padding: "18px 18px",
                cursor: "pointer",
                transition: "background .15s, border-color .15s, transform .15s",
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
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: isDragging ? "#302006" : file ? "#322008" : "#202026",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {file ? (
                  <FileSpreadsheet style={{ width: 20, height: 20, color: "#FFD089" }} />
                ) : (
                  <UploadCloud
                    style={{
                      width: 20,
                      height: 20,
                      color: isDragging ? "#D7922B" : "#84848B",
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#F5F5F0", margin: 0 }}>
                  {label}
                </p>

                {file ? (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#FFD089",
                      margin: "5px 0 0",
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
                      color: isDragging ? "#D7922B" : "#71717A",
                      margin: "5px 0 0",
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
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    color: "#7A7A82",
                    display: "flex",
                  }}
                >
                  <X style={{ width: 17, height: 17 }} />
                </button>
              )}
            </label>
          );
        })}
      </div>

      {!!errorMessage && (
        <div
          style={{
            marginTop: 16,
            background: "#231111",
            border: "1px solid #6A3232",
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 14,
            color: "#FFB4B4",
          }}
        >
          {errorMessage}
        </div>
      )}

      {hasCompared && (
        <>
          <div
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            {[
              {
                label: "Conciliadas",
                value: summary.reconciled,
                color: "#A5D56A",
                subtitle: "Notas encontradas com correspondência idêntica",
              },
              {
                label: "Não lançadas",
                value: summary.notLaunchedCount,
                color: "#FFAAAA",
                subtitle: "Notas do governo sem localização no sistema",
              },
              {
                label: "Divergências",
                value: summary.divergencesCount,
                color: "#FFD089",
                subtitle: "Notas com diferença de valor, data ou múltiplos campos",
              },
            ].map(({ label, value, color, subtitle }) => (
              <div
                key={label}
                style={{
                  ...sectionCardStyle,
                  padding: "18px 18px 16px",
                  minHeight: 112,
                }}
              >
                <p style={{ fontSize: 14, color: "#8D8D96", margin: 0 }}>{label}</p>
                <p style={{ fontSize: 30, fontWeight: 700, color, margin: "10px 0 8px" }}>
                  {value}
                </p>
                <p style={{ fontSize: 13, color: "#66666F", margin: 0, lineHeight: 1.45 }}>
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
                accent: "#E24B4A",
                full: formatCurrency(summary.notLaunchedValue),
              },
              {
                label: "Valor com divergência",
                value: formatCurrencyShort(summary.divergencesValue),
                accent: "#EF9F27",
                full: formatCurrency(summary.divergencesValue),
              },
              {
                label: "Taxa de conciliação",
                value: `${reconciliationRate}%`,
                accent: "#7F77DD",
                full: `${summary.reconciled} de ${summary.totalGovernmentNotes} notas`,
              },
            ].map(({ label, value, accent, full }) => (
              <div
                key={label}
                title={full}
                style={{
                  ...sectionCardStyle,
                  padding: "18px 18px",
                  borderLeft: `4px solid ${accent}`,
                }}
              >
                <p style={{ fontSize: 14, color: "#8D8D96", margin: 0 }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: accent, margin: "8px 0 0" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              ...sectionCardStyle,
              marginTop: 14,
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <DonutChart
              reconciled={summary.reconciled}
              notLaunched={summary.notLaunchedCount}
              divergences={summary.divergencesCount}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 280 }}>
              {[
                {
                  color: "#639922",
                  label: `${summary.reconciled} conciliadas`,
                  pct: `${reconciliationRate}%`,
                },
                {
                  color: "#E24B4A",
                  label: `${summary.notLaunchedCount} não lançadas`,
                  pct: `${notLaunchedRate}%`,
                },
                {
                  color: "#EF9F27",
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
                    fontSize: 14,
                    color: "#D2D2D7",
                  }}
                >
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  <span>{label}</span>
                  <span style={{ color: "#7B7B84", marginLeft: "auto", paddingLeft: 16 }}>
                    {pct}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 14,
                flexWrap: "wrap",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 24,
                    lineHeight: 1.1,
                    fontWeight: 700,
                    color: "#F5F5F0",
                    margin: 0,
                  }}
                >
                  Pendências encontradas
                </p>
                <p style={{ fontSize: 14, color: "#7A7A82", margin: "4px 0 0" }}>
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
                    width: 240,
                    minWidth: 240,
                  }}
                >
                  <Search
                    style={{
                      width: 15,
                      height: 15,
                      color: "#6F6F78",
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar número da nota"
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 14px 0 36px",
                      background: "#18181A",
                      border: "1px solid #2C2C30",
                      borderRadius: 11,
                      color: "#F5F5F0",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    background: "#18181A",
                    border: "1px solid #2C2C30",
                    borderRadius: 13,
                    padding: 4,
                    gap: 4,
                  }}
                >
                  {(["todos", "nao-lancadas", "divergencias"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        width: 148,
                        height: 40,
                        borderRadius: 9,
                        border: "none",
                        cursor: "pointer",
                        background: filter === f ? "#2B2B30" : "transparent",
                        color: filter === f ? "#F5F5F0" : "#84848B",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                      }}
                    >
                      {filterLabels[f]}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: filter === f ? "#3A3A40" : "#1E1E22",
                          color: filter === f ? "#D8D8DD" : "#66666F",
                          minWidth: 30,
                          textAlign: "center",
                        }}
                      >
                        {tabCounts[f]}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={searchedResults.length === 0}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 13,
                    fontWeight: 700,
                    width: 118,
                    height: 40,
                    justifyContent: "center",
                    color: searchedResults.length > 0 ? "#FFD089" : "#5A5A62",
                    background: searchedResults.length > 0 ? "#1A1208" : "#1A1A1E",
                    border: `1px solid ${
                      searchedResults.length > 0 ? "#6E4714" : "#2C2C30"
                    }`,
                    borderRadius: 11,
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
                ...sectionCardStyle,
                overflowX: "auto",
                borderRadius: 16,
              }}
            >
              <TooltipProvider delayDuration={200}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                    minWidth: 1340,
                  }}
                >
                  <colgroup>
                    <col style={{ width: 110 }} />
                    <col style={{ width: 150 }} />
                    <col style={{ width: 270 }} />
                    <col style={{ width: 140 }} />
                    {showSystemValue && <col style={{ width: 140 }} />}
                    <col style={{ width: 170 }} />
                    <col />
                  </colgroup>

                  <thead>
                    <tr style={{ background: "#141519" }}>
                      {[
                        "Data",
                        "NF",
                        "CNPJ / Fornecedor",
                        "Valor gov.",
                        ...(showSystemValue ? ["Valor sist."] : []),
                        "Tipo",
                        "Observação",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            fontSize: 11,
                            color: "#7A7A82",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            padding: "15px 14px",
                            textAlign: "left",
                            fontWeight: 700,
                            borderBottom: "1px solid #25252B",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {searchedResults.length > 0 ? (
                      searchedResults.map((row) => {
                        const badge = typeBadge[row.tipo];

                        return (
                          <tr
                            key={row.id}
                            style={{
                              borderBottom: "1px solid #202026",
                              transition: "background .12s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#1B1C21";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <td
                              style={{
                                fontSize: 14,
                                color: "#E2E2E7",
                                padding: "15px 14px",
                                whiteSpace: "nowrap",
                                verticalAlign: "middle",
                                fontWeight: 600,
                              }}
                            >
                              {row.dataEmissao}
                            </td>

                            <td
                              style={{
                                fontSize: 14,
                                color: "#E2E2E7",
                                padding: "15px 14px",
                                verticalAlign: "middle",
                                fontWeight: 600,
                                lineHeight: 1.2,
                                wordBreak: "break-all",
                                overflowWrap: "anywhere",
                              }}
                              title={row.numeroNF}
                            >
                              {row.numeroNF}
                            </td>

                            <td style={{ padding: "15px 14px", verticalAlign: "middle" }}>
                              <div
                                style={{
                                  fontSize: 14,
                                  color: "#F0F0F2",
                                  lineHeight: 1.35,
                                  fontWeight: 600,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {row.cnpjPrestador}
                              </div>

                              {row.nomeFornecedor ? (
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#8E8E97",
                                    lineHeight: 1.4,
                                    marginTop: 4,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {row.nomeFornecedor}
                                </div>
                              ) : (
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#5E5E67",
                                    lineHeight: 1.4,
                                    marginTop: 4,
                                  }}
                                >
                                  Fornecedor não informado
                                </div>
                              )}
                            </td>

                            <td
                              style={{
                                fontSize: 14,
                                color: "#E2E2E7",
                                padding: "15px 14px",
                                whiteSpace: "nowrap",
                                verticalAlign: "middle",
                                fontWeight: 600,
                              }}
                            >
                              {formatCurrency(row.valor)}
                            </td>

                            {showSystemValue && (
                              <td
                                style={{
                                  fontSize: 14,
                                  padding: "15px 14px",
                                  whiteSpace: "nowrap",
                                  verticalAlign: "middle",
                                  fontWeight: 600,
                                  color:
                                    row.valorSistema !== null && row.valorSistema !== row.valor
                                      ? "#FFD089"
                                      : "#B0B0B8",
                                }}
                              >
                                {row.valorSistema !== null ? (
                                  formatCurrency(row.valorSistema)
                                ) : (
                                  <span style={{ color: "#43434A" }}>—</span>
                                )}
                              </td>
                            )}

                            <td style={{ padding: "15px 14px", verticalAlign: "middle" }}>
                              <span
                                style={{
                                  display: "inline-block",
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
                            </td>

                            <td style={{ padding: "15px 14px", verticalAlign: "middle" }}>
                              <Tooltip>
                                <TooltipTrigger asChild>
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
                                      cursor: "default",
                                    }}
                                  >
                                    {row.observacao}
                                  </p>
                                </TooltipTrigger>

                                <TooltipContent
                                  side="top"
                                  className="max-w-sm text-xs"
                                  style={{
                                    background: "#2A2A30",
                                    border: "1px solid #3A3A40",
                                    color: "#D8D8DC",
                                    fontSize: 12,
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {row.observacao}
                                </TooltipContent>
                              </Tooltip>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={showSystemValue ? 7 : 6}
                          style={{
                            padding: "48px 14px",
                            textAlign: "center",
                            fontSize: 14,
                            color: "#6E6E76",
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
              </TooltipProvider>
            </div>
          </div>
        </>
      )}

      {!hasCompared && !errorMessage && (
        <div style={{ marginTop: 68, textAlign: "center" }}>
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 18,
              background: "#1A1A1E",
              border: "1px solid #232329",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 20px rgba(0,0,0,.14)",
            }}
          >
            <Search style={{ width: 24, height: 24, color: "#4B4B52" }} />
          </div>

          <p style={{ fontSize: 20, fontWeight: 700, color: "#D0D0D6", margin: 0 }}>
            Nenhuma comparação realizada
          </p>
          <p style={{ fontSize: 14, color: "#6B6B73", margin: "8px 0 0" }}>
            Envie as duas planilhas e clique em comparar para visualizar a conciliação.
          </p>
        </div>
      )}
    </div>
  );
};

export default ConciliacaoNFS;