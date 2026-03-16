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
  // Must be purely numeric after cleanup
  const cleaned = str.replace(/[\s.\-\/]/g, "");
  if (!/^\d+$/.test(cleaned)) return false;
  // Must start with 36 or 1
  return cleaned.startsWith("36") || cleaned.startsWith("1");
}

/** Parse fatura into serie + documento */
function parseFatura(cleaned: string): { serie: string; documento: string } {
  const str = cleaned.replace(/[\s.\-\/]/g, "");
  if (str.startsWith("36") && str.length > 2) {
    return { serie: "36", documento: str.slice(2) };
  }
  // starts with "1"
  return { serie: "1", documento: str.slice(1) };
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
  const preview: PreviewRow[] = [];
  let totalValorBruto = 0;
  let totalLinhasIgnoradas = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for header row + 0-index

    const rawFaturaVal = colFatura ? row[colFatura] : undefined;
    const rawValorVal = colValorBruto ? row[colValorBruto] : undefined;
    const faturaStr = String(rawFaturaVal ?? "").trim();
    const valorStr = String(rawValorVal ?? "").trim();

    // --- Ignorar linhas vazias ---
    if (!faturaStr && !valorStr) {
      totalLinhasIgnoradas++;
      if (preview.length < 20) {
        preview.push({ row: rowNum, faturaOriginal: "", valorBrutoOriginal: "", valorBrutoConvertido: null, status: "ignorada" });
      }
      continue;
    }

    // --- Ignorar linhas de total/subtotal/resumo/cabeçalho repetido ---
    if (isSummaryRow(faturaStr) || faturaStr.toLowerCase() === "nº da fatura") {
      totalLinhasIgnoradas++;
      if (preview.length < 20) {
        preview.push({ row: rowNum, faturaOriginal: faturaStr, valorBrutoOriginal: valorStr, valorBrutoConvertido: null, status: "ignorada" });
      }
      continue;
    }

    // --- Fatura precisa estar preenchida ---
    if (!faturaStr) {
      totalLinhasIgnoradas++;
      if (preview.length < 20) {
        preview.push({ row: rowNum, faturaOriginal: "", valorBrutoOriginal: valorStr, valorBrutoConvertido: null, status: "ignorada" });
      }
      continue;
    }

    // --- Fatura precisa ser um documento válido (começa com 36 ou 1) ---
    if (!isValidFatura(faturaStr)) {
      totalLinhasIgnoradas++;
      if (preview.length < 20) {
        preview.push({ row: rowNum, faturaOriginal: faturaStr, valorBrutoOriginal: valorStr, valorBrutoConvertido: null, status: "ignorada" });
      }
      continue;
    }

    // --- Valor Bruto precisa estar preenchido e ser numérico ---
    const valorBruto = parseValor(rawValorVal);
    if (valorBruto === null || valorBruto === 0) {
      errors.push({ row: rowNum, fatura: faturaStr, motivo: `Valor Bruto vazio ou inválido: "${valorStr}"` });
      if (preview.length < 20) {
        preview.push({ row: rowNum, faturaOriginal: faturaStr, valorBrutoOriginal: valorStr, valorBrutoConvertido: null, status: "erro" });
      }
      continue;
    }

    // --- Linha válida ---
    const faturaData = parseFatura(faturaStr);
    totalValorBruto += valorBruto;

    documents.push({
      filial: "01",
      serie: faturaData.serie,
      numeroDocumento: faturaData.documento,
      tipoDocumento: "NF",
      valorPago: Math.round(valorBruto * 100) / 100,
    });

    if (preview.length < 20) {
      preview.push({ row: rowNum, faturaOriginal: faturaStr, valorBrutoOriginal: valorStr, valorBrutoConvertido: Math.round(valorBruto * 100) / 100, status: "válida" });
    }
  }

  return {
    documents,
    errors,
    preview,
    totalValorBruto: Math.round(totalValorBruto * 100) / 100,
    totalDocumentos: documents.length,
    totalLinhasLidas,
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
