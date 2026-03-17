import * as XLSX from "xlsx";

export type DivergenceType =
  | "Não lançada"
  | "Valor divergente"
  | "Data divergente"
  | "NF divergente"
  | "CNPJ divergente"
  | "Múltiplas divergências";

export type ComparisonRow = {
  id: string;
  dataEmissao: string;
  numeroNF: string;
  cnpjPrestador: string;
  valor: number;
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
};

type ParsedRecord = {
  rawDataEmissao: string;
  rawNumeroNF: string;
  rawCnpjPrestador: string;
  rawValor: string | number;
  normalizedDataEmissao: string;
  normalizedNumeroNF: string;
  normalizedCnpjPrestador: string;
  normalizedValor: number;
};

type ComparisonResult = {
  results: ComparisonRow[];
  summary: ComparisonSummary;
};

const REQUIRED_FIELDS = {
  dataEmissao: [
    "data de emissao",
    "data emissão",
    "data emissao",
    "emissao",
    "data emissão nf",
    "data emissao nf",
  ],
  numeroNF: [
    "numero da nf",
    "número da nf",
    "nf",
    "nota fiscal",
    "numero nf",
    "número nf",
    "n° nf",
    "n nf",
  ],
  cnpjPrestador: [
    "cnpj do prestador",
    "cnpj prestador",
    "prestador",
    "cnpj fornecedor",
    "cnpj emitente",
    "cnpj",
  ],
  valor: [
    "valor serviço (vserv)",
    "valor servico (vserv)",
    "valor serviço",
    "valor servico",
    "vserv",
    "valor",
    "valor nf",
    "valor nota",
    "valor da nf",
    "valor total",
  ],
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function digitsOnly(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeNF(value: unknown) {
  const cleaned = String(value ?? "").trim();
  if (!cleaned) return "";
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

  const raw = String(value).trim();
  if (!raw) return "";

  const normalized = raw.replace(/\./g, "/").replace(/-/g, "/");
  const matchBr = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);

  if (matchBr) {
    const [, dd, mm, yyyyRaw] = matchBr;
    const yyyy = yyyyRaw.length === 2 ? `20${yyyyRaw}` : yyyyRaw;
    return `${yyyy.padStart(4, "0")}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const parsed = new Date(raw);
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

function formatCNPJ(value: string) {
  const digits = digitsOnly(value);
  if (digits.length !== 14) return value || "-";
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

function getCompositeKey(record: ParsedRecord) {
  return [
    record.normalizedDataEmissao,
    record.normalizedNumeroNF,
    record.normalizedCnpjPrestador,
    record.normalizedValor.toFixed(2),
  ].join("|");
}

function getNFAndCNPJKey(record: ParsedRecord) {
  return [record.normalizedNumeroNF, record.normalizedCnpjPrestador].join("|");
}

function getNFAndValueKey(record: ParsedRecord) {
  return [record.normalizedNumeroNF, record.normalizedValor.toFixed(2)].join("|");
}

function getCNPJAndValueKey(record: ParsedRecord) {
  return [record.normalizedCnpjPrestador, record.normalizedValor.toFixed(2)].join("|");
}

function findColumnKey(headers: string[], aliases: string[]) {
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const exact = headers.find((header) => header === normalizedAlias);
    if (exact) return exact;
  }

  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const partial = headers.find(
      (header) => header.includes(normalizedAlias) || normalizedAlias.includes(header),
    );
    if (partial) return partial;
  }

  return null;
}

function mapRequiredColumns(rows: Record<string, unknown>[]) {
  if (!rows.length) {
    throw new Error("A planilha está vazia ou não possui linhas para leitura.");
  }

  const normalizedRows = rows.map((row) => {
    const entries = Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]);
    return Object.fromEntries(entries);
  });

  const headers = Object.keys(normalizedRows[0] ?? {});

  const dataEmissaoKey = findColumnKey(headers, REQUIRED_FIELDS.dataEmissao);
  const numeroNFKey = findColumnKey(headers, REQUIRED_FIELDS.numeroNF);
  const cnpjPrestadorKey = findColumnKey(headers, REQUIRED_FIELDS.cnpjPrestador);
  const valorKey = findColumnKey(headers, REQUIRED_FIELDS.valor);

  const missing: string[] = [];
  if (!dataEmissaoKey) missing.push("Data de emissão");
  if (!numeroNFKey) missing.push("Número da NF");
  if (!cnpjPrestadorKey) missing.push("CNPJ do prestador");
  if (!valorKey) missing.push("Valor");

  if (missing.length > 0) {
    throw new Error(`Não encontrei estas colunas na planilha: ${missing.join(", ")}.`);
  }

  return {
    normalizedRows,
    keys: {
      dataEmissaoKey,
      numeroNFKey,
      cnpjPrestadorKey,
      valorKey,
    },
  };
}

export async function parseSpreadsheetFile(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Não foi possível localizar nenhuma aba na planilha enviada.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: true,
  });

  const { normalizedRows, keys } = mapRequiredColumns(rawRows);

  const parsed: ParsedRecord[] = normalizedRows
    .map((row) => {
      const rawDataEmissao = String(row[keys.dataEmissaoKey] ?? "").trim();
      const rawNumeroNF = String(row[keys.numeroNFKey] ?? "").trim();
      const rawCnpjPrestador = String(row[keys.cnpjPrestadorKey] ?? "").trim();
      const rawValor = row[keys.valorKey] ?? "";

      return {
        rawDataEmissao,
        rawNumeroNF,
        rawCnpjPrestador,
        rawValor,
        normalizedDataEmissao: normalizeDate(rawDataEmissao),
        normalizedNumeroNF: normalizeNF(rawNumeroNF),
        normalizedCnpjPrestador: digitsOnly(rawCnpjPrestador),
        normalizedValor: normalizeCurrency(rawValor),
      };
    })
    .filter(
      (row) =>
        row.normalizedDataEmissao ||
        row.normalizedNumeroNF ||
        row.normalizedCnpjPrestador ||
        row.normalizedValor > 0,
    );

  return parsed;
}

function buildComparisonRow(
  record: ParsedRecord,
  tipo: DivergenceType,
  observacao: string,
  id: string,
): ComparisonRow {
  return {
    id,
    dataEmissao: formatDateToBR(record.normalizedDataEmissao || record.rawDataEmissao),
    numeroNF: record.normalizedNumeroNF || record.rawNumeroNF || "-",
    cnpjPrestador: formatCNPJ(record.normalizedCnpjPrestador || record.rawCnpjPrestador),
    valor: record.normalizedValor,
    tipo,
    observacao,
  };
}

export function compareReports(
  governmentRecords: ParsedRecord[],
  systemRecords: ParsedRecord[],
): ComparisonResult {
  const exactSystemKeys = new Set(systemRecords.map(getCompositeKey));
  const systemByNFAndCNPJ = new Map<string, ParsedRecord[]>();
  const systemByNFAndValue = new Map<string, ParsedRecord[]>();
  const systemByCNPJAndValue = new Map<string, ParsedRecord[]>();

  systemRecords.forEach((record) => {
    const nfCnpjKey = getNFAndCNPJKey(record);
    const nfValueKey = getNFAndValueKey(record);
    const cnpjValueKey = getCNPJAndValueKey(record);

    if (!systemByNFAndCNPJ.has(nfCnpjKey)) systemByNFAndCNPJ.set(nfCnpjKey, []);
    if (!systemByNFAndValue.has(nfValueKey)) systemByNFAndValue.set(nfValueKey, []);
    if (!systemByCNPJAndValue.has(cnpjValueKey)) systemByCNPJAndValue.set(cnpjValueKey, []);

    systemByNFAndCNPJ.get(nfCnpjKey)!.push(record);
    systemByNFAndValue.get(nfValueKey)!.push(record);
    systemByCNPJAndValue.get(cnpjValueKey)!.push(record);
  });

  const results: ComparisonRow[] = [];
  let reconciled = 0;

  governmentRecords.forEach((govRecord, index) => {
    if (exactSystemKeys.has(getCompositeKey(govRecord))) {
      reconciled += 1;
      return;
    }

    const nfCnpjMatches = systemByNFAndCNPJ.get(getNFAndCNPJKey(govRecord)) ?? [];
    const nfValueMatches = systemByNFAndValue.get(getNFAndValueKey(govRecord)) ?? [];
    const cnpjValueMatches = systemByCNPJAndValue.get(getCNPJAndValueKey(govRecord)) ?? [];

    const hasNFAndCNPJ = nfCnpjMatches.length > 0;
    const sameValueWithinNFAndCNPJ = nfCnpjMatches.some(
      (item) => item.normalizedValor === govRecord.normalizedValor,
    );
    const sameDateWithinNFAndCNPJ = nfCnpjMatches.some(
      (item) => item.normalizedDataEmissao === govRecord.normalizedDataEmissao,
    );

    const sameNFAndValueDifferentCNPJ = nfValueMatches.some(
      (item) => item.normalizedCnpjPrestador !== govRecord.normalizedCnpjPrestador,
    );

    const sameCNPJAndValueDifferentNF = cnpjValueMatches.some(
      (item) => item.normalizedNumeroNF !== govRecord.normalizedNumeroNF,
    );

    let tipo: DivergenceType = "Não lançada";
    let observacao = "Nota encontrada no governo e não localizada no sistema.";

    if (hasNFAndCNPJ && !sameValueWithinNFAndCNPJ && !sameDateWithinNFAndCNPJ) {
      tipo = "Múltiplas divergências";
      observacao =
        "Mesma NF e mesmo CNPJ encontrados no sistema, mas com divergência de valor e data.";
    } else if (hasNFAndCNPJ && !sameValueWithinNFAndCNPJ) {
      tipo = "Valor divergente";
      observacao =
        "Mesma NF e mesmo CNPJ encontrados no sistema, porém com valor diferente.";
    } else if (hasNFAndCNPJ && !sameDateWithinNFAndCNPJ) {
      tipo = "Data divergente";
      observacao =
        "Mesma NF e mesmo CNPJ encontrados no sistema, porém com data de emissão diferente.";
    } else if (sameNFAndValueDifferentCNPJ) {
      tipo = "CNPJ divergente";
      observacao =
        "Mesma NF e mesmo valor encontrados no sistema, mas com CNPJ do prestador diferente.";
    } else if (sameCNPJAndValueDifferentNF) {
      tipo = "NF divergente";
      observacao =
        "Mesmo CNPJ e mesmo valor encontrados no sistema, mas com número da NF diferente.";
    }

    results.push(buildComparisonRow(govRecord, tipo, observacao, `${index + 1}`));
  });

  const notLaunched = results.filter((item) => item.tipo === "Não lançada");
  const divergences = results.filter((item) => item.tipo !== "Não lançada");

  return {
    results,
    summary: {
      totalGovernmentNotes: governmentRecords.length,
      totalSystemNotes: systemRecords.length,
      reconciled,
      notLaunchedCount: notLaunched.length,
      divergencesCount: divergences.length,
      notLaunchedValue: Number(
        notLaunched.reduce((acc, item) => acc + item.valor, 0).toFixed(2),
      ),
    },
  };
}

export function exportNotLaunchedToExcel(rows: ComparisonRow[]) {
  const notLaunchedRows = rows
    .filter((item) => item.tipo === "Não lançada")
    .map((item) => ({
      "Data de Emissão": item.dataEmissao,
      "Número da NF": item.numeroNF,
      "CNPJ do Prestador": item.cnpjPrestador,
      Valor: item.valor,
      Status: item.tipo,
      Observação: item.observacao,
    }));

  if (!notLaunchedRows.length) {
    throw new Error("Não existem notas não lançadas para exportação.");
  }

  const worksheet = XLSX.utils.json_to_sheet(notLaunchedRows);
  const workbook = XLSX.utils.book_new();

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 60 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Não Lançadas");
  XLSX.writeFile(workbook, "notas-nao-lancadas.xlsx");
}