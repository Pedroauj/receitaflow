import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Search,
  ShieldAlert,
  UploadCloud,
} from "lucide-react";

type DivergenceType =
  | "Não lançada"
  | "Valor divergente"
  | "Data divergente"
  | "NF divergente"
  | "CNPJ divergente"
  | "Múltiplas divergências";

type ComparisonRow = {
  id: string;
  dataEmissao: string;
  numeroNF: string;
  cnpjPrestador: string;
  valor: number;
  tipo: DivergenceType;
  observacao: string;
};

const mockResults: ComparisonRow[] = [
  {
    id: "1",
    dataEmissao: "12/03/2026",
    numeroNF: "125487",
    cnpjPrestador: "12.345.678/0001-90",
    valor: 1840.5,
    tipo: "Não lançada",
    observacao: "Nota encontrada no governo e não localizada no sistema.",
  },
  {
    id: "2",
    dataEmissao: "12/03/2026",
    numeroNF: "125490",
    cnpjPrestador: "98.765.432/0001-12",
    valor: 2599.9,
    tipo: "Valor divergente",
    observacao: "Mesma NF localizada com valor diferente no sistema.",
  },
  {
    id: "3",
    dataEmissao: "13/03/2026",
    numeroNF: "125512",
    cnpjPrestador: "45.111.222/0001-33",
    valor: 920,
    tipo: "Data divergente",
    observacao: "Mesma NF encontrada, porém com data de emissão divergente.",
  },
  {
    id: "4",
    dataEmissao: "13/03/2026",
    numeroNF: "125530",
    cnpjPrestador: "11.222.333/0001-44",
    valor: 1475.35,
    tipo: "Não lançada",
    observacao: "Não há registro correspondente no sistema.",
  },
  {
    id: "5",
    dataEmissao: "14/03/2026",
    numeroNF: "125551",
    cnpjPrestador: "77.888.999/0001-55",
    valor: 3010.75,
    tipo: "Múltiplas divergências",
    observacao: "Registro semelhante encontrado com diferença de valor e data.",
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const typeStyles: Record<DivergenceType, string> = {
  "Não lançada": "bg-red-500/10 text-red-300 border border-red-500/20",
  "Valor divergente": "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  "Data divergente": "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20",
  "NF divergente": "bg-blue-500/10 text-blue-300 border border-blue-500/20",
  "CNPJ divergente": "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20",
  "Múltiplas divergências": "bg-purple-500/10 text-purple-300 border border-purple-500/20",
};

const Conciliacao = () => {
  const [systemFile, setSystemFile] = useState<File | null>(null);
  const [governmentFile, setGovernmentFile] = useState<File | null>(null);
  const [hasCompared, setHasCompared] = useState(false);
  const [results, setResults] = useState<ComparisonRow[]>([]);
  const [filter, setFilter] = useState<"todos" | "nao-lancadas" | "divergencias">("todos");

  const canCompare = !!systemFile && !!governmentFile;

  const filteredResults = useMemo(() => {
    if (filter === "nao-lancadas") {
      return results.filter((item) => item.tipo === "Não lançada");
    }

    if (filter === "divergencias") {
      return results.filter((item) => item.tipo !== "Não lançada");
    }

    return results;
  }, [filter, results]);

  const summary = useMemo(() => {
    const totalGovernmentNotes = governmentFile ? 128 : 0;
    const totalSystemNotes = systemFile ? 121 : 0;
    const notLaunched = results.filter((item) => item.tipo === "Não lançada");
    const divergences = results.filter((item) => item.tipo !== "Não lançada");

    return {
      totalGovernmentNotes,
      totalSystemNotes,
      reconciled:
        hasCompared && governmentFile
          ? Math.max(totalGovernmentNotes - results.length, 0)
          : 0,
      notLaunchedCount: notLaunched.length,
      divergencesCount: divergences.length,
      notLaunchedValue: notLaunched.reduce((acc, item) => acc + item.valor, 0),
    };
  }, [governmentFile, systemFile, results, hasCompared]);

  const handleCompare = () => {
    if (!canCompare) return;

    setResults(mockResults);
    setHasCompared(true);
    setFilter("todos");
  };

  const handleExport = () => {
    const notLaunchedRows = results.filter((item) => item.tipo === "Não lançada");

    if (!notLaunchedRows.length) return;

    const headers = [
      "Data de Emissão",
      "Número da NF",
      "CNPJ do Prestador",
      "Valor",
      "Tipo",
      "Observação",
    ];

    const csvRows = notLaunchedRows.map((row) => [
      row.dataEmissao,
      row.numeroNF,
      row.cnpjPrestador,
      row.valor.toFixed(2).replace(".", ","),
      row.tipo,
      row.observacao,
    ]);

    const csvContent = [headers, ...csvRows]
      .map((line) =>
        line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";")
      )
      .join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "notas-nao-lancadas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const FileCard = ({
    title,
    description,
    file,
    onChange,
  }: {
    title: string;
    description: string;
    file: File | null;
    onChange: (file: File | null) => void;
  }) => (
    <label
      className="relative block rounded-2xl border border-dashed p-6 transition-all cursor-pointer"
      style={{
        background: "#1D1D20",
        borderColor: file ? "#BA7517" : "#343438",
      }}
    >
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />

      <div className="flex items-start gap-4">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: file ? "#412402" : "#242428" }}
        >
          {file ? (
            <FileSpreadsheet className="h-6 w-6" style={{ color: "#FAC775" }} />
          ) : (
            <UploadCloud className="h-6 w-6" style={{ color: "#8A8A90" }} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold" style={{ color: "#F5F5F0" }}>
            {title}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "#9A9AA3" }}>
            {description}
          </p>

          <div
            className="mt-4 rounded-xl px-4 py-3 text-sm"
            style={{
              background: file ? "#231A10" : "#18181A",
              color: file ? "#FAC775" : "#6E6E76",
              border: "1px solid",
              borderColor: file ? "#5B3A0D" : "#2A2A2E",
            }}
          >
            {file ? file.name : "Clique para selecionar o arquivo"}
          </div>

          <p className="mt-3 text-xs" style={{ color: "#6E6E76" }}>
            Formatos aceitos: .xlsx, .xls e .csv
          </p>
        </div>
      </div>
    </label>
  );

  const SummaryCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  }) => (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "#1D1D20", borderColor: "#2C2C30" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm" style={{ color: "#9A9AA3" }}>
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-semibold" style={{ color: "#F5F5F0" }}>
            {value}
          </h3>
          <p className="mt-2 text-xs" style={{ color: "#6E6E76" }}>
            {subtitle}
          </p>
        </div>

        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#412402" }}
        >
          <Icon className="h-5 w-5" style={{ color: "#FAC775" }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-6 py-6" style={{ background: "#18181A" }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-medium" style={{ color: "#BA7517" }}>
            Auditoria e conferência
          </p>
          <h1 className="mt-1 text-3xl font-semibold" style={{ color: "#F5F5F0" }}>
            Conciliação de relatórios
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "#9A9AA3" }}>
            Compare a planilha do sistema com a planilha do governo para identificar
            notas não lançadas, divergências de valor, data, NF ou CNPJ do prestador.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <FileCard
            title="Planilha do sistema"
            description="Envie o relatório exportado do seu sistema interno."
            file={systemFile}
            onChange={setSystemFile}
          />

          <FileCard
            title="Planilha do governo"
            description="Envie o relatório baixado do portal do governo."
            file={governmentFile}
            onChange={setGovernmentFile}
          />
        </div>

        <div
          className="mt-5 rounded-2xl border p-4"
          style={{ background: "#1D1D20", borderColor: "#2C2C30" }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#F5F5F0" }}>
                Regras da comparação
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#9A9AA3" }}>
                Base de conferência: data de emissão, número da NF, CNPJ do prestador e valor.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCompare}
              disabled={!canCompare}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: canCompare ? "#BA7517" : "#3A3A3E",
                color: canCompare ? "#18181A" : "#8A8A90",
              }}
            >
              <Search className="h-4 w-4" />
              Comparar relatórios
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Notas no governo"
            value={summary.totalGovernmentNotes}
            subtitle="Total considerado na conciliação"
            icon={FileSpreadsheet}
          />
          <SummaryCard
            title="Notas conciliadas"
            value={summary.reconciled}
            subtitle="Registros compatíveis entre os relatórios"
            icon={CheckCircle2}
          />
          <SummaryCard
            title="Não lançadas"
            value={summary.notLaunchedCount}
            subtitle="Encontradas no governo e ausentes no sistema"
            icon={ShieldAlert}
          />
          <SummaryCard
            title="Valor não lançado"
            value={formatCurrency(summary.notLaunchedValue)}
            subtitle="Soma das notas não localizadas no sistema"
            icon={AlertTriangle}
          />
        </div>

        <div className="mt-6">
          <div
            className="rounded-2xl border"
            style={{ background: "#1D1D20", borderColor: "#2C2C30" }}
          >
            <div className="flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: "#2C2C30" }}>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "#F5F5F0" }}>
                  Resultado da conciliação
                </h2>
                <p className="mt-1 text-sm" style={{ color: "#9A9AA3" }}>
                  Visualize o resumo das notas não lançadas e das divergências encontradas.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div
                  className="flex rounded-xl p-1"
                  style={{ background: "#18181A", border: "1px solid #2C2C30" }}
                >
                  <button
                    type="button"
                    onClick={() => setFilter("todos")}
                    className="rounded-lg px-4 py-2 text-sm transition-all"
                    style={{
                      background: filter === "todos" ? "#2B2B30" : "transparent",
                      color: filter === "todos" ? "#F5F5F0" : "#8A8A90",
                    }}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("nao-lancadas")}
                    className="rounded-lg px-4 py-2 text-sm transition-all"
                    style={{
                      background: filter === "nao-lancadas" ? "#2B2B30" : "transparent",
                      color: filter === "nao-lancadas" ? "#F5F5F0" : "#8A8A90",
                    }}
                  >
                    Não lançadas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("divergencias")}
                    className="rounded-lg px-4 py-2 text-sm transition-all"
                    style={{
                      background: filter === "divergencias" ? "#2B2B30" : "transparent",
                      color: filter === "divergencias" ? "#F5F5F0" : "#8A8A90",
                    }}
                  >
                    Divergências
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={!results.some((item) => item.tipo === "Não lançada")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: "#231A10",
                    border: "1px solid #5B3A0D",
                    color: "#FAC775",
                  }}
                >
                  <Download className="h-4 w-4" />
                  Baixar Excel das não lançadas
                </button>
              </div>
            </div>

            {!hasCompared ? (
              <div className="p-10 text-center">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: "#242428" }}
                >
                  <Search className="h-7 w-7" style={{ color: "#8A8A90" }} />
                </div>
                <h3 className="mt-4 text-lg font-semibold" style={{ color: "#F5F5F0" }}>
                  Nenhuma comparação realizada
                </h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6" style={{ color: "#9A9AA3" }}>
                  Envie a planilha do sistema e a planilha do governo para visualizar
                  o resumo da conciliação e exportar as notas não lançadas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr style={{ background: "#18181A" }}>
                      <th
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "#8A8A90" }}
                      >
                        Data de emissão
                      </th>
                      <th
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "#8A8A90" }}
                      >
                        Número NF
                      </th>
                      <th
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "#8A8A90" }}
                      >
                        CNPJ do prestador
                      </th>
                      <th
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "#8A8A90" }}
                      >
                        Valor
                      </th>
                      <th
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "#8A8A90" }}
                      >
                        Tipo
                      </th>
                      <th
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "#8A8A90" }}
                      >
                        Observação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.length > 0 ? (
                      filteredResults.map((row) => (
                        <tr
                          key={row.id}
                          className="border-t"
                          style={{ borderColor: "#2C2C30" }}
                        >
                          <td className="px-5 py-4 text-sm" style={{ color: "#F5F5F0" }}>
                            {row.dataEmissao}
                          </td>
                          <td className="px-5 py-4 text-sm" style={{ color: "#F5F5F0" }}>
                            {row.numeroNF}
                          </td>
                          <td className="px-5 py-4 text-sm" style={{ color: "#F5F5F0" }}>
                            {row.cnpjPrestador}
                          </td>
                          <td className="px-5 py-4 text-sm" style={{ color: "#F5F5F0" }}>
                            {formatCurrency(row.valor)}
                          </td>
                          <td className="px-5 py-4 text-sm">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${typeStyles[row.tipo]}`}
                            >
                              {row.tipo}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm" style={{ color: "#9A9AA3" }}>
                            {row.observacao}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-sm"
                          style={{ color: "#8A8A90" }}
                        >
                          Nenhum item encontrado para o filtro selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conciliacao;