import * as XLSX from "xlsx";
import type { ProcessingResult, ProcessedDocument, ProcessingError } from "./types";

/** Convert Excel serial date to JS Date (UTC-safe) */
function excelDateToJSDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  return new Date(utcDays * 86400 * 1000);
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Try to parse a date from various formats */
function parseDate(raw: unknown): Date | null {
  if (raw == null || raw === "") return null;

  // Excel serial number
  if (typeof raw === "number") {
    const d = excelDateToJSDate(raw);
    return isNaN(d.getTime()) ? null : d;
  }

  // Date object
  if (raw instanceof Date) {
    return isNaN(raw.getTime()) ? null : raw;
  }

  const str = String(raw).trim();
  if (!str) return null;

  // DD/MM/YYYY or DD-MM-YYYY
  const brMatch = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (brMatch) {
    const d = new Date(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1]));
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  // Fallback
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/** Parse monetary value handling comma, dots, currency symbols, spaces */
function parseValor(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return isNaN(raw) ? null : raw;

  let str = String(raw).trim();
  if (!str) return null;

  // Remove currency symbols and spaces
  str = str.replace(/[R$\s]/g, "");

  // Handle Brazilian format: 1.234,56 → 1234.56
  if (str.includes(",")) {
    // If has both dot and comma, dot is thousands separator
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

/** Clean and parse fatura number */
function parseFatura(raw: unknown): { serie: string; documento: string } | { error: string } {
  if (raw == null || String(raw).trim() === "") {
    return { error: "Nº da Fatura vazio" };
  }

  // Remove spaces, dots, dashes and non-numeric chars
  const str = String(raw).trim().replace(/[\s.\-\/]/g, "");

  if (!/^\d+$/.test(str)) {
    return { error: `Nº da Fatura contém caracteres inválidos: "${String(raw).trim()}"` };
  }

  if (str.startsWith("36") && str.length > 2) {
    return { serie: "36", documento: str.slice(2) };
  }
  if (str.startsWith("1") && str.length > 1) {
    return { serie: "1", documento: str.slice(1) };
  }

  return { error: `Padrão de fatura não reconhecido: "${String(raw).trim()}"` };
}

export function processarMartinBrower(
  fileBuffer: ArrayBuffer
): ProcessingResult {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const totalLinhasLidas = rows.length;

  // Discover actual column names from first row
  const sampleKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
  const colValorBruto = findColumn(sampleKeys, "Valor Bruto");
  const colFatura = findColumn(sampleKeys, "Nº da Fatura");

  const documents: ProcessedDocument[] = [];
  const errors: ProcessingError[] = [];
  let totalValorBruto = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for header row + 0-index

    // Validate Valor Bruto
    const rawValor = colValorBruto ? row[colValorBruto] : undefined;
    const valorBruto = parseValor(rawValor);

    if (valorBruto === null) {
      errors.push({
        row: rowNum,
        fatura: String(colFatura ? row[colFatura] ?? "" : ""),
        motivo: `Valor Bruto vazio ou inválido: "${String(rawValor ?? "")}"`,
      });
      continue;
    }

    totalValorBruto += valorBruto;

    // Validate Fatura
    const rawFatura = colFatura ? row[colFatura] : undefined;
    const faturaResult = parseFatura(rawFatura);

    if ("error" in faturaResult) {
      errors.push({
        row: rowNum,
        fatura: String(rawFatura ?? ""),
        motivo: faturaResult.error,
      });
      continue;
    }

    documents.push({
      filial: "01",
      serie: faturaResult.serie,
      numeroDocumento: faturaResult.documento,
      tipoDocumento: "NF",
      valorPago: Math.round(valorBruto * 100) / 100,
    });
  }

  return {
    documents,
    errors,
    totalValorBruto: Math.round(totalValorBruto * 100) / 100,
    totalDocumentos: documents.length,
    totalLinhasLidas,
    totalLinhasFiltradas: totalLinhasLidas,
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
