import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import type { ProcessedDocument } from "./types";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export interface NaturaDocument {
  filial: string;
  serie: string;
  numeroDocumento: string;
  tipoDocumento: string;
  valor: number;
}

export interface NaturaProcessingResult {
  documents: NaturaDocument[];
  totalDocumentos: number;
  totalValor: number;
}

function parseValor(raw: string): number | null {
  if (!raw || typeof raw !== "string") return null;
  // Remove dots (thousands separator) and replace comma with dot
  const cleaned = raw.replace(/\./g, "").replace(",", ".").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export async function processarNatura(fileBuffer: ArrayBuffer): Promise<NaturaProcessingResult> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }

  const normalizedText = fullText
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const documents: NaturaDocument[] = [];
  const pairPattern = /N[º°]?\s*DO\s*DOCUMENTO\s*:?\s*([\d.-]+)[\s\S]{0,200}?VALOR\s*DA\s*OPERACAO\s*:?\s*([\d.,]+)/gi;

  let match: RegExpExecArray | null;
  while ((match = pairPattern.exec(normalizedText)) !== null) {
    const numeroDocumento = match[1]?.trim();
    const valor = parseValor(match[2] ?? "");

    if (!numeroDocumento || valor === null) continue;

    documents.push({
      filial: "1",
      serie: "1",
      numeroDocumento,
      tipoDocumento: "CTRC",
      valor,
    });
  }

  const totalValor = documents.reduce((sum, d) => sum + d.valor, 0);

  return {
    documents,
    totalDocumentos: documents.length,
    totalValor,
  };
}

export function gerarPlanilhaNatura(documents: NaturaDocument[]): ArrayBuffer {
  const data = documents.map((doc) => ({
    FILIAL: doc.filial,
    SERIE: doc.serie,
    "Nº DOCUMENTO": doc.numeroDocumento,
    "TIPO DOCUMENTO": doc.tipoDocumento,
    "VALOR PAGO": doc.valor,
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
