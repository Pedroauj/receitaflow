import * as XLSX from "xlsx";
import type { ProcessingResult, ProcessedDocument, ProcessingError } from "./types";

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

function parseFatura(fatura: string): { serie: string; documento: string } | null {
  const str = String(fatura).trim();
  if (str.startsWith("36")) {
    return { serie: "36", documento: str.slice(2) };
  }
  if (str.startsWith("1")) {
    return { serie: "1", documento: str.slice(1) };
  }
  return null;
}

export function processarMartinBrower(
  fileBuffer: ArrayBuffer,
  dataVencimento: Date
): ProcessingResult {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const documents: ProcessedDocument[] = [];
  const errors: ProcessingError[] = [];
  let totalValorBruto = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawDate = row["Data Vcto."];
    if (rawDate == null) continue;

    let rowDate: Date;
    if (typeof rawDate === "number") {
      rowDate = excelDateToJSDate(rawDate);
    } else {
      // Try DD/MM/YYYY
      const parts = String(rawDate).split("/");
      if (parts.length === 3) {
        rowDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else {
        rowDate = new Date(String(rawDate));
      }
    }

    if (!isSameDate(rowDate, dataVencimento)) continue;

    const valorBruto = Number(row["Valor Bruto"]) || 0;
    totalValorBruto += valorBruto;

    const fatura = String(row["Nº da Fatura"] ?? "");
    const parsed = parseFatura(fatura);

    if (!parsed) {
      errors.push({
        row: i + 2, // +2 for header + 0-index
        fatura,
        motivo: `Padrão de fatura não reconhecido: "${fatura}"`,
      });
      continue;
    }

    documents.push({
      filial: "01",
      serie: parsed.serie,
      numeroDocumento: parsed.documento,
      tipoDocumento: "NF",
      valorPago: valorBruto,
    });
  }

  return {
    documents,
    errors,
    totalValorBruto: Math.round(totalValorBruto * 100) / 100,
    totalDocumentos: documents.length,
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

  // Set column widths
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
