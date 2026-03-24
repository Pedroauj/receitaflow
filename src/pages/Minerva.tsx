import { useState } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

type ProcessSummary = {
  selectedDate: string;
  reportRows: number;
  uniqueDocs: number;
  matchedRows: number;
  missingDocs: string[];
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
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
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

  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
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

const Minerva = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [planilhaZeroFile, setPlanilhaZeroFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [summary, setSummary] = useState<ProcessSummary | null>(null);

  const handleProcess = async () => {
    if (!selectedDate) {
      toast.error("Informe a data antes de processar.");
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
      const planilhaZeroWorkbook = XLSX.read(planilhaZeroBuffer, { type: "array", cellDates: true });

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
      const markerColumn = 11; // L
      const markerHeader = "Data Antecipação";
      const markerDate = formatDateBR(selectedDate);

      setCellValue(planilhaZeroSheet, markerColumn, 0, markerHeader);

      for (let r = 1; r <= planilhaZeroRange.e.r; r += 1) {
        const numero = normalizeDocument(getCellValue(planilhaZeroSheet, numeroCol, r));
        if (!numero || !docsSet.has(numero)) continue;

        matchedDocs.add(numero);
        setCellValue(planilhaZeroSheet, markerColumn, r, markerDate);

        const valorReceber = toNumber(getCellValue(planilhaZeroSheet, valorReceberCol, r));
        const dataEmissao = safeFormatDateBR(getCellValue(planilhaZeroSheet, dataEmissaoCol, r));

        importRows.push([1, 26, numero, "CTRC", valorReceber, dataEmissao]);
      }

      const missingDocs = Array.from(docsSet)
        .filter((doc) => !matchedDocs.has(doc))
        .sort((a, b) => Number(a) - Number(b));

      const importWorkbook = buildImportWorkbook(importRows, missingDocs);
      XLSX.writeFile(importWorkbook, `minerva-importacao-${selectedDate}.xlsx`);

      setSummary({
        selectedDate,
        reportRows: filteredReportRows,
        uniqueDocs: docsSet.size,
        matchedRows: importRows.length,
        missingDocs,
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
        <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
          Informe a data, anexe o <strong>Relatório Validação Envio</strong> e a{" "}
          <strong>Planilha 0</strong>. O sistema cruza os conhecimentos e gera a planilha final de
          importação.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Data da antecipação</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            A busca nas planilhas será feita com base nessa data.
          </p>
        </div>

        <div className="w-full lg:w-[240px]">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 w-full rounded-lg px-3 text-sm outline-none bg-muted border border-border text-foreground transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3 }}
        className="grid gap-4 lg:grid-cols-2 mb-6"
      >
        <label className="rounded-xl border border-dashed border-border bg-card p-4 cursor-pointer hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <UploadCloud className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Relatório Validação Envio</p>
          </div>

          <p className="text-xs text-muted-foreground">
            Arquivo da esquerda. Será filtrado pela data informada.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 min-h-[44px]">
            <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-foreground truncate">
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

        <label className="rounded-xl border border-dashed border-border bg-card p-4 cursor-pointer hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <UploadCloud className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Planilha 0</p>
          </div>

          <p className="text-xs text-muted-foreground">
            Arquivo da direita. Dela saem Número, Valor a Receber e Data de Emissão.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 min-h-[44px]">
            <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-foreground truncate">
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
            <p className="text-xs text-muted-foreground mt-1">
              Gera a planilha de importação com: FILIAL = 1, SERIE = 26, TIPO DOCUMENTO = CTRC e
              DATA EMISSÃO da Planilha 0.
            </p>
          </div>

          <button
            type="button"
            onClick={handleProcess}
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
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
          className="mt-6 grid gap-4 lg:grid-cols-4"
        >
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Data</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {formatDateBR(summary.selectedDate)}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Linhas no relatório
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">{summary.reportRows}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Conhecimentos únicos
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">{summary.uniqueDocs}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Linhas importadas
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">{summary.matchedRows}</p>
          </div>

          <div className="lg:col-span-4 rounded-xl border border-border bg-card p-4">
            {summary.missingDocs.length === 0 ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-sm font-medium">Todos os conhecimentos foram localizados.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-amber-400 mb-3">
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