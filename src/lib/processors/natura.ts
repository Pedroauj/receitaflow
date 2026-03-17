import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

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

  const cleaned = raw
    .replace(/R\$\s*/gi, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const num = Number.parseFloat(cleaned);
  return Number.isNaN(num) ? null : num;
}

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function extractPageTextWithLines(content: any): string {
  const items = (content?.items ?? []) as any[];

  const rows = items
    .map((item) => {
      const str = typeof item?.str === "string" ? item.str : "";
      const x = Array.isArray(item?.transform) ? Number(item.transform[4] ?? 0) : 0;
      const y = Array.isArray(item?.transform) ? Number(item.transform[5] ?? 0) : 0;

      return {
        str: str.trim(),
        x,
        y,
      };
    })
    .filter((item) => item.str.length > 0);

  if (rows.length === 0) return "";

  rows.sort((a, b) => {
    const yDiff = Math.abs(b.y - a.y);
    if (yDiff > 2) return b.y - a.y;
    return a.x - b.x;
  });

  const grouped: Array<{ y: number; items: Array<{ str: string; x: number }> }> = [];

  for (const row of rows) {
    const existing = grouped.find((group) => Math.abs(group.y - row.y) <= 2.5);

    if (existing) {
      existing.items.push({ str: row.str, x: row.x });
    } else {
      grouped.push({
        y: row.y,
        items: [{ str: row.str, x: row.x }],
      });
    }
  }

  grouped.sort((a, b) => b.y - a.y);

  const lines = grouped.map((group) => {
    const sortedItems = group.items.sort((a, b) => a.x - b.x);
    return sortedItems.map((item) => item.str).join(" ").trim();
  });

  return lines.join("\n");
}

function collectMatches(regex: RegExp, text: string): Array<{ value: string; index: number }> {
  const matches: Array<{ value: string; index: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const value = match[1]?.trim();
    const index = match.index ?? 0;

    if (value) {
      matches.push({ value, index });
    }
  }

  return matches;
}

export async function processarNatura(fileBuffer: ArrayBuffer): Promise<NaturaProcessingResult> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = extractPageTextWithLines(content);
    fullText += `${pageText}\n`;
  }

  const normalizedText = normalizeText(fullText);

  const documentoRegex =
    /N[º°o]?\s*DO\s*DOCUMENTO\s*:?\s*([0-9.\-\/]+)/gi;

  const valorRegex =
    /VALOR\s*DA\s*OPERACAO\s*:?\s*(?:R\$\s*)?([0-9.]+,[0-9]{2})/gi;

  const documentoMatches = collectMatches(documentoRegex, normalizedText);
  const valorMatches = collectMatches(valorRegex, normalizedText);

  const documents: NaturaDocument[] = [];
  let valorCursor = 0;

  for (let i = 0; i < documentoMatches.length; i++) {
    const documento = documentoMatches[i];
    const nextDocumentoIndex = documentoMatches[i + 1]?.index ?? Number.POSITIVE_INFINITY;

    let matchedValor: { value: string; index: number } | null = null;

    while (valorCursor < valorMatches.length) {
      const valorAtual = valorMatches[valorCursor];

      if (valorAtual.index > documento.index && valorAtual.index < nextDocumentoIndex) {
        matchedValor = valorAtual;
        valorCursor++;
        break;
      }

      if (valorAtual.index <= documento.index) {
        valorCursor++;
        continue;
      }

      if (valorAtual.index >= nextDocumentoIndex) {
        break;
      }
    }

    if (!matchedValor) continue;

    const valor = parseValor(matchedValor.value);
    if (valor === null) continue;

    documents.push({
      filial: "1",
      serie: "1",
      numeroDocumento: documento.value,
      tipoDocumento: "CTRC",
      valor,
    });
  }

  const uniqueDocuments = documents.filter((doc, index, arr) => {
    const firstIndex = arr.findIndex(
      (item) =>
        item.numeroDocumento === doc.numeroDocumento &&
        item.valor === doc.valor
    );

    return firstIndex === index;
  });

  const totalValor = uniqueDocuments.reduce((sum, doc) => sum + doc.valor, 0);

  return {
    documents: uniqueDocuments,
    totalDocumentos: uniqueDocuments.length,
    totalValor,
  };
}

export function gerarPlanilhaNatura(documents: NaturaDocument[]): ArrayBuffer {
  const data = documents.map((doc) => ({
    FILIAL: doc.filial,
    SERIE: doc.serie,
    "Nº DOCUMENTO": doc.numeroDocumento,
    TIPO: doc.tipoDocumento,
    VALOR: doc.valor,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  ws["!cols"] = [
    { wch: 10 },
    { wch: 8 },
    { wch: 18 },
    { wch: 10 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Baixa por Aviso Bancário");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}