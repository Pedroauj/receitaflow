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

  // Find section "COMPROMISSOS"
  const compromissosIdx = fullText.toUpperCase().indexOf("COMPROMISSOS");
  if (compromissosIdx === -1) {
    return { documents: [], totalDocumentos: 0, totalValor: 0 };
  }

  const textAfter = fullText.substring(compromissosIdx);

  // Extract "Nº do Documento" and "Valor da Operação" pairs
  // Strategy: find all occurrences of document number and operation value patterns
  const documents: NaturaDocument[] = [];

  // Pattern: look for document numbers and operation values
  // We'll search for "Nº do Documento" or "N° do Documento" labels followed by values
  // And "Valor da Operação" or "Valor da Operacao" labels followed by values

  const docNumberPattern = /N[º°]\s*(?:do\s*)?Documento[:\s]*(\S+)/gi;
  const valorPattern = /Valor\s*da\s*Opera[çc][ãa]o[:\s]*([\d.,]+)/gi;

  const docNumbers: string[] = [];
  const valores: number[] = [];

  let match: RegExpExecArray | null;

  while ((match = docNumberPattern.exec(textAfter)) !== null) {
    const docNum = match[1].trim();
    if (docNum && docNum.length > 0) {
      docNumbers.push(docNum);
    }
  }

  while ((match = valorPattern.exec(textAfter)) !== null) {
    const val = parseValor(match[1]);
    if (val !== null) {
      valores.push(val);
    }
  }

  // Pair them up: each doc number with its corresponding value
  const count = Math.min(docNumbers.length, valores.length);
  for (let i = 0; i < count; i++) {
    documents.push({
      filial: "1",
      serie: "1",
      numeroDocumento: docNumbers[i],
      tipoDocumento: "CTRC",
      valor: valores[i],
    });
  }

  // If we found doc numbers but no matched valores (or vice versa), try alternative parsing
  // Try line-by-line approach as fallback
  if (documents.length === 0) {
    // Alternative: look for rows with numeric patterns that could be doc number + value
    const lines = textAfter.split(/\n/);
    for (const line of lines) {
      // Try to find pairs in the same line
      const altDocMatch = line.match(/N[º°]\s*(?:do\s*)?Documento[:\s]*(\S+)/i);
      const altValMatch = line.match(/Valor\s*da\s*Opera[çc][ãa]o[:\s]*([\d.,]+)/i);
      if (altDocMatch && altValMatch) {
        const val = parseValor(altValMatch[1]);
        if (val !== null) {
          documents.push({
            filial: "1",
            serie: "1",
            numeroDocumento: altDocMatch[1].trim(),
            tipoDocumento: "CTRC",
            valor: val,
          });
        }
      }
    }
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
