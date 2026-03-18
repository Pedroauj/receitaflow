import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Download,
  FileSpreadsheet,
  Search,
  UploadCloud,
  X,
} from "lucide-react";
import {
  compareReports,
  exportFilteredToExcel,
  parseSpreadsheetFile,
  type ComparisonRow,
  type ComparisonSummary,
  type DivergenceType,
} from "@/lib/conciliacaoNFE";

const sectionCardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #18191D 0%, #15161A 100%)",
  border: "1px solid #22242A",
  borderRadius: 16,
  boxShadow: "0 8px 24px rgba(0,0,0,.16)",
};

const uploadCardStyle: React.CSSProperties = {
  ...sectionCardStyle,
  padding: 18,
  minHeight: 180,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#121317",
  border: "1px solid #252730",
  color: "#F5F5F0",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
};

const filterButtonStyle = (
  active: boolean,
): React.CSSProperties => ({
  border: `1px solid ${active ? "#D7922B" : "#2A2D36"}`,
  background: active ? "rgba(215,146,43,0.14)" : "#17191E",
  color: active ? "#F5F5F0" : "#B7B9C2",
  borderRadius: 999,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all .2s ease",
});

const actionButtonStyle = (
  variant: "primary" | "secondary" | "ghost",
  disabled = false,
): React.CSSProperties => {
  const base: React.CSSProperties = {
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all .2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    opacity: disabled ? 0.5 : 1,
  };

  if (variant === "primary") {
    return {
      ...base,
      border: "1px solid #D7922B",
      background: "#D7922B",
      color: "#18191D",
    };
  }

  if (variant === "secondary") {
    return {
      ...base,
      border: "1px solid #2B2E37",
      background: "#1A1C22",
      color: "#F5F5F0",
    };
  }

  return {
    ...base,
    border: "1px solid #2B2E37",
    background: "transparent",
    color: "#C9CBD3",
  };
};

const summaryCardStyle: React.CSSProperties = {
  ...sectionCardStyle,
  padding: 18,
  minHeight: 108,
};

const tableHeaderCellStyle: React.CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#8D8D96",
  fontWeight: 700,
  padding: "14px 16px",
  borderBottom: "1px solid #23252C",
  whiteSpace: "nowrap",
};

const tableCellStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid #23252C",
  fontSize: 14,
  color: "#F5F5F0",
  verticalAlign: "top",
};

const emptyStateStyle: React.CSSProperties = {
  ...sectionCardStyle,
  padding: 28,
  textAlign: "center",
};

type FilterKey =
  | "Todos"
  | DivergenceType
  | "Ativo imobilizado";

const initialSummary: ComparisonSummary = {
  totalGovernmentNotes: 0,
  totalSystemNotes: 0,
  reconciled: 0,
  notLaunchedCount: 0,
  divergencesCount: 0,
  notLaunchedValue: 0,
  divergencesValue: 0,
};

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

function getStatusBadgeStyle(tipo: DivergenceType): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
    border: "1px solid transparent",
  };

  switch (tipo) {
    case "Lançada":
      return {
        ...base,
        background: "rgba(32, 181, 98, 0.14)",
        color: "#7FE3A8",
        borderColor: "rgba(32, 181, 98, 0.24)",
      };
    case "Não lançada":
      return {
        ...base,
        background: "rgba(255, 82, 82, 0.14)",
        color: "#FF9A9A",
        borderColor: "rgba(255, 82, 82, 0.24)",
      };
    case "Valor divergente":
    case "Data divergente":
    case "NF divergente":
    case "CNPJ divergente":
    case "CNPJ errado":
    case "Múltiplas divergências":
      return {
        ...base,
        background: "rgba(215, 146, 43, 0.14)",
        color: "#F0BE75",
        borderColor: "rgba(215, 146, 43, 0.24)",
      };
    default:
      return {
        ...base,
        background: "#1B1D23",
        color: "#C8CAD2",
        borderColor: "#2A2D36",
      };
  }
}

function getFileName(file: File | null) {
  if (!file) return "Nenhum arquivo selecionado";
  return file.name;
}

const ConciliacaoNFE = () => {
  const [systemFile, setSystemFile] = useState<File | null>(null);
  const [governmentFile, setGovernmentFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [summary, setSummary] = useState<ComparisonSummary>(initialSummary);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("Todos");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const systemInputRef = useRef<HTMLInputElement | null>(null);
  const governmentInputRef = useRef<HTMLInputElement | null>(null);

  const handleSystemFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSystemFile(file);
    setErrorMessage("");
  };

  const handleGovernmentFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setGovernmentFile(file);
    setErrorMessage("");
  };

  const clearSystemFile = () => {
    setSystemFile(null);
    if (systemInputRef.current) {
      systemInputRef.current.value = "";
    }
  };

  const clearGovernmentFile = () => {
    setGovernmentFile(null);
    if (governmentInputRef.current) {
      governmentInputRef.current.value = "";
    }
  };

  const handleProcess = async () => {
    if (!systemFile || !governmentFile) {
      setErrorMessage("Selecione a planilha do sistema e a planilha do SIEG antes de processar.");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");

      const [systemRecords, governmentRecords] = await Promise.all([
        parseSpreadsheetFile(systemFile, "system"),
        parseSpreadsheetFile(governmentFile, "government"),
      ]);

      const comparison = compareReports(governmentRecords, systemRecords);

      setRows(comparison.results);
      setSummary(comparison.summary);
      setActiveFilter("Todos");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível processar as planilhas.";
      setErrorMessage(message);
      setRows([]);
      setSummary(initialSummary);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesFilter =
        activeFilter === "Todos"
          ? true
          : activeFilter === "Ativo imobilizado"
            ? row.ativoImobilizado
            : row.tipo === activeFilter;

      if (!matchesFilter) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        row.chave,
        row.numeroNF,
        row.dataEmissao,
        row.cnpjEmitente,
        row.nomeFornecedor,
        row.tags,
        row.tipo,
        row.observacao,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [rows, activeFilter, searchTerm]);

  const counts = useMemo(() => {
    return {
      todos: rows.length,
      lancadas: rows.filter((row) => row.tipo === "Lançada").length,
      naoLancadas: rows.filter((row) => row.tipo === "Não lançada").length,
      divergencias: rows.filter(
        (row) => row.tipo !== "Lançada" && row.tipo !== "Não lançada",
      ).length,
      ativoImobilizado: rows.filter((row) => row.ativoImobilizado).length,
    };
  }, [rows]);

  const handleExport = () => {
    if (!filteredRows.length) {
      setErrorMessage("Nenhum registro encontrado para exportação.");
      return;
    }

    try {
      exportFilteredToExcel(
        filteredRows,
        activeFilter === "Todos" ? "NFe" : activeFilter,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível exportar os registros.";
      setErrorMessage(message);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 18 }}>
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
          NFE · Notas de itens
        </p>

        <p
          style={{
            fontSize: 14,
            color: "#8D8D96",
            margin: "8px 0 0",
          }}
        >
          Compare sistema e SIEG com prioridade máxima pela chave de acesso da nota.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div style={uploadCardStyle}>
          <div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "rgba(215,146,43,.12)",
                border: "1px solid rgba(215,146,43,.18)",
                marginBottom: 14,
              }}
            >
              <FileSpreadsheet size={20} color="#D7922B" />
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "#F5F5F0",
              }}
            >
              Planilha do sistema
            </p>

            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                color: "#8D8D96",
                lineHeight: 1.5,
              }}
            >
              Envie o relatório do sistema. A leitura considera apenas linhas com tipo NFE.
            </p>
          </div>

          <div>
            <input
              ref={systemInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleSystemFileChange}
              style={{ display: "none" }}
            />

            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px dashed #2A2D36",
                background: "#13151A",
                color: "#C7C9D1",
                fontSize: 13,
                wordBreak: "break-word",
              }}
            >
              {getFileName(systemFile)}
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                style={actionButtonStyle("secondary")}
                onClick={() => systemInputRef.current?.click()}
              >
                <UploadCloud size={16} />
                Selecionar arquivo
              </button>

              {systemFile && (
                <button
                  type="button"
                  style={actionButtonStyle("ghost")}
                  onClick={clearSystemFile}
                >
                  <X size={16} />
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={uploadCardStyle}>
          <div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "rgba(215,146,43,.12)",
                border: "1px solid rgba(215,146,43,.18)",
                marginBottom: 14,
              }}
            >
              <FileSpreadsheet size={20} color="#D7922B" />
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "#F5F5F0",
              }}
            >
              Planilha do SIEG
            </p>

            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                color: "#8D8D96",
                lineHeight: 1.5,
              }}
            >
              Envie o relatório XML do SIEG. As tags excluídas já serão desconsideradas automaticamente.
            </p>
          </div>

          <div>
            <input
              ref={governmentInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleGovernmentFileChange}
              style={{ display: "none" }}
            />

            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px dashed #2A2D36",
                background: "#13151A",
                color: "#C7C9D1",
                fontSize: 13,
                wordBreak: "break-word",
              }}
            >
              {getFileName(governmentFile)}
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                style={actionButtonStyle("secondary")}
                onClick={() => governmentInputRef.current?.click()}
              >
                <UploadCloud size={16} />
                Selecionar arquivo
              </button>

              {governmentFile && (
                <button
                  type="button"
                  style={actionButtonStyle("ghost")}
                  onClick={clearGovernmentFile}
                >
                  <X size={16} />
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          ...sectionCardStyle,
          padding: 18,
          marginBottom: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "#F5F5F0",
            }}
          >
            Conciliação de NFe
          </p>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: 13,
              color: "#8D8D96",
            }}
          >
            Prioridade por chave de acesso. Depois disso, valida valor, data e CNPJ.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            style={actionButtonStyle("primary", isProcessing)}
            onClick={handleProcess}
            disabled={isProcessing}
          >
            <UploadCloud size={16} />
            {isProcessing ? "Processando..." : "Processar conciliação"}
          </button>

          <button
            type="button"
            style={actionButtonStyle("secondary", !rows.length)}
            onClick={handleExport}
            disabled={!rows.length}
          >
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            ...sectionCardStyle,
            padding: 14,
            marginBottom: 16,
            border: "1px solid rgba(255,82,82,.22)",
            background: "rgba(255,82,82,.08)",
            color: "#FFB1B1",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {errorMessage}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div style={summaryCardStyle}>
          <p style={{ margin: 0, fontSize: 12, color: "#8D8D96", fontWeight: 700 }}>
            TOTAL SIEG
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 28, color: "#F5F5F0", fontWeight: 800 }}>
            {summary.totalGovernmentNotes}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#8D8D96" }}>
            Quantidade de notas consideradas após filtro de tags.
          </p>
        </div>

        <div style={summaryCardStyle}>
          <p style={{ margin: 0, fontSize: 12, color: "#8D8D96", fontWeight: 700 }}>
            TOTAL SISTEMA
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 28, color: "#F5F5F0", fontWeight: 800 }}>
            {summary.totalSystemNotes}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#8D8D96" }}>
            Quantidade de registros NFE encontrados no relatório do sistema.
          </p>
        </div>

        <div style={summaryCardStyle}>
          <p style={{ margin: 0, fontSize: 12, color: "#8D8D96", fontWeight: 700 }}>
            LANÇADAS
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 28, color: "#7FE3A8", fontWeight: 800 }}>
            {summary.reconciled}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#8D8D96" }}>
            Notas conciliadas entre sistema e SIEG.
          </p>
        </div>

        <div style={summaryCardStyle}>
          <p style={{ margin: 0, fontSize: 12, color: "#8D8D96", fontWeight: 700 }}>
            NÃO LANÇADAS
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 28, color: "#FF9A9A", fontWeight: 800 }}>
            {summary.notLaunchedCount}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#8D8D96" }}>
            {formatCurrency(summary.notLaunchedValue)} em notas não localizadas.
          </p>
        </div>

        <div style={summaryCardStyle}>
          <p style={{ margin: 0, fontSize: 12, color: "#8D8D96", fontWeight: 700 }}>
            DIVERGÊNCIAS
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 28, color: "#F0BE75", fontWeight: 800 }}>
            {summary.divergencesCount}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#8D8D96" }}>
            {formatCurrency(summary.divergencesValue)} com diferença de dados.
          </p>
        </div>
      </div>

      <div
        style={{
          ...sectionCardStyle,
          padding: 18,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              style={filterButtonStyle(activeFilter === "Todos")}
              onClick={() => setActiveFilter("Todos")}
            >
              Todos ({counts.todos})
            </button>

            <button
              type="button"
              style={filterButtonStyle(activeFilter === "Lançada")}
              onClick={() => setActiveFilter("Lançada")}
            >
              Lançadas ({counts.lancadas})
            </button>

            <button
              type="button"
              style={filterButtonStyle(activeFilter === "Não lançada")}
              onClick={() => setActiveFilter("Não lançada")}
            >
              Não lançadas ({counts.naoLancadas})
            </button>

            <button
              type="button"
              style={filterButtonStyle(activeFilter === "Ativo imobilizado")}
              onClick={() => setActiveFilter("Ativo imobilizado")}
            >
              Ativo imobilizado ({counts.ativoImobilizado})
            </button>

            <button
              type="button"
              style={filterButtonStyle(
                !["Todos", "Lançada", "Não lançada", "Ativo imobilizado"].includes(activeFilter),
              )}
              onClick={() => setActiveFilter("Valor divergente")}
            >
              Divergências ({counts.divergencias})
            </button>
          </div>

          <div
            style={{
              position: "relative",
              minWidth: 260,
              flex: "1 1 320px",
              maxWidth: 420,
            }}
          >
            <Search
              size={16}
              color="#8D8D96"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Pesquisar chave, nota, CNPJ, fornecedor..."
              style={{
                ...inputStyle,
                paddingLeft: 38,
              }}
            />
          </div>
        </div>

        {!rows.length ? (
          <div style={emptyStateStyle}>
            <p
              style={{
                margin: 0,
                fontSize: 18,
                color: "#F5F5F0",
                fontWeight: 700,
              }}
            >
              Nenhuma conciliação processada ainda
            </p>

            <p
              style={{
                margin: "10px auto 0",
                maxWidth: 640,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#8D8D96",
              }}
            >
              Envie a planilha do sistema e a planilha do SIEG para montar a comparação por chave de acesso,
              com filtro automático das tags excluídas e separação para ativo imobilizado.
            </p>
          </div>
        ) : !filteredRows.length ? (
          <div style={emptyStateStyle}>
            <p
              style={{
                margin: 0,
                fontSize: 18,
                color: "#F5F5F0",
                fontWeight: 700,
              }}
            >
              Nenhum resultado encontrado
            </p>

            <p
              style={{
                margin: "10px auto 0",
                maxWidth: 640,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#8D8D96",
              }}
            >
              Ajuste o filtro ou a busca para visualizar outros registros.
            </p>
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              overflowX: "auto",
              borderRadius: 14,
              border: "1px solid #23252C",
              background: "#14161B",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1320,
              }}
            >
              <thead>
                <tr>
                  <th style={tableHeaderCellStyle}>Status</th>
                  <th style={tableHeaderCellStyle}>Chave</th>
                  <th style={tableHeaderCellStyle}>NF</th>
                  <th style={tableHeaderCellStyle}>Data</th>
                  <th style={tableHeaderCellStyle}>CNPJ</th>
                  <th style={tableHeaderCellStyle}>Fornecedor</th>
                  <th style={tableHeaderCellStyle}>Tags</th>
                  <th style={tableHeaderCellStyle}>Valor SIEG</th>
                  <th style={tableHeaderCellStyle}>Valor Sistema</th>
                  <th style={tableHeaderCellStyle}>Observação</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td style={tableCellStyle}>
                      <span style={getStatusBadgeStyle(row.tipo)}>{row.tipo}</span>
                    </td>

                    <td style={{ ...tableCellStyle, maxWidth: 260 }}>
                      <div
                        style={{
                          maxWidth: 260,
                          overflowWrap: "anywhere",
                          color: "#D8DAE2",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        {row.chave || "-"}
                      </div>
                    </td>

                    <td style={tableCellStyle}>{row.numeroNF || "-"}</td>
                    <td style={tableCellStyle}>{row.dataEmissao || "-"}</td>
                    <td style={tableCellStyle}>{row.cnpjEmitente || "-"}</td>

                    <td style={{ ...tableCellStyle, minWidth: 220 }}>
                      <div style={{ color: "#F5F5F0", fontWeight: 600 }}>
                        {row.nomeFornecedor || "-"}
                      </div>
                      {row.ativoImobilizado && (
                        <div
                          style={{
                            marginTop: 8,
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: 999,
                            padding: "6px 10px",
                            fontSize: 11,
                            fontWeight: 700,
                            background: "rgba(90, 147, 255, 0.14)",
                            color: "#A6C5FF",
                            border: "1px solid rgba(90, 147, 255, 0.24)",
                          }}
                        >
                          Ativo imobilizado
                        </div>
                      )}
                    </td>

                    <td style={{ ...tableCellStyle, minWidth: 180 }}>
                      <div
                        style={{
                          whiteSpace: "normal",
                          color: "#C9CBD3",
                          lineHeight: 1.5,
                        }}
                      >
                        {row.tags || "-"}
                      </div>
                    </td>

                    <td style={tableCellStyle}>{formatCurrency(row.valor)}</td>
                    <td style={tableCellStyle}>{formatCurrency(row.valorSistema)}</td>

                    <td style={{ ...tableCellStyle, minWidth: 300 }}>
                      <div
                        style={{
                          color: "#C9CBD3",
                          lineHeight: 1.6,
                          whiteSpace: "normal",
                        }}
                      >
                        {row.observacao}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConciliacaoNFE;