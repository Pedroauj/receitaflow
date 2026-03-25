import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type PreviewRowStatus =
  | "válida"
  | "não localizado"
  | "sem valor"
  | "removida por pagamento";

type PreviewRow = {
  line: number;
  dueDate: string;
  paymentDate: string;
  invoiceNumber: string;
  grossValue: number;
  status: PreviewRowStatus;
};

type ProcessSummary = {
  selectedDate: string;
  reportRows: number;
  uniqueDocs: number;
  matchedRows: number;
  missingDocs: string[];
  totalProcessed: number;
  bankValue: number;
  difference: number;
  status: "ok" | "diverge";
  emptyPaymentCount: number;
  filledPaymentCount: number;
  removedByPaymentCount: number;
  finalValidCount: number;
  errorCount: number;
  previewRows: PreviewRow[];
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const normalizeDocument = (value: unknown) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "");

const parseConhecimentos = (value: unknown) => {
  const matches = String(value ?? "").match(/\d+/g) ?? [];
  return matches.map(normalizeDocument).filter(Boolean);
};

const formatDateBR = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

const normalizeDateValue = (value: unknown): string | null => {
  if (!value && value !== 0) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const year = String(parsed.y);
      const month = String(parsed.m).padStart(2, "0");
      const day = String(parsed.d).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const clean = raw.replace(/,/g, ".").replace(/\//g, ".").split(" ")[0];

  let match = clean.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }

  match = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }

  match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month}-${day}`;
  }

  match = clean.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month}-${day}`;
  }

  return null;
};

const safeFormatDateBR = (value: unknown) => {
  const normalized = normalizeDateValue(value);
  return normalized ? formatDateBR(normalized) : "";
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;

  const normalized = String(value ?? "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrencyBR = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatSignedCurrencyBR = (value: number) => {
  const formatted = formatCurrencyBR(Math.abs(value));
  return value < 0 ? `- ${formatted}` : formatted;
};

const getCellValue = (sheet: XLSX.WorkSheet, colIndex: number, rowIndex: number) => {
  const address = XLSX.utils.encode_cell({ c: colIndex, r: rowIndex });
  return sheet[address]?.v;
};

const setCellValue = (
  sheet: XLSX.WorkSheet,
  colIndex: number,
  rowIndex: number,
  value: string | number
) => {
  const address = XLSX.utils.encode_cell({ c: colIndex, r: rowIndex });
  sheet[address] = {
    t: typeof value === "number" ? "n" : "s",
    v: value,
  };

  const currentRef = sheet["!ref"] || "A1:A1";
  const range = XLSX.utils.decode_range(currentRef);

  if (colIndex > range.e.c) range.e.c = colIndex;
  if (rowIndex > range.e.r) range.e.r = rowIndex;

  sheet["!ref"] = XLSX.utils.encode_range(range);
};

const getHeaderMap = (sheet: XLSX.WorkSheet) => {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
  const headers = new Map<number, string>();

  for (let c = range.s.c; c <= range.e.c; c += 1) {
    const raw = getCellValue(sheet, c, 0);
    headers.set(c, normalizeText(String(raw ?? "")));
  }

  return headers;
};

const findColumn = (sheet: XLSX.WorkSheet, candidates: string[]) => {
  const headers = getHeaderMap(sheet);
  const normalizedCandidates = candidates.map(normalizeText);

  for (const [colIndex, header] of headers.entries()) {
    if (!header) continue;

    if (normalizedCandidates.some((candidate) => header.includes(candidate))) {
      return colIndex;
    }
  }

  return -1;
};

const autoSize = (sheet: XLSX.WorkSheet, widths: number[]) => {
  sheet["!cols"] = widths.map((wch) => ({ wch }));
};

const buildImportWorkbook = (
  rows: Array<[number, number, string, string, number, string]>,
  missingDocs: string[]
) => {
  const workbook = XLSX.utils.book_new();

  const importSheet = XLSX.utils.aoa_to_sheet([
    ["FILIAL", "SERIE", "Nº DOCUMENTO", "TIPO DOCUMENTO", "VALOR PAGO", "DATA EMISSÃO"],
    ...rows,
  ]);

  autoSize(importSheet, [10, 10, 18, 18, 16, 16]);
  XLSX.utils.book_append_sheet(workbook, importSheet, "Importacao");

  if (missingDocs.length > 0) {
    const missingSheet = XLSX.utils.aoa_to_sheet([
      ["DOCUMENTOS NÃO LOCALIZADOS"],
      ...missingDocs.map((doc) => [doc]),
    ]);

    autoSize(missingSheet, [28]);
    XLSX.utils.book_append_sheet(workbook, missingSheet, "Nao Localizados");
  }

  return workbook;
};

const pickReportSheet = (workbook: XLSX.WorkBook) =>
  workbook.SheetNames.find((name) => normalizeText(name).includes("antecip")) ||
  workbook.SheetNames[0];

const pickPlanilhaZeroSheet = (workbook: XLSX.WorkBook) =>
  workbook.SheetNames.find((name) => {
    const normalized = normalizeText(name);
    return (
      normalized === "planilha1" ||
      normalized.includes("planilha 0") ||
      normalized.includes("planilha0")
    );
  }) ||
  workbook.SheetNames.find((name) => !normalizeText(name).includes("resumo")) ||
  workbook.SheetNames[0];

const parseCurrencyInputToNumber = (value: string) => {
  if (!value.trim()) return 0;

  const onlyNumbers = value.replace(/[^\d,.-]/g, "");
  return toNumber(onlyNumbers);
};

const formatCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  const number = Number(digits) / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
};

const getStatusBadgeClass = (status: PreviewRowStatus) => {
  switch (status) {
    case "válida":
      return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";
    case "não localizado":
      return "bg-amber-500/10 text-amber-300 border border-amber-500/20";
    case "sem valor":
      return "bg-slate-500/10 text-slate-300 border border-slate-500/20";
    case "removida por pagamento":
      return "bg-zinc-500/10 text-zinc-300 border border-zinc-500/20";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
};

const metricCardClass =
  "rounded-xl border border-border bg-card p-4 shadow-sm transition-colors";
const metricTitleClass = "text-[11px] uppercase tracking-wider text-muted-foreground";
const metricValueClass = "mt-2 text-2xl font-semibold text-foreground";

const Minerva = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [bankValue, setBankValue] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [planilhaZeroFile, setPlanilhaZeroFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [summary, setSummary] = useState<ProcessSummary | null>(null);

  const canProcess = useMemo(
    () => Boolean(selectedDate && bankValue && reportFile && planilhaZeroFile && !processing),
    [selectedDate, bankValue, reportFile, planilhaZeroFile, processing]
  );

  const handleBankValueChange = (value: string) => {
    setBankValue(formatCurrencyInput(value));
  };

  const handleProcess = async () => {
    if (!selectedDate) {
      toast.error("Informe a data antes de processar.");
      return;
    }

    if (!bankValue.trim()) {
      toast.error("Informe o valor do banco antes de processar.");
      return;
    }

    if (!reportFile || !planilhaZeroFile) {
      toast.error("Anexe as duas planilhas.");
      return;
    }

    try {
      setProcessing(true);
      setSummary(null);

      const reportBuffer = await reportFile.arrayBuffer();
      const planilhaZeroBuffer = await planilhaZeroFile.arrayBuffer();

      const reportWorkbook = XLSX.read(reportBuffer, { type: "array", cellDates: true });
      const planilhaZeroWorkbook = XLSX.read(planilhaZeroBuffer, {
        type: "array",
        cellDates: true,
      });

      const reportSheet = reportWorkbook.Sheets[pickReportSheet(reportWorkbook)];
      const planilhaZeroSheet = planilhaZeroWorkbook.Sheets[pickPlanilhaZeroSheet(planilhaZeroWorkbook)];

      const reportDateCol = findColumn(reportSheet, ["antecipado", "antecipacao", "antecipação"]);
      const reportConhecimentoCol = findColumn(reportSheet, [
        "conhecimento frete",
        "conhecimento",
        "frete",
      ]);

      const numeroCol = findColumn(planilhaZeroSheet, ["numero", "número"]);
      const valorReceberCol = findColumn(planilhaZeroSheet, ["valor a receber"]);
      const dataEmissaoCol = findColumn(planilhaZeroSheet, [
        "data de emissao",
        "data emissão",
        "data emissao",
        "emissao",
        "emissão",
      ]);
      const statusCol = findColumn(planilhaZeroSheet, [
        "status", "situacao", "situação", "sit", "estado",
      ]);

      if (reportDateCol < 0 || reportConhecimentoCol < 0) {
        throw new Error(
          "Não consegui localizar as colunas de antecipação / conhecimento frete no relatório."
        );
      }

      if (numeroCol < 0 || valorReceberCol < 0) {
        throw new Error("Não consegui localizar as colunas Número / Valor a Receber na Planilha 0.");
      }

      if (dataEmissaoCol < 0) {
        throw new Error("Não consegui localizar a coluna Data de Emissão na Planilha 0.");
      }

      const reportRange = XLSX.utils.decode_range(reportSheet["!ref"] || "A1:A1");
      const planilhaZeroRange = XLSX.utils.decode_range(planilhaZeroSheet["!ref"] || "A1:A1");

      const docsSet = new Set<string>();
      let filteredReportRows = 0;

      for (let r = 1; r <= reportRange.e.r; r += 1) {
        const anticipationDate = normalizeDateValue(getCellValue(reportSheet, reportDateCol, r));
        if (anticipationDate !== selectedDate) continue;

        filteredReportRows += 1;

        const conhecimentos = parseConhecimentos(getCellValue(reportSheet, reportConhecimentoCol, r));
        conhecimentos.forEach((doc) => docsSet.add(doc));
      }

      if (filteredReportRows === 0 || docsSet.size === 0) {
        throw new Error("Nenhum conhecimento foi encontrado para a data informada.");
      }

      const matchedDocs = new Set<string>();
      const importRows: Array<[number, number, string, string, number, string]> = [];
      const previewRows: PreviewRow[] = [];
      const markerColumn = 11;
      const markerHeader = "Data Antecipação";
      const markerDate = formatDateBR(selectedDate);

      let totalProcessed = 0;
      let emptyPaymentCount = 0;
      let filledPaymentCount = 0;
      let removedByPaymentCount = 0;
      let finalValidCount = 0;
      let errorCount = 0;

      setCellValue(planilhaZeroSheet, markerColumn, 0, markerHeader);

      for (let r = 1; r <= planilhaZeroRange.e.r; r += 1) {
        const numero = normalizeDocument(getCellValue(planilhaZeroSheet, numeroCol, r));
        if (!numero || !docsSet.has(numero)) continue;

        // Filtrar documentos inutilizados
        if (statusCol >= 0) {
          const rawStatus = String(getCellValue(planilhaZeroSheet, statusCol, r) ?? "").trim().toUpperCase();
          if (rawStatus.startsWith("INUTILIZAD")) continue;
        }

        matchedDocs.add(numero);
        setCellValue(planilhaZeroSheet, markerColumn, r, markerDate);

        const valorReceber = toNumber(getCellValue(planilhaZeroSheet, valorReceberCol, r));
        const dataEmissaoBr = safeFormatDateBR(getCellValue(planilhaZeroSheet, dataEmissaoCol, r));

        const hasValue = valorReceber > 0;
        const previewStatus: PreviewRowStatus = hasValue ? "válida" : "sem valor";

        if (hasValue) {
          filledPaymentCount += 1;
          finalValidCount += 1;
          totalProcessed += valorReceber;
        } else {
          emptyPaymentCount += 1;
          removedByPaymentCount += 1;
        }

        importRows.push([1, 26, numero, "CTRC", valorReceber, dataEmissaoBr]);

        if (previewRows.length < 20) {
          previewRows.push({
            line: r + 1,
            dueDate: markerDate,
            paymentDate: dataEmissaoBr,
            invoiceNumber: numero,
            grossValue: valorReceber,
            status: previewStatus,
          });
        }
      }

      const missingDocs = Array.from(docsSet)
        .filter((doc) => !matchedDocs.has(doc))
        .sort((a, b) => Number(a) - Number(b));

      if (missingDocs.length > 0) {
        errorCount += missingDocs.length;

        const remainingPreviewSlots = 20 - previewRows.length;
        if (remainingPreviewSlots > 0) {
          missingDocs.slice(0, remainingPreviewSlots).forEach((doc, index) => {
            previewRows.push({
              line: previewRows.length + index + 2,
              dueDate: markerDate,
              paymentDate: "",
              invoiceNumber: doc,
              grossValue: 0,
              status: "não localizado",
            });
          });
        }
      }

      const importWorkbook = buildImportWorkbook(importRows, missingDocs);
      XLSX.writeFile(importWorkbook, `minerva-importacao-${selectedDate}.xlsx`);

      const bankValueNumber = parseCurrencyInputToNumber(bankValue);
      const difference = totalProcessed - bankValueNumber;
      const status = Math.abs(difference) < 0.01 ? "ok" : "diverge";

      setSummary({
        selectedDate,
        reportRows: filteredReportRows,
        uniqueDocs: docsSet.size,
        matchedRows: importRows.length,
        missingDocs,
        totalProcessed,
        bankValue: bankValueNumber,
        difference,
        status,
        emptyPaymentCount,
        filledPaymentCount,
        removedByPaymentCount,
        finalValidCount,
        errorCount,
        previewRows,
      });

      if (missingDocs.length > 0) {
        toast.warning(`Importação gerada com ${missingDocs.length} documento(s) não localizado(s).`);
      } else {
        toast.success("Planilha de importação gerada com sucesso.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao processar as planilhas.";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-6"
      >
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Minerva</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Informe a data, o valor do banco, anexe o <strong>Relatório Validação Envio</strong> e a{" "}
          <strong>Planilha 0</strong>. O sistema cruza os conhecimentos e gera a planilha final de
          importação, exibindo um resumo completo do processamento.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="mb-4 rounded-xl border border-border bg-card p-4"
      >
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Parâmetros da validação</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            A busca nas planilhas será feita com base na data informada e o valor será usado para
            validar a diferença final.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Data da antecipação
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-muted px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Valor banco
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="R$ 0,00"
              value={bankValue}
              onChange={(e) => handleBankValueChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-muted px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3 }}
        className="mb-6 grid gap-4 lg:grid-cols-2"
      >
        <label
          className="cursor-pointer rounded-xl border border-dashed border-border bg-card p-4 transition-colors hover:border-primary/30 data-[dragover=true]:border-primary data-[dragover=true]:bg-primary/5"
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.dataset.dragover = "true"; }}
          onDragLeave={(e) => { e.currentTarget.dataset.dragover = "false"; }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.dataset.dragover = "false";
            const f = e.dataTransfer.files[0];
            if (f && /\.(xlsx?|xls)$/i.test(f.name)) setReportFile(f);
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Relatório Validação Envio</p>
          </div>

          <p className="text-xs text-muted-foreground">
            Arraste o arquivo aqui ou clique para selecionar.
          </p>

          <div className="mt-4 flex min-h-[44px] items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-sm text-foreground">
              {reportFile?.name || "Selecionar arquivo"}
            </span>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => setReportFile(e.target.files?.[0] || null)}
          />
        </label>

        <label
          className="cursor-pointer rounded-xl border border-dashed border-border bg-card p-4 transition-colors hover:border-primary/30 data-[dragover=true]:border-primary data-[dragover=true]:bg-primary/5"
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.dataset.dragover = "true"; }}
          onDragLeave={(e) => { e.currentTarget.dataset.dragover = "false"; }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.dataset.dragover = "false";
            const f = e.dataTransfer.files[0];
            if (f && /\.(xlsx?|xls)$/i.test(f.name)) setPlanilhaZeroFile(f);
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Planilha 0</p>
          </div>

          <p className="text-xs text-muted-foreground">
            Arraste o arquivo aqui ou clique para selecionar.
          </p>

          <div className="mt-4 flex min-h-[44px] items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-sm text-foreground">
              {planilhaZeroFile?.name || "Selecionar arquivo"}
            </span>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => setPlanilhaZeroFile(e.target.files?.[0] || null)}
          />
        </label>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Processamento</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gera a planilha de importação com: FILIAL = 1, SERIE = 26, TIPO DOCUMENTO = CTRC e
              DATA EMISSÃO da Planilha 0.
            </p>
          </div>

          <button
            type="button"
            onClick={handleProcess}
            disabled={!canProcess}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Gerar planilha de importação
              </>
            )}
          </button>
        </div>
      </motion.div>

      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="mb-4">
            <p className="text-base font-semibold text-foreground">Resultado do Processamento</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-7">
            <div className={metricCardClass}>
              <p className={metricTitleClass}>Linhas lidas</p>
              <p className={metricValueClass}>{summary.reportRows}</p>
            </div>

            <div className={metricCardClass}>
              <p className={metricTitleClass}>Filtradas por Data Vcto.</p>
              <p className={metricValueClass}>{summary.reportRows}</p>
            </div>

            <div className={metricCardClass}>
              <p className={metricTitleClass}>Pgto vazio</p>
              <p className={metricValueClass}>{summary.emptyPaymentCount}</p>
            </div>

            <div className={metricCardClass}>
              <p className={metricTitleClass}>Pgto preenchido</p>
              <p className={metricValueClass}>{summary.filledPaymentCount}</p>
            </div>

            <div className={metricCardClass}>
              <p className={metricTitleClass}>Removidas por pagamento</p>
              <p className={metricValueClass}>{summary.removedByPaymentCount}</p>
            </div>

            <div className={metricCardClass}>
              <p className={metricTitleClass}>Válidas finais</p>
              <p className={metricValueClass}>{summary.finalValidCount}</p>
            </div>

            <div className={metricCardClass}>
              <p className={metricTitleClass}>Com erro</p>
              <p className={metricValueClass}>{summary.errorCount}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-1">
              <p className={metricTitleClass}>Total processado</p>
              <p className="mt-2 text-2xl font-semibold text-amber-400">
                {formatCurrencyBR(summary.totalProcessed)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-1">
              <p className={metricTitleClass}>Valor banco</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatCurrencyBR(summary.bankValue)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-1">
              <p className={metricTitleClass}>Diferença</p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  Math.abs(summary.difference) < 0.01 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatSignedCurrencyBR(summary.difference)}
              </p>
            </div>

            <div
              className={`rounded-xl border p-4 shadow-sm lg:col-span-1 ${
                summary.status === "ok"
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-red-500/30 bg-red-500/10"
              }`}
            >
              <p className={metricTitleClass}>Status</p>

              <div className="mt-2 flex items-center gap-2">
                {summary.status === "ok" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <p
                  className={`text-xl font-semibold ${
                    summary.status === "ok" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {summary.status === "ok" ? "Bateu" : "Diverge"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            {summary.finalValidCount === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" />
                <p className="text-sm">
                  Nenhum documento em aberto foi encontrado para a data de vencimento selecionada.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-sm font-medium">
                  {summary.finalValidCount} documento(s) válido(s) encontrado(s) para a data
                  selecionada.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">
                Preview de validação (primeiras 20 linhas)
              </p>
            </div>

            <div className="overflow-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-6 gap-3 border-b border-border pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <div>Linha</div>
                  <div>Data Vcto.</div>
                  <div>Data Pagamento</div>
                  <div>Nº Fatura</div>
                  <div>Valor Bruto</div>
                  <div>Status</div>
                </div>

                <div className="max-h-[320px] overflow-auto">
                  {summary.previewRows.map((row) => (
                    <div
                      key={`${row.line}-${row.invoiceNumber}-${row.status}`}
                      className="grid grid-cols-6 gap-3 border-b border-border/60 py-3 text-sm text-foreground"
                    >
                      <div>{row.line}</div>
                      <div>{row.dueDate || "-"}</div>
                      <div>{row.paymentDate || "-"}</div>
                      <div>{row.invoiceNumber || "-"}</div>
                      <div>{formatCurrencyBR(row.grossValue)}</div>
                      <div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {summary.previewRows.length === 0 && (
                    <div className="py-6 text-sm text-muted-foreground">
                      Nenhuma linha disponível para preview.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            {summary.missingDocs.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-sm font-medium">Todos os conhecimentos foram localizados.</p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm font-medium">
                    {summary.missingDocs.length} documento(s) não localizado(s)
                  </p>
                </div>

                <div className="max-h-56 overflow-auto rounded-lg bg-muted p-3">
                  <div className="flex flex-wrap gap-2">
                    {summary.missingDocs.map((doc) => (
                      <span
                        key={doc}
                        className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Minerva;