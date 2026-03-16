import * as XLSX from "xlsx";
import type { ProcessingResult, ProcessedDocument, ProcessingError, PreviewRow } from "./types";

/** Parse monetary value handling Brazilian format */
function parseValor(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return isNaN(raw) ? null : raw;

  let str = String(raw).trim();
  if (!str) return null;

  // Remove currency symbols and spaces
  str = str.replace(/[R$\s]/g, "");

  // Handle Brazilian format: 1.234,56 → 1234.56
  if (str.includes(",")) {
    if (str.includes(".")) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      str = str.replace(",", ".");
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/** Normalize column names by trimming and collapsing whitespace */
function normalizeColumnName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** Find the actual column key in row matching a target name (case-insensitive, normalized) */
function findColumn(rowKeys: string[], target: string): string | undefined {
  const normalizedTarget = normalizeColumnName(target).toLowerCase();
  return rowKeys.find(
    (k) => normalizeColumnName(k).toLowerCase() === normalizedTarget
  );
}

/** Keywords that indicate summary/total/subtitle rows */
const SKIP_KEYWORDS = [
  "total", "subtotal", "sub-total", "soma", "resumo",
  "grand total", "total geral", "qtd", "quantidade",
];

/** Check if a value looks like a summary/total/header row */
function isSummaryRow(faturaRaw: string): boolean {
  const lower = faturaRaw.toLowerCase().trim();
  return SKIP_KEYWORDS.some((kw) => lower.includes(kw));
}

/** Check if fatura is a valid document number starting with 36 or 1 */
function isValidFatura(str: string): boolean {
  const cleaned = str.replace(/[\s.\-\/]/g, "");
  if (!/^\d+$/.test(cleaned)) return false;
  return cleaned.startsWith("36") || cleaned.startsWith("1");
}

/** Parse fatura into serie + documento */
function parseFatura(cleaned: string): { serie: string; documento: string } {
  const str = cleaned.replace(/[\s.\-\/]/g, "");
  if (str.startsWith("36") && str.length > 2) {
    return { serie: "36", documento: str.slice(2) };
  }
  return { serie: "1", documento: str.slice(1) };
}

/**
 * Parse an Excel date value to a comparable string "yyyy-MM-dd".
 * Handles both Excel serial numbers and string dates.
 */
function parseExcelDate(raw: unknown): string | null {
  if (raw == null) return null;

  // Excel serial number
  if (typeof raw === "number") {
    const d = XLSX.SSF.parse_date_code(raw);
    if (!d) return null;
    const yyyy = String(d.y).padStart(4, "0");
    const mm = String(d.m).padStart(2, "0");
    const dd = String(d.d).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const str = String(raw).trim();
  if (!str) return null;

  // dd/MM/yyyy
  const brMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}`;
  }

  // yyyy-MM-dd
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return null;
}

/** Format a JS Date to yyyy-MM-dd for comparison */
function formatDateForCompare(date: Date): string {
  const yyyy = String(date.getFullYear()).padStart(4, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function processarMartinBrower(
  fileBuffer: ArrayBuffer,
  dataVencimento: Date
): ProcessingResult {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const totalLinhasLidas = rows.length;
  const dataVctoAlvo = formatDateForCompare(dataVencimento);

  // Discover actual column names from first row
  const sampleKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
  const colValorBruto = findColumn(sampleKeys, "Valor Bruto");
  const colFatura = findColumn(sampleKeys, "Nº da Fatura");
  const colDataVcto = findColumn(sampleKeys, "Data Vcto.") || findColumn(sampleKeys, "Data Vcto");
  const colDataPagamento = findColumn(sampleKeys, "Data de Pagamento") || findColumn(sampleKeys, "Data Pagamento") || findColumn(sampleKeys, "Dt Pagamento");

  const documents: ProcessedDocument[] = [];
  const errors: ProcessingError[] = [];
  const preview: PreviewRow[] = [];
  let totalValorBruto = 0;
  let totalLinhasIgnoradas = 0;
  let totalLinhasFiltradasData = 0;
  let totalLinhasRemovidasPagamento = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const rawFaturaVal = colFatura ? row[colFatura] : undefined;
    const rawValorVal = colValorBruto ? row[colValorBruto] : undefined;
    const rawDataVcto = colDataVcto ? row[colDataVcto] : undefined;
    const rawDataPagamento = colDataPagamento ? row[colDataPagamento] : undefined;
    const faturaStr = String(rawFaturaVal ?? "").trim();
    const valorStr = String(rawValorVal ?? "").trim();
    const dataVctoStr = parseExcelDate(rawDataVcto);
    const dataVctoDisplay = dataVctoStr
      ? `${dataVctoStr.slice(8, 10)}/${dataVctoStr.slice(5, 7)}/${dataVctoStr.slice(0, 4)}`
      : String(rawDataVcto ?? "").trim();

    const dataPagStr = parseExcelDate(rawDataPagamento);
    const dataPagDisplay = dataPagStr
      ? `${dataPagStr.slice(8, 10)}/${dataPagStr.slice(5, 7)}/${dataPagStr.slice(0, 4)}`
      : String(rawDataPagamento ?? "").trim();

    // Skip empty rows
    if (!faturaStr && !valorStr) {
      totalLinhasIgnoradas++;
      continue;
    }

    // Skip summary/header rows
    if (isSummaryRow(faturaStr) || faturaStr.toLowerCase() === "nº da fatura") {
      totalLinhasIgnoradas++;
      continue;
    }

    // --- Filter by Data Vcto. ---
    if (!dataVctoStr || dataVctoStr !== dataVctoAlvo) {
      totalLinhasFiltradasData++;
      continue;
    }

    // --- Filter: remove rows with Data de Pagamento filled ---
    const hasPagamento = rawDataPagamento != null && String(rawDataPagamento).trim() !== "";
    if (hasPagamento) {
      totalLinhasRemovidasPagamento++;
      if (preview.length < 20) {
        const fd = isValidFatura(faturaStr) ? parseFatura(faturaStr) : { serie: "", documento: "" };
        preview.push({ row: rowNum, dataVcto: dataVctoDisplay, dataPagamento: dataPagDisplay, faturaOriginal: faturaStr, serie: fd.serie, numeroDocumento: fd.documento, valorBrutoOriginal: valorStr, valorBrutoConvertido: null, status: "ignorada" });
      }
      continue;
    }

    // --- Fatura must be filled ---
    if (!faturaStr) {
      totalLinhasIgnoradas++;
      if (preview.length < 20) {
        preview.push({ row: rowNum, dataVcto: dataVctoDisplay, dataPagamento: "", faturaOriginal: "", serie: "", numeroDocumento: "", valorBrutoOriginal: valorStr, valorBrutoConvertido: null, status: "ignorada" });
      }
      continue;
    }

    // --- Fatura must be valid (starts with 36 or 1) ---
    if (!isValidFatura(faturaStr)) {
      totalLinhasIgnoradas++;
      if (preview.length < 20) {
        preview.push({ row: rowNum, dataVcto: dataVctoDisplay, dataPagamento: "", faturaOriginal: faturaStr, serie: "", numeroDocumento: "", valorBrutoOriginal: valorStr, valorBrutoConvertido: null, status: "ignorada" });
      }
      continue;
    }

    // --- Valor Bruto must be valid ---
    const valorBruto = parseValor(rawValorVal);
    if (valorBruto === null || valorBruto === 0) {
      const faturaData = parseFatura(faturaStr);
      errors.push({ row: rowNum, fatura: faturaStr, motivo: `Valor Bruto vazio ou inválido: "${valorStr}"` });
      if (preview.length < 20) {
        preview.push({ row: rowNum, dataVcto: dataVctoDisplay, dataPagamento: "", faturaOriginal: faturaStr, serie: faturaData.serie, numeroDocumento: faturaData.documento, valorBrutoOriginal: valorStr, valorBrutoConvertido: null, status: "erro" });
      }
      continue;
    }

    // --- Valid row ---
    const faturaData = parseFatura(faturaStr);
    totalValorBruto += valorBruto;

    documents.push({
      filial: "1",
      serie: faturaData.serie,
      numeroDocumento: faturaData.documento,
      tipoDocumento: "CTRC",
      valorPago: Math.round(valorBruto * 100) / 100,
    });

    if (preview.length < 20) {
      preview.push({
        row: rowNum,
        dataVcto: dataVctoDisplay,
        faturaOriginal: faturaStr,
        serie: faturaData.serie,
        numeroDocumento: faturaData.documento,
        valorBrutoOriginal: valorStr,
        valorBrutoConvertido: Math.round(valorBruto * 100) / 100,
        status: "válida",
      });
    }
  }

  return {
    documents,
    errors,
    preview,
    totalValorBruto: Math.round(totalValorBruto * 100) / 100,
    totalDocumentos: documents.length,
    totalLinhasLidas,
    totalLinhasFiltradasData,
    totalLinhasIgnoradas,
    totalLinhasValidas: documents.length,
    totalLinhasComErro: errors.length,
  };
}

export function gerarPlanilhaFinal(
  documents: ProcessedDocument[],
  _dataRecebimento: Date
): ArrayBuffer {
  const data = documents.map((doc) => ({
    FILIAL: doc.filial,
    SERIE: doc.serie,
    "Nº DOCUMENTO": doc.numeroDocumento,
    "TIPO DOCUMENTO": doc.tipoDocumento,
    "VALOR PAGO": doc.valorPago,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  ws["!cols"] = [
    { wch: 10 },
    { wch: 8 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Baixa por Aviso Bancário");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}
