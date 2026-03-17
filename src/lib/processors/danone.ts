import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

export interface DanoneInputFile {
  fileName: string;
  buffer: ArrayBuffer;
}

export interface DanoneDocument {
  filial: string;
  serie: string;
  numeroDocumento: string;
  tipoDocumento: string;
  valorOriginal: number;
  descontoAplicado: number;
  valorFinal: number;
  nfOriginal: string;
  origemArquivo: string;
}

export interface DanoneDiscountApplication {
  arquivoOrigem: string;
  referenciaOrigem: string;
  valorDesconto: number;
  documentoAlvo: string;
  serieAlvo: string;
  saldoRestante: number;
}

export interface DanoneProcessingResult {
  documents: DanoneDocument[];
  descontosAplicados: DanoneDiscountApplication[];
  totalDocumentos: number;
  totalValorOriginal: number;
  totalDescontos: number;
  totalValorFinal: number;
  arquivosProcessados: number;
}

interface ParsedPositiveRow {
  nfOriginal: string;
  numeroDocumento: string;
  serie: string;
  valor: number;
  origemArquivo: string;
}

interface ParsedNegativeRow {
  referenciaOrigem: string;
  valorDesconto: number;
  origemArquivo: string;
}

function parseMoney(raw: string): number | null {
  if (!raw || typeof raw !== "string") return null;

  const cleaned = raw
    .replace(/\s+/g, "")
    .replace(/[R$]/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const value = Number.parseFloat(cleaned);
  return Number.isNaN(value) ? null : value;
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

function splitDocumentoSerie(nf: string): { numeroDocumento: string; serie: string } {
  const cleaned = (nf || "").trim();

  if (cleaned.includes("-")) {
    const [numeroDocumento, serie] = cleaned.split("-");
    return {
      numeroDocumento: (numeroDocumento || "").trim(),
      serie: (serie || "").trim(),
    };
  }

  return {
    numeroDocumento: cleaned,
    serie: "",
  };
}

function parseDanoneRows(text: string, fileName: string): {
  positivos: ParsedPositiveRow[];
  descontos: ParsedNegativeRow[];
} {
  const normalized = normalizeText(text);
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const positivos: ParsedPositiveRow[] = [];
  const descontos: ParsedNegativeRow[] = [];

  /**
   * Linha esperada:
   * 1000062122 1238-30 04.02.2026 15.06.2026 19.910,65 0,00 19.910,65 1238/30
   * 1000037197 19660 26.01.2026 26.01.2026 -2.418,33 0,00 -2.418,33 SGT LOGISTICA
   */
  const rowRegex =
    /^(\d{7,12})\s+([0-9]+(?:-[0-9]+)?)\s+\d{2}\.\d{2}\.\d{4}\s+\d{2}\.\d{2}\.\d{4}\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})(?:\s+.*)?$/i;

  for (const line of lines) {
    const match = line.match(rowRegex);
    if (!match) continue;

    const [, documentoSap, nfRaw, _valorLiquido, _abatimento, valorCreditoRaw] = match;
    const valorCredito = parseMoney(valorCreditoRaw);

    if (valorCredito === null || valorCredito === 0) continue;

    if (valorCredito > 0) {
      const { numeroDocumento, serie } = splitDocumentoSerie(nfRaw);

      if (!numeroDocumento) continue;

      positivos.push({
        nfOriginal: nfRaw,
        numeroDocumento,
        serie,
        valor: valorCredito,
        origemArquivo: fileName,
      });
    } else {
      descontos.push({
        referenciaOrigem: `${documentoSap} / ${nfRaw}`,
        valorDesconto: Math.abs(valorCredito),
        origemArquivo: fileName,
      });
    }
  }

  return { positivos, descontos };
}

function applyDiscounts(
  positivos: ParsedPositiveRow[],
  descontos: ParsedNegativeRow[]
): {
  documents: DanoneDocument[];
  descontosAplicados: DanoneDiscountApplication[];
} {
  const documents: DanoneDocument[] = positivos.map((item) => ({
    filial: "1",
    serie: item.serie || "30",
    numeroDocumento: item.numeroDocumento,
    tipoDocumento: "CTRC",
    valorOriginal: item.valor,
    descontoAplicado: 0,
    valorFinal: item.valor,
    nfOriginal: item.nfOriginal,
    origemArquivo: item.origemArquivo,
  }));

  const descontosAplicados: DanoneDiscountApplication[] = [];

  for (const desconto of descontos) {
    let restante = desconto.valorDesconto;

    while (restante > 0) {
      const elegiveis = documents
        .map((doc, index) => ({ doc, index }))
        .filter(({ doc }) => doc.valorFinal > 0)
        .sort((a, b) => b.doc.valorFinal - a.doc.valorFinal);

      if (elegiveis.length === 0) break;

      const alvo = elegiveis[0].doc;
      const valorAplicado = Math.min(restante, alvo.valorFinal);

      alvo.descontoAplicado += valorAplicado;
      alvo.valorFinal = Number((alvo.valorFinal - valorAplicado).toFixed(2));

      descontosAplicados.push({
        arquivoOrigem: desconto.origemArquivo,
        referenciaOrigem: desconto.referenciaOrigem,
        valorDesconto: valorAplicado,
        documentoAlvo: alvo.numeroDocumento,
        serieAlvo: alvo.serie,
        saldoRestante: alvo.valorFinal,
      });

      restante = Number((restante - valorAplicado).toFixed(2));
    }
  }

  return { documents, descontosAplicados };
}

export async function processarDanone(
  files: DanoneInputFile[]
): Promise<DanoneProcessingResult> {
  const positivos: ParsedPositiveRow[] = [];
  const descontos: ParsedNegativeRow[] = [];

  for (const file of files) {
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(file.buffer),
    }).promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = extractPageTextWithLines(content);
      fullText += `${pageText}\n`;
    }

    const parsed = parseDanoneRows(fullText, file.fileName);
    positivos.push(...parsed.positivos);
    descontos.push(...parsed.descontos);
  }

  const { documents, descontosAplicados } = applyDiscounts(positivos, descontos);

  const documentsValidos = documents.filter((doc) => doc.valorFinal > 0);

  const totalValorOriginal = documents.reduce((sum, doc) => sum + doc.valorOriginal, 0);
  const totalDescontos = descontosAplicados.reduce((sum, item) => sum + item.valorDesconto, 0);
  const totalValorFinal = documentsValidos.reduce((sum, doc) => sum + doc.valorFinal, 0);

  return {
    documents: documentsValidos,
    descontosAplicados,
    totalDocumentos: documentsValidos.length,
    totalValorOriginal: Number(totalValorOriginal.toFixed(2)),
    totalDescontos: Number(totalDescontos.toFixed(2)),
    totalValorFinal: Number(totalValorFinal.toFixed(2)),
    arquivosProcessados: files.length,
  };
}

export function gerarPlanilhaDanone(result: DanoneProcessingResult): ArrayBuffer {
  const baixaData = result.documents.map((doc) => ({
    FILIAL: doc.filial,
    SERIE: doc.serie,
    "Nº DOCUMENTO": doc.numeroDocumento,
    TIPO: doc.tipoDocumento,
    VALOR: doc.valorFinal,
  }));

  const conferenciaData = result.documents.map((doc) => ({
    ARQUIVO: doc.origemArquivo,
    NF_ORIGINAL: doc.nfOriginal,
    DOCUMENTO: doc.numeroDocumento,
    SERIE: doc.serie,
    VALOR_ORIGINAL: doc.valorOriginal,
    DESCONTO_APLICADO: doc.descontoAplicado,
    VALOR_FINAL: doc.valorFinal,
  }));

  const descontosData = result.descontosAplicados.map((item) => ({
    ARQUIVO_ORIGEM: item.arquivoOrigem,
    REFERENCIA_DESCONTO: item.referenciaOrigem,
    VALOR_DESCONTO_APLICADO: item.valorDesconto,
    DOCUMENTO_ALVO: item.documentoAlvo,
    SERIE_ALVO: item.serieAlvo,
    SALDO_RESTANTE: item.saldoRestante,
  }));

  const resumoData = [
    {
      ARQUIVOS_PROCESSADOS: result.arquivosProcessados,
      TOTAL_DOCUMENTOS: result.totalDocumentos,
      TOTAL_VALOR_ORIGINAL: result.totalValorOriginal,
      TOTAL_DESCONTOS: result.totalDescontos,
      TOTAL_VALOR_FINAL: result.totalValorFinal,
    },
  ];

  const wb = XLSX.utils.book_new();

  const wsBaixa = XLSX.utils.json_to_sheet(baixaData);
  wsBaixa["!cols"] = [
    { wch: 10 },
    { wch: 10 },
    { wch: 18 },
    { wch: 10 },
    { wch: 15 },
  ];

  const wsConferencia = XLSX.utils.json_to_sheet(conferenciaData);
  wsConferencia["!cols"] = [
    { wch: 40 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
  ];

  const wsDescontos = XLSX.utils.json_to_sheet(descontosData);
  wsDescontos["!cols"] = [
    { wch: 40 },
    { wch: 22 },
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
    { wch: 15 },
  ];

  const wsResumo = XLSX.utils.json_to_sheet(resumoData);
  wsResumo["!cols"] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, wsBaixa, "Baixa Danone");
  XLSX.utils.book_append_sheet(wb, wsConferencia, "Conferencia");
  XLSX.utils.book_append_sheet(wb, wsDescontos, "Descontos");
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}