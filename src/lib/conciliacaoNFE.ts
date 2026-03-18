import * as XLSX from "xlsx";

export type DivergenceType =
  | "Lançada"
  | "Não lançada"
  | "Valor divergente"
  | "Data divergente"
  | "NF divergente"
  | "CNPJ divergente"
  | "CNPJ errado"
  | "Múltiplas divergências";

export type ComparisonRow = {
  id: string;
  chave: string;
  numeroNF: string;
  dataEmissao: string;
  cnpjEmitente: string;
  nomeFornecedor: string;
  valor: number;
  valorSistema: number | null;
  tags: string;
  ativoImobilizado: boolean;
  tipo: DivergenceType;
  observacao: string;
};

export type ComparisonSummary = {
  totalGovernmentNotes: number;
  totalSystemNotes: number;
  reconciled: number;
  notLaunchedCount: number;
  divergencesCount: number;
  notLaunchedValue: number;
  divergencesValue: number;
};

type SpreadsheetKind = "system" | "government";

type ParsedRecord = {
  rawChave: string;
  rawNumeroNF: string;
  rawDataEmissao: string;
  rawCnpjEmitente: string;
  rawNomeFornecedor: string;
  rawValor: string | number;
  rawTags: string;
  ativoImobilizado: boolean;

  normalizedChave: string;
  normalizedNumeroNF: string;
  normalizedDataEmissao: string;
  normalizedCnpjEmitente: string;
  normalizedValor: number;
};

type ComparisonResult = {
  results: ComparisonRow[];
  summary: ComparisonSummary;
};

type MappedRow = Record<string, unknown>;

type ColumnIndexes = {
  chaveIndex: number;
  nfIndex: number;
  dataIndex: number;
  cnpjIndex: number;
  valorIndex: number;
  fornecedorIndex: number;
  tagsIndex: number;
  tipoIndex: number;
};

const EXCLUDED_SIEG_TAGS = new Set([
  "remessa para conserto",
  "nfe entrada",
  "combustivel externo",
  "combustivel interno",
]);

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00ba/g, "o")
    .replace(/\u00b0/g, "o")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function digitsOnly(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeAccessKey(value: unknown) {
  return digitsOnly(value);
}

function normalizeNF(value: unknown) {
  const cleaned = String(value ?? "").trim();
  if (!cleaned) return "";

  if (/^\d+(\.0+)?$/.test(cleaned)) {
    return cleaned.replace(/\.0+$/, "");
  }

  const onlyDigits = cleaned.replace(/\D/g, "");
  return onlyDigits || cleaned.toUpperCase().replace(/\s+/g, "");
}

function excelDateToISO(excelSerial: number) {
  const utcDays = Math.floor(excelSerial - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);

  const month = `${dateInfo.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${dateInfo.getUTCDate()}`.padStart(2, "0");

  return `${dateInfo.getUTCFullYear()}-${month}-${day}`;
}

function normalizeDate(value: unknown) {
  if (value == null || value === "") return "";

  if (typeof value === "number" && Number.isFinite(value)) {
    return excelDateToISO(value);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const yyyy = value.getFullYear();
    const mm = `${value.getMonth() + 1}`.padStart(2, "0");
    const dd = `${value.getDate()}`.padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const raw = String(value).trim();
  if (!raw) return "";

  if (/^\d+(\.0+)?$/.test(raw)) {
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) {
      return excelDateToISO(numeric);
    }
  }

  const cleaned = raw.replace(/\s+/g, " ").trim();

  const brMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (brMatch) {
    const [, dd, mm, yyyyRaw] = brMatch;
    const yyyy = yyyyRaw.length === 2 ? `20${yyyyRaw}` : yyyyRaw;
    return `${yyyy.padStart(4, "0")}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  const normalized = cleaned.replace(/\./g, "/").replace(/-/g, "/");
  const fallbackBr = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (fallbackBr) {
    const [, dd, mm, yyyyRaw] = fallbackBr;
    const yyyy = yyyyRaw.length === 2 ? `20${yyyyRaw}` : yyyyRaw;
    return `${yyyy.padStart(4, "0")}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = `${parsed.getMonth() + 1}`.padStart(2, "0");
    const dd = `${parsed.getDate()}`.padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return "";
}

function formatDateToBR(isoDate: string) {
  if (!isoDate) return "-";
  const [yyyy, mm, dd] = isoDate.split("-");
  if (!yyyy || !mm || !dd) return isoDate;
  return `${dd}/${mm}/${yyyy}`;
}

function normalizeCurrency(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number(value.toFixed(2));
  }

  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const sanitized = raw
    .replace(/\s/g, "")
    .replace(/R\$/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function valuesAreEqual(a: number, b: number, tolerance = 0.01) {
  return Math.abs(a - b) <= tolerance;
}

function formatCNPJ(value: string) {
  const digits = digitsOnly(value);
  if (digits.length !== 14) return value || "-";
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

function normalizeTag(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function splitTags(value: unknown) {
  return String(value ?? "")
    .split(/[;,|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function shouldExcludeSiegRecord(tagsRaw: string) {
  const normalizedTags = splitTags(tagsRaw).map(normalizeTag);
  return normalizedTags.some((tag) => EXCLUDED_SIEG_TAGS.has(tag));
}

function isAtivoImobilizado(tagsRaw: string) {
  return splitTags(tagsRaw)
    .map(normalizeTag)
    .some((tag) => tag === "ativo imobilizado");
}

function extractCNPJFromMixedField(value: unknown) {
  const digits = digitsOnly(value);
  if (digits.length >= 14) {
    return digits.slice(-14);
  }
  return digits;
}

function getAccessKey(record: ParsedRecord) {
  return record.normalizedChave;
}

function getNFAndCNPJKey(record: ParsedRecord) {
  return [record.normalizedNumeroNF, record.normalizedCnpjEmitente].join("|");
}

function getCNPJDateAndValueKey(record: ParsedRecord) {
  return [
    record.normalizedCnpjEmitente,
    record.normalizedDataEmissao,
    record.normalizedValor.toFixed(2),
  ].join("|");
}

function getNFDateAndValueKey(record: ParsedRecord) {
  return [
    record.normalizedNumeroNF,
    record.normalizedDataEmissao,
    record.normalizedValor.toFixed(2),
  ].join("|");
}

function getNFOnlyKey(record: ParsedRecord) {
  return record.normalizedNumeroNF;
}

function getWorksheet(workbook: XLSX.WorkBook) {
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Não foi possível localizar nenhuma aba na planilha enviada.");
  }

  return workbook.Sheets[firstSheetName];
}

function getRowsAsArrays(worksheet: XLSX.WorkSheet) {
  return XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    raw: true,
  });
}

function detectHeaderRow(rows: unknown[][], kind: SpreadsheetKind) {
  const targets =
    kind === "system"
      ? ["data", "nf", "nota/cnpj/cpf", "valor doc", "chave"]
      : ["chave da nfe", "num nfe", "data emissao", "cnpj emit", "valor", "tags"];

  let bestIndex = -1;
  let bestScore = -1;

  rows.slice(0, 15).forEach((row, index) => {
    const normalizedCells = row.map((cell) => normalizeHeader(cell));
    const score = targets.reduce((acc, target) => {
      return acc + (normalizedCells.some((cell) => cell.includes(target)) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  if (bestIndex === -1) {
    throw new Error("Não consegui identificar o cabeçalho da planilha.");
  }

  return bestIndex;
}

function findColumnIndex(headers: string[], possibleNames: string[]) {
  for (const name of possibleNames) {
    const normalizedName = normalizeHeader(name);
    const exactIndex = headers.findIndex((header) => header === normalizedName);
    if (exactIndex !== -1) return exactIndex;
  }

  for (const name of possibleNames) {
    const normalizedName = normalizeHeader(name);
    const partialIndex = headers.findIndex(
      (header) => header.includes(normalizedName) || normalizedName.includes(header),
    );
    if (partialIndex !== -1) return partialIndex;
  }

  return -1;
}

function getRowValues(row: MappedRow) {
  return Object.values(row);
}

function hasSystemAccessKey(row: MappedRow, chaveIndex: number) {
  const values = getRowValues(row);
  const chave = values[chaveIndex];
  return normalizeAccessKey(chave).length > 0;
}

function scoreValueColumn(rows: MappedRow[], columnIndex: number, chaveIndex: number) {
  let score = 0;
  let checked = 0;

  for (const row of rows) {
    if (!hasSystemAccessKey(row, chaveIndex)) continue;

    const value = getRowValues(row)[columnIndex];
    if (value == null || String(value).trim() === "") continue;

    checked += 1;

    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      score += 4;
      continue;
    }

    const raw = String(value).trim();

    if (/[A-Za-z]/.test(raw)) {
      score -= 3;
      continue;
    }

    if (raw.includes("/")) {
      score -= 3;
      continue;
    }

    const normalized = normalizeCurrency(raw);

    if (normalized > 0) {
      score += 3;
    } else {
      score -= 1;
    }
  }

  if (checked === 0) return -9999;
  return score;
}

function resolveSystemValueColumnIndex(
  headers: string[],
  rows: MappedRow[],
  indexes: Omit<ColumnIndexes, "valorIndex" | "tagsIndex">,
) {
  const headerValueIndex = findColumnIndex(headers, ["VALOR DOC", "VALOR"]);

  const blocked = new Set([
    indexes.tipoIndex,
    indexes.dataIndex,
    indexes.nfIndex,
    indexes.cnpjIndex,
    indexes.fornecedorIndex,
    indexes.chaveIndex,
  ]);

  let bestIndex = -1;
  let bestScore = -9999;

  headers.forEach((_, index) => {
    if (blocked.has(index)) return;

    const score = scoreValueColumn(rows, index, indexes.chaveIndex);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  if (headerValueIndex !== -1) {
    const headerScore = scoreValueColumn(rows, headerValueIndex, indexes.chaveIndex);

    if (headerScore >= 8) {
      return headerValueIndex;
    }

    if (bestIndex !== -1 && bestScore > headerScore) {
      return bestIndex;
    }

    return headerValueIndex;
  }

  if (bestIndex !== -1) {
    return bestIndex;
  }

  throw new Error("Na planilha do sistema não consegui identificar a coluna de valor.");
}

function mapSystemColumns(headers: string[], rows: MappedRow[]): ColumnIndexes {
  const tipoIndex = findColumnIndex(headers, ["TIPO"]);
  const dataIndex = findColumnIndex(headers, ["DATA"]);
  const nfIndex = findColumnIndex(headers, ["Nº NF", "N° NF", "N NF", "NF"]);
  const cnpjIndex = findColumnIndex(headers, ["NOTA/CNPJ/CPF", "CNPJ/CPF"]);
  const fornecedorIndex = findColumnIndex(headers, ["FORNECEDOR"]);
  const chaveIndex = findColumnIndex(headers, ["Chave", "CHAVE"]);

  const missing: string[] = [];
  if (dataIndex === -1) missing.push("DATA");
  if (nfIndex === -1) missing.push("Nº NF");
  if (cnpjIndex === -1) missing.push("NOTA/CNPJ/CPF");
  if (fornecedorIndex === -1) missing.push("FORNECEDOR");
  if (chaveIndex === -1) missing.push("Chave");

  if (missing.length > 0) {
    throw new Error(
      `Na planilha do sistema não encontrei estas colunas esperadas: ${missing.join(", ")}.`,
    );
  }

  const valorIndex = resolveSystemValueColumnIndex(headers, rows, {
    chaveIndex,
    nfIndex,
    dataIndex,
    cnpjIndex,
    fornecedorIndex,
    tipoIndex,
  });

  return {
    chaveIndex,
    nfIndex,
    dataIndex,
    cnpjIndex,
    valorIndex,
    fornecedorIndex,
    tagsIndex: -1,
    tipoIndex,
  };
}

function mapGovernmentColumns(headers: string[]): ColumnIndexes {
  const chaveIndex = findColumnIndex(headers, ["Chave da NFe"]);
  const nfIndex = findColumnIndex(headers, ["Num NFe"]);
  const dataIndex = findColumnIndex(headers, ["Data Emissão", "Data Emissao"]);
  const cnpjIndex = findColumnIndex(headers, ["CNPJ Emit"]);
  const valorIndex = findColumnIndex(headers, ["Valor"]);
  const fornecedorIndex = findColumnIndex(headers, [
    "Razão Soc. Emit",
    "Razao Soc. Emit",
    "Nome Fant. Emit",
  ]);
  const tagsIndex = findColumnIndex(headers, ["Tags"]);

  const missing: string[] = [];
  if (chaveIndex === -1) missing.push("Chave da NFe");
  if (nfIndex === -1) missing.push("Num NFe");
  if (dataIndex === -1) missing.push("Data Emissão");
  if (cnpjIndex === -1) missing.push("CNPJ Emit");
  if (valorIndex === -1) missing.push("Valor");
  if (fornecedorIndex === -1) missing.push("Razão Soc. Emit / Nome Fant. Emit");
  if (tagsIndex === -1) missing.push("Tags");

  if (missing.length > 0) {
    throw new Error(
      `Na planilha do SIEG não encontrei estas colunas esperadas: ${missing.join(", ")}.`,
    );
  }

  return {
    chaveIndex,
    nfIndex,
    dataIndex,
    cnpjIndex,
    valorIndex,
    fornecedorIndex,
    tagsIndex,
    tipoIndex: -1,
  };
}

function buildMappedRowsFromArrayRows(rows: unknown[][], headerRowIndex: number): MappedRow[] {
  const headerRow = rows[headerRowIndex] ?? [];
  const headers = headerRow.map((cell, index) => {
    const normalized = normalizeHeader(cell);
    return normalized || `__col_${index}`;
  });

  return rows
    .slice(headerRowIndex + 1)
    .map((row) => {
      const mapped: MappedRow = {};
      headers.forEach((header, index) => {
        mapped[header] = row[index] ?? "";
      });
      return mapped;
    })
    .filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== ""));
}

function parseSystemRecords(rows: MappedRow[], indexes: ColumnIndexes): ParsedRecord[] {
  return rows
    .filter((row) => hasSystemAccessKey(row, indexes.chaveIndex))
    .map((row) => {
      const values = getRowValues(row);

      const originalChave = values[indexes.chaveIndex];
      const originalNF = values[indexes.nfIndex];
      const originalData = values[indexes.dataIndex];
      const originalMixedCNPJ = values[indexes.cnpjIndex];
      const originalValor = values[indexes.valorIndex];
      const originalFornecedor = values[indexes.fornecedorIndex];

      const rawDataEmissao =
        typeof originalData === "number"
          ? formatDateToBR(normalizeDate(originalData))
          : String(originalData ?? "").trim();

      return {
        rawChave: String(originalChave ?? "").trim(),
        rawNumeroNF: String(originalNF ?? "").trim(),
        rawDataEmissao,
        rawCnpjEmitente: extractCNPJFromMixedField(originalMixedCNPJ),
        rawNomeFornecedor: String(originalFornecedor ?? "").trim(),
        rawValor:
          typeof originalValor === "number"
            ? originalValor
            : String(originalValor ?? "").trim(),
        rawTags: "",
        ativoImobilizado: false,

        normalizedChave: normalizeAccessKey(originalChave),
        normalizedNumeroNF: normalizeNF(originalNF),
        normalizedDataEmissao: normalizeDate(originalData),
        normalizedCnpjEmitente: extractCNPJFromMixedField(originalMixedCNPJ),
        normalizedValor: normalizeCurrency(originalValor),
      };
    })
    .filter((row) => row.normalizedChave);
}

function parseGovernmentRecords(rows: MappedRow[], indexes: ColumnIndexes): ParsedRecord[] {
  return rows
    .map((row) => {
      const values = getRowValues(row);

      const originalChave = values[indexes.chaveIndex];
      const originalNF = values[indexes.nfIndex];
      const originalData = values[indexes.dataIndex];
      const originalCNPJ = values[indexes.cnpjIndex];
      const originalValor = values[indexes.valorIndex];
      const originalFornecedor = values[indexes.fornecedorIndex];
      const originalTags = values[indexes.tagsIndex];

      const rawTags = String(originalTags ?? "").trim();

      return {
        rawChave: String(originalChave ?? "").trim(),
        rawNumeroNF: String(originalNF ?? "").trim(),
        rawDataEmissao:
          typeof originalData === "number"
            ? formatDateToBR(normalizeDate(originalData))
            : String(originalData ?? "").trim(),
        rawCnpjEmitente: String(originalCNPJ ?? "").trim(),
        rawNomeFornecedor: String(originalFornecedor ?? "").trim(),
        rawValor:
          typeof originalValor === "number"
            ? originalValor
            : String(originalValor ?? "").trim(),
        rawTags,
        ativoImobilizado: isAtivoImobilizado(rawTags),

        normalizedChave: normalizeAccessKey(originalChave),
        normalizedNumeroNF: normalizeNF(originalNF),
        normalizedDataEmissao: normalizeDate(originalData),
        normalizedCnpjEmitente: digitsOnly(originalCNPJ),
        normalizedValor: normalizeCurrency(originalValor),
      };
    })
    .filter(
      (row) =>
        row.normalizedChave ||
        row.normalizedNumeroNF ||
        row.normalizedCnpjEmitente ||
        row.normalizedDataEmissao ||
        row.normalizedValor > 0,
    )
    .filter((row) => !shouldExcludeSiegRecord(row.rawTags));
}

export async function parseSpreadsheetFile(
  file: File,
  kind: SpreadsheetKind,
): Promise<ParsedRecord[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const worksheet = getWorksheet(workbook);
  const arrayRows = getRowsAsArrays(worksheet);
  const headerRowIndex = detectHeaderRow(arrayRows, kind);
  const mappedRows = buildMappedRowsFromArrayRows(arrayRows, headerRowIndex);

  if (!mappedRows.length) {
    throw new Error("A planilha está vazia ou não possui linhas para leitura.");
  }

  const headers = Object.keys(mappedRows[0] ?? {});
  const indexes =
    kind === "system"
      ? mapSystemColumns(headers, mappedRows)
      : mapGovernmentColumns(headers);

  return kind === "system"
    ? parseSystemRecords(mappedRows, indexes)
    : parseGovernmentRecords(mappedRows, indexes);
}

function resolveSupplierName(govRecord: ParsedRecord, systemRecord: ParsedRecord | null) {
  const governmentName = String(govRecord.rawNomeFornecedor ?? "").trim();
  const systemName = String(systemRecord?.rawNomeFornecedor ?? "").trim();
  return governmentName || systemName || "";
}

function buildComparisonRow(
  govRecord: ParsedRecord,
  systemRecord: ParsedRecord | null,
  tipo: DivergenceType,
  observacao: string,
  id: string,
): ComparisonRow {
  return {
    id,
    chave: govRecord.normalizedChave || govRecord.rawChave || "-",
    numeroNF: govRecord.normalizedNumeroNF || govRecord.rawNumeroNF || "-",
    dataEmissao: formatDateToBR(govRecord.normalizedDataEmissao || govRecord.rawDataEmissao),
    cnpjEmitente: formatCNPJ(govRecord.normalizedCnpjEmitente || govRecord.rawCnpjEmitente),
    nomeFornecedor: resolveSupplierName(govRecord, systemRecord),
    valor: govRecord.normalizedValor,
    valorSistema: systemRecord ? systemRecord.normalizedValor : null,
    tags: govRecord.rawTags || "",
    ativoImobilizado: govRecord.ativoImobilizado,
    tipo,
    observacao,
  };
}

export function compareReports(
  governmentRecords: ParsedRecord[],
  systemRecords: ParsedRecord[],
): ComparisonResult {
  const results: ComparisonRow[] = [];
  let reconciled = 0;

  const systemByAccessKey = new Map<string, ParsedRecord[]>();
  const systemByNFAndCNPJ = new Map<string, ParsedRecord[]>();
  const systemByNFDateAndValue = new Map<string, ParsedRecord[]>();
  const systemByCNPJDateAndValue = new Map<string, ParsedRecord[]>();
  const systemByNFOnly = new Map<string, ParsedRecord[]>();

  systemRecords.forEach((record) => {
    const accessKey = getAccessKey(record);
    if (accessKey) {
      if (!systemByAccessKey.has(accessKey)) systemByAccessKey.set(accessKey, []);
      systemByAccessKey.get(accessKey)!.push(record);
    }

    const nfAndCnpjKey = getNFAndCNPJKey(record);
    if (!systemByNFAndCNPJ.has(nfAndCNPJKey)) systemByNFAndCNPJ.set(nfAndCNPJKey, []);
    systemByNFAndCNPJ.get(nfAndCNPJKey)!.push(record);

    const nfDateAndValueKey = getNFDateAndValueKey(record);
    if (!systemByNFDateAndValue.has(nfDateAndValueKey)) {
      systemByNFDateAndValue.set(nfDateAndValueKey, []);
    }
    systemByNFDateAndValue.get(nfDateAndValueKey)!.push(record);

    const cnpjDateAndValueKey = getCNPJDateAndValueKey(record);
    if (!systemByCNPJDateAndValue.has(cnpjDateAndValueKey)) {
      systemByCNPJDateAndValue.set(cnpjDateAndValueKey, []);
    }
    systemByCNPJDateAndValue.get(cnpjDateAndValueKey)!.push(record);

    const nfOnlyKey = getNFOnlyKey(record);
    if (!systemByNFOnly.has(nfOnlyKey)) systemByNFOnly.set(nfOnlyKey, []);
    systemByNFOnly.get(nfOnlyKey)!.push(record);
  });

  governmentRecords.forEach((govRecord, index) => {
    const id = `${index + 1}`;

    const accessKey = getAccessKey(govRecord);
    const accessKeyMatches = accessKey ? systemByAccessKey.get(accessKey) ?? [] : [];

    if (accessKeyMatches.length > 0) {
      const bestMatch = accessKeyMatches[0]!;
      const divergences: Array<"cnpj" | "data" | "valor"> = [];

      if (bestMatch.normalizedCnpjEmitente !== govRecord.normalizedCnpjEmitente) {
        divergences.push("cnpj");
      }

      if (bestMatch.normalizedDataEmissao !== govRecord.normalizedDataEmissao) {
        divergences.push("data");
      }

      if (!valuesAreEqual(bestMatch.normalizedValor, govRecord.normalizedValor)) {
        divergences.push("valor");
      }

      if (divergences.length === 0) {
        reconciled += 1;
        results.push(
          buildComparisonRow(
            govRecord,
            bestMatch,
            "Lançada",
            "Nota localizada no sistema pela mesma chave de acesso.",
            id,
          ),
        );
        return;
      }

      if (divergences.length === 1) {
        if (divergences[0] === "cnpj") {
          results.push(
            buildComparisonRow(
              govRecord,
              bestMatch,
              "CNPJ divergente",
              "Nota localizada no sistema pela mesma chave de acesso, porém com CNPJ diferente.",
              id,
            ),
          );
          return;
        }

        if (divergences[0] === "data") {
          results.push(
            buildComparisonRow(
              govRecord,
              bestMatch,
              "Data divergente",
              "Nota localizada no sistema pela mesma chave de acesso, porém com data de emissão diferente.",
              id,
            ),
          );
          return;
        }

        results.push(
          buildComparisonRow(
            govRecord,
            bestMatch,
            "Valor divergente",
            "Nota localizada no sistema pela mesma chave de acesso, porém com valor diferente.",
            id,
          ),
        );
        return;
      }

      results.push(
        buildComparisonRow(
          govRecord,
          bestMatch,
          "Múltiplas divergências",
          "Nota localizada no sistema pela mesma chave de acesso, mas com múltiplas divergências.",
          id,
        ),
      );
      return;
    }

    const nfAndCnpjKey = getNFAndCNPJKey(govRecord);
    const nfAndCnpjMatches = systemByNFAndCNPJ.get(nfAndCNPJKey) ?? [];

    if (nfAndCnpjMatches.length > 0) {
      const bestMatch = nfAndCnpjMatches[0]!;
      const divergences: Array<"data" | "valor"> = [];

      if (bestMatch.normalizedDataEmissao !== govRecord.normalizedDataEmissao) {
        divergences.push("data");
      }

      if (!valuesAreEqual(bestMatch.normalizedValor, govRecord.normalizedValor)) {
        divergences.push("valor");
      }

      if (divergences.length === 0) {
        reconciled += 1;
        results.push(
          buildComparisonRow(
            govRecord,
            bestMatch,
            "Lançada",
            "Nota localizada no sistema pelo mesmo número da NF e CNPJ.",
            id,
          ),
        );
        return;
      }

      if (divergences.length === 1) {
        if (divergences[0] === "data") {
          results.push(
            buildComparisonRow(
              govRecord,
              bestMatch,
              "Data divergente",
              "Nota localizada no sistema pelo mesmo número da NF e CNPJ, porém com data de emissão diferente.",
              id,
            ),
          );
          return;
        }

        results.push(
          buildComparisonRow(
            govRecord,
            bestMatch,
            "Valor divergente",
            "Nota localizada no sistema pelo mesmo número da NF e CNPJ, porém com valor diferente.",
            id,
          ),
        );
        return;
      }

      results.push(
        buildComparisonRow(
          govRecord,
          bestMatch,
          "Múltiplas divergências",
          "Nota localizada no sistema pelo mesmo número da NF e CNPJ, mas com divergência de data e valor.",
          id,
        ),
      );
      return;
    }

    const sameNFMatches = systemByNFOnly.get(getNFOnlyKey(govRecord)) ?? [];
    if (sameNFMatches.length > 0) {
      const cnpjErradoMatch = sameNFMatches.find(
        (item) =>
          item.normalizedCnpjEmitente !== govRecord.normalizedCnpjEmitente &&
          item.normalizedDataEmissao === govRecord.normalizedDataEmissao &&
          valuesAreEqual(item.normalizedValor, govRecord.normalizedValor),
      );

      if (cnpjErradoMatch) {
        results.push(
          buildComparisonRow(
            govRecord,
            cnpjErradoMatch,
            "CNPJ errado",
            "Nota localizada no sistema pelo mesmo número da NF, data de emissão e valor, porém com CNPJ diferente.",
            id,
          ),
        );
        return;
      }

      const bestSameNFMatch = sameNFMatches[0]!;
      const divergences: Array<"cnpj" | "data" | "valor"> = [];

      if (bestSameNFMatch.normalizedCnpjEmitente !== govRecord.normalizedCnpjEmitente) {
        divergences.push("cnpj");
      }

      if (bestSameNFMatch.normalizedDataEmissao !== govRecord.normalizedDataEmissao) {
        divergences.push("data");
      }

      if (!valuesAreEqual(bestSameNFMatch.normalizedValor, govRecord.normalizedValor)) {
        divergences.push("valor");
      }

      if (divergences.length === 1 && divergences[0] === "cnpj") {
        results.push(
          buildComparisonRow(
            govRecord,
            bestSameNFMatch,
            "CNPJ divergente",
            "Nota localizada no sistema pelo mesmo número da NF, porém com CNPJ diferente.",
            id,
          ),
        );
        return;
      }

      if (divergences.length > 0) {
        results.push(
          buildComparisonRow(
            govRecord,
            bestSameNFMatch,
            "Múltiplas divergências",
            "Nota localizada no sistema pelo mesmo número da NF, mas com múltiplas divergências.",
            id,
          ),
        );
        return;
      }
    }

    const nfDivergentKey = getCNPJDateAndValueKey(govRecord);
    const nfDivergentMatches = systemByCNPJDateAndValue.get(nfDivergentKey) ?? [];

    if (nfDivergentMatches.length > 0) {
      const bestNFMatch = nfDivergentMatches[0]!;
      results.push(
        buildComparisonRow(
          govRecord,
          bestNFMatch,
          "NF divergente",
          "Nota localizada no sistema pelo mesmo CNPJ, data de emissão e valor, porém com número da NF diferente.",
          id,
        ),
      );
      return;
    }

    results.push(
      buildComparisonRow(
        govRecord,
        null,
        "Não lançada",
        "Nota encontrada no SIEG e não localizada no sistema.",
        id,
      ),
    );
  });

  const notLaunchedRows = results.filter((item) => item.tipo === "Não lançada");
  const divergencesRows = results.filter(
    (item) => item.tipo !== "Não lançada" && item.tipo !== "Lançada",
  );

  return {
    results,
    summary: {
      totalGovernmentNotes: governmentRecords.length,
      totalSystemNotes: systemRecords.length,
      reconciled,
      notLaunchedCount: notLaunchedRows.length,
      divergencesCount: divergencesRows.length,
      notLaunchedValue: Number(
        notLaunchedRows.reduce((acc, item) => acc + item.valor, 0).toFixed(2),
      ),
      divergencesValue: Number(
        divergencesRows.reduce((acc, item) => acc + item.valor, 0).toFixed(2),
      ),
    },
  };
}

export function exportFilteredToExcel(rows: ComparisonRow[], filterLabel: string) {
  const rowsToExport =
    normalizeTag(filterLabel) === "ativo imobilizado"
      ? rows.filter((item) => item.ativoImobilizado)
      : rows;

  const mapped = rowsToExport.map((item) => ({
    "Chave de Acesso": item.chave,
    "Número da NF": item.numeroNF,
    "Data de Emissão": item.dataEmissao,
    "CNPJ do Emitente": item.cnpjEmitente,
    Fornecedor: item.nomeFornecedor || "",
    Tags: item.tags || "",
    "Ativo Imobilizado": item.ativoImobilizado ? "Sim" : "Não",
    "Valor SIEG": item.valor,
    "Valor Sistema": item.valorSistema ?? "",
    Status: item.tipo,
    Observação: item.observacao,
  }));

  if (!mapped.length) {
    throw new Error("Nenhum registro encontrado para exportação.");
  }

  const worksheet = XLSX.utils.json_to_sheet(mapped);
  const workbook = XLSX.utils.book_new();

  worksheet["!cols"] = [
    { wch: 48 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 32 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 70 },
  ];

  const safeSheetName =
    normalizeTag(filterLabel) === "ativo imobilizado"
      ? "Ativo Imobilizado"
      : filterLabel.slice(0, 31) || "NFe";

  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  XLSX.writeFile(
    workbook,
    `conciliacao-nfe-${safeSheetName.toLowerCase().replace(/\s+/g, "-")}.xlsx`,
  );
}