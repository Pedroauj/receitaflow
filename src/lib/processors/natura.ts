import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

// ── Types ──

export interface NaturaDocumentoBOR {
  numeroDocumento: string;
}

export interface NaturaRegistroEncontrado {
  numeroDocumento: string;
  valor: number;
  status: "encontrado" | "não encontrado" | "sem valor";
  origem: string; // documento BOR de origem
}

export interface NaturaProcessingResult {
  documentosBOR: NaturaDocumentoBOR[];
  registros: NaturaRegistroEncontrado[];
  totalDocumentos: number;
  totalValor: number;
  totalEncontrados: number;
  totalNaoEncontrados: number;
  totalSemValor: number;
}

// ── Configuração de colunas (ajustável) ──

export const NATURA_CONFIG = {
  /** Nome da coluna na planilha do sistema que contém o nº do documento / fatura */
  colunaDocumento: "NUM_TITULO",
  /** Nome da coluna na planilha do sistema que contém o valor */
  colunaValor: "VLR_TITULO",
  /** Colunas da planilha de exportação */
  exportColunas: {
    filial: "FILIAL",
    serie: "SERIE",
    documento: "Nº DOCUMENTO",
    tipo: "TIPO",
    valor: "VALOR",
  },
  /** Valores fixos para exportação */
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

  // Localizar seção COMPROMISSOS
  const compromissosIdx = normalized.toUpperCase().indexOf("COMPROMISSOS");
  if (compromissosIdx === -1) return [];

  const textAfter = normalized.substring(compromissosIdx);

  // Extrair todos os "Nº do Documento: XXXXX"
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

// ── Leitura da planilha do sistema ──

export function lerPlanilhaSistema(fileBuffer: ArrayBuffer): Record<string, any>[] {
  const wb = XLSX.read(fileBuffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

// ── Cruzamento ──

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

export function cruzarDados(
  documentosBOR: NaturaDocumentoBOR[],
  dadosSistema: Record<string, any>[],
  config = NATURA_CONFIG
): NaturaRegistroEncontrado[] {
  const registros: NaturaRegistroEncontrado[] = [];

  for (const docBOR of documentosBOR) {
    const numBOR = normalizeDocNumber(docBOR.numeroDocumento);

    // Encontrar todas as linhas na planilha que correspondem
    const linhasCorrespondentes = dadosSistema.filter((row) => {
      const numSistema = normalizeDocNumber(String(row[config.colunaDocumento] ?? ""));
      return numSistema === numBOR;
    });

    if (linhasCorrespondentes.length === 0) {
      registros.push({
        numeroDocumento: docBOR.numeroDocumento,
        valor: 0,
        status: "não encontrado",
        origem: docBOR.numeroDocumento,
      });
      continue;
    }

    for (const linha of linhasCorrespondentes) {
      const valor = parseValor(linha[config.colunaValor]);

      registros.push({
        numeroDocumento: String(linha[config.colunaDocumento] ?? docBOR.numeroDocumento),
        valor: valor ?? 0,
        status: valor !== null ? "encontrado" : "sem valor",
        origem: docBOR.numeroDocumento,
      });
    }
  }

  return registros;
}

// ── Processamento completo ──

export async function processarNatura(
  pdfBuffer: ArrayBuffer,
  planilhaBuffer: ArrayBuffer,
  config = NATURA_CONFIG
): Promise<NaturaProcessingResult> {
  const documentosBOR = await extrairDocumentosBOR(pdfBuffer);
  const dadosSistema = lerPlanilhaSistema(planilhaBuffer);
  const registros = cruzarDados(documentosBOR, dadosSistema, config);

  const encontrados = registros.filter((r) => r.status === "encontrado");
  const naoEncontrados = registros.filter((r) => r.status === "não encontrado");
  const semValor = registros.filter((r) => r.status === "sem valor");

  return {
    documentosBOR,
    registros,
    totalDocumentos: registros.length,
    totalValor: encontrados.reduce((sum, r) => sum + r.valor, 0),
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
