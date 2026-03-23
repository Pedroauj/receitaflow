import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

// ── Types ──

export interface NaturaDocumentoBOR {
  numeroDocumento: string;
}

export interface NaturaFaturaBloco {
  fatura: string;
  documentos: string[];
  valor: number;
  status: "encontrado" | "não encontrado" | "sem valor";
}

export interface NaturaRegistroEncontrado {
  numeroDocumento: string;
  valor: number;
  status: "encontrado" | "não encontrado" | "sem valor";
  origem: string;
  fatura: string;
}

export interface NaturaProcessingResult {
  documentosBOR: NaturaDocumentoBOR[];
  blocos: NaturaFaturaBloco[];
  registros: NaturaRegistroEncontrado[];
  totalDocumentos: number;
  totalValor: number;
  totalEncontrados: number;
  totalNaoEncontrados: number;
  totalSemValor: number;
}

// ── Configuração (ajustável) ──

export const NATURA_CONFIG = {
  colunaFatura: "NºFATURA",
  colunaValor: "VLR A RECEBER",
  exportColunas: {
    filial: "FILIAL",
    serie: "SERIE",
    documento: "Nº DOCUMENTO",
    tipo: "TIPO",
    valor: "VALOR",
  },
  exportDefaults: {
    filial: "1",
    serie: "1",
    tipo: "CTRC",
  },
};

// ── PDF helpers ──

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function extractPageText(content: any): string {
  const items = (content?.items ?? []) as any[];
  const rows = items
    .map((item) => {
      const str = typeof item?.str === "string" ? item.str : "";
      const x = Array.isArray(item?.transform) ? Number(item.transform[4] ?? 0) : 0;
      const y = Array.isArray(item?.transform) ? Number(item.transform[5] ?? 0) : 0;
      return { str: str.trim(), x, y };
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
      grouped.push({ y: row.y, items: [{ str: row.str, x: row.x }] });
    }
  }

  grouped.sort((a, b) => b.y - a.y);

  return grouped
    .map((g) => g.items.sort((a, b) => a.x - b.x).map((i) => i.str).join(" ").trim())
    .join("\n");
}

// ── Extração de documentos do PDF BOR ──

export async function extrairDocumentosBOR(fileBuffer: ArrayBuffer): Promise<NaturaDocumentoBOR[]> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += `${extractPageText(content)}\n`;
  }

  const normalized = normalizeText(fullText);

  const compromissosIdx = normalized.toUpperCase().indexOf("COMPROMISSOS");
  if (compromissosIdx === -1) return [];

  const textAfter = normalized.substring(compromissosIdx);

  const regex = /N[º°o]?\s*(?:DO|do)?\s*DOCUMENTO\s*:?\s*([0-9.\-\/]+)/gi;
  const docs: NaturaDocumentoBOR[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = regex.exec(textAfter)) !== null) {
    const num = match[1]?.trim().replace(/^0+/, "");
    if (num && !seen.has(num)) {
      seen.add(num);
      docs.push({ numeroDocumento: num });
    }
  }

  return docs;
}

// ── Leitura da planilha em formato raw (array de arrays) ──

export function lerPlanilhaRaw(fileBuffer: ArrayBuffer): { headers: string[]; rows: any[][] } {
  const wb = XLSX.read(fileBuffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  if (raw.length === 0) return { headers: [], rows: [] };

  const headers = raw[0].map((h: any) => String(h).trim());
  const rows = raw.slice(1);

  return { headers, rows };
}

// ── Cruzamento em blocos ──

function parseValor(raw: any): number | null {
  if (typeof raw === "number") return raw;
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.replace(/R\$\s*/gi, "").replace(/\./g, "").replace(",", ".").trim();
  const num = Number.parseFloat(cleaned);
  return Number.isNaN(num) ? null : num;
}

function normalizeDocNumber(doc: string): string {
  return String(doc).replace(/^0+/, "").replace(/[.\-\/\s]/g, "").trim();
}

function extrairDocumentosDaLinha(texto: string): string[] {
  const cleaned = texto
    .replace(/CTRC\s*/gi, "")
    .replace(/CTE\s*/gi, "")
    .replace(/NF\s*/gi, "")
    .trim();

  if (!cleaned) return [];

  return cleaned
    .split(/[,;]/)
    .map((d) => d.replace(/\./g, "").trim())
    .filter((d) => d.length > 0 && /^\d+$/.test(d));
}

export function cruzarDadosBlocos(
  documentosBOR: NaturaDocumentoBOR[],
  headers: string[],
  rows: any[][],
  config = NATURA_CONFIG
): { blocos: NaturaFaturaBloco[]; registros: NaturaRegistroEncontrado[] } {
  const faturaColIdx = headers.findIndex(
    (h) => h.toUpperCase().replace(/\s/g, "") === config.colunaFatura.toUpperCase().replace(/\s/g, "")
  );
  const valorColIdx = headers.findIndex(
    (h) => h.toUpperCase().replace(/\s/g, "") === config.colunaValor.toUpperCase().replace(/\s/g, "")
  );

  const blocos: NaturaFaturaBloco[] = [];
  const registros: NaturaRegistroEncontrado[] = [];

  for (const docBOR of documentosBOR) {
    const numBOR = normalizeDocNumber(docBOR.numeroDocumento);

    // Procurar a linha da fatura
    let faturaRowIdx = -1;

    if (faturaColIdx !== -1) {
      faturaRowIdx = rows.findIndex((row) => {
        const cellVal = normalizeDocNumber(String(row[faturaColIdx] ?? ""));
        return cellVal === numBOR;
      });
    }

    // Fallback: buscar em qualquer coluna
    if (faturaRowIdx === -1) {
      faturaRowIdx = rows.findIndex((row) =>
        row.some((cell: any) => normalizeDocNumber(String(cell ?? "")) === numBOR)
      );
    }

    if (faturaRowIdx === -1) {
      blocos.push({
        fatura: docBOR.numeroDocumento,
        documentos: [],
        valor: 0,
        status: "não encontrado",
      });
      registros.push({
        numeroDocumento: docBOR.numeroDocumento,
        valor: 0,
        status: "não encontrado",
        origem: docBOR.numeroDocumento,
        fatura: docBOR.numeroDocumento,
      });
      continue;
    }

    // Ler bloco: linhas seguintes até encontrar outra fatura ou fim
    let documentos: string[] = [];
    let valorFatura: number | null = null;

    // Vasculhar as próximas linhas (até 10) buscando documentos e valor
    const maxLookAhead = Math.min(faturaRowIdx + 10, rows.length);
    for (let i = faturaRowIdx + 1; i < maxLookAhead; i++) {
      const row = rows[i];

      // Se encontrou outra fatura, parar
      if (faturaColIdx !== -1) {
        const nextFatura = String(row[faturaColIdx] ?? "").trim();
        if (nextFatura && /^\d+$/.test(nextFatura.replace(/[.\-\/]/g, ""))) {
          break;
        }
      }

      // Procurar documentos (CTRC ...)
      for (const cell of row) {
        const cellStr = String(cell ?? "").trim();
        if (/CTRC|CTE/i.test(cellStr) && documentos.length === 0) {
          documentos = extrairDocumentosDaLinha(cellStr);
        }
      }

      // Procurar valor na coluna VLR A RECEBER
      if (valorColIdx !== -1 && valorFatura === null) {
        const rawValor = row[valorColIdx];
        const parsed = parseValor(rawValor);
        if (parsed !== null && parsed > 0) {
          valorFatura = parsed;
        }
      }

      // Fallback: procurar valor em qualquer célula que pareça monetário
      if (valorFatura === null) {
        for (const cell of row) {
          const cellStr = String(cell ?? "").trim();
          if (/VLR\s*A?\s*RECEBER/i.test(cellStr)) continue;
          const parsed = parseValor(cell);
          if (parsed !== null && parsed > 100) {
            valorFatura = parsed;
          }
        }
      }

      // Se já encontrou documentos e valor, parar
      if (documentos.length > 0 && valorFatura !== null) break;
    }

    // Se não encontrou documentos separados, usar o próprio número da fatura
    if (documentos.length === 0) {
      documentos = [docBOR.numeroDocumento];
    }

    const status: NaturaFaturaBloco["status"] =
      valorFatura !== null ? "encontrado" : "sem valor";

    blocos.push({
      fatura: docBOR.numeroDocumento,
      documentos,
      valor: valorFatura ?? 0,
      status,
    });

    // Gerar um registro por documento encontrado
    const valorPorDoc = valorFatura !== null && documentos.length > 0
      ? valorFatura / documentos.length
      : 0;

    for (const doc of documentos) {
      registros.push({
        numeroDocumento: doc,
        valor: valorPorDoc,
        status,
        origem: docBOR.numeroDocumento,
        fatura: docBOR.numeroDocumento,
      });
    }
  }

  return { blocos, registros };
}

// ── Processamento completo ──

export async function processarNatura(
  pdfBuffer: ArrayBuffer,
  planilhaBuffer: ArrayBuffer,
  config = NATURA_CONFIG
): Promise<NaturaProcessingResult> {
  const documentosBOR = await extrairDocumentosBOR(pdfBuffer);
  const { headers, rows } = lerPlanilhaRaw(planilhaBuffer);
  const { blocos, registros } = cruzarDadosBlocos(documentosBOR, headers, rows, config);

  const encontrados = registros.filter((r) => r.status === "encontrado");
  const naoEncontrados = registros.filter((r) => r.status === "não encontrado");
  const semValor = registros.filter((r) => r.status === "sem valor");

  const totalValor = blocos
    .filter((b) => b.status === "encontrado")
    .reduce((sum, b) => sum + b.valor, 0);

  return {
    documentosBOR,
    blocos,
    registros,
    totalDocumentos: registros.length,
    totalValor,
    totalEncontrados: encontrados.length,
    totalNaoEncontrados: naoEncontrados.length,
    totalSemValor: semValor.length,
  };
}

// ── Geração da planilha de exportação ──

export function gerarPlanilhaNatura(
  registros: NaturaRegistroEncontrado[],
  config = NATURA_CONFIG
): ArrayBuffer {
  const encontrados = registros.filter((r) => r.status === "encontrado");

  const data = encontrados.map((r) => ({
    [config.exportColunas.filial]: config.exportDefaults.filial,
    [config.exportColunas.serie]: config.exportDefaults.serie,
    [config.exportColunas.documento]: r.numeroDocumento,
    [config.exportColunas.tipo]: config.exportDefaults.tipo,
    [config.exportColunas.valor]: r.valor,
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
