import * as XLSX from "xlsx";

export type DivergenceType =
  | "Lançada"
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
  nomeFornecedor: string;
  valor: number;
  valorSistema: number | null;
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

type ParsedRecord = {
  rawDataEmissao: string;
  rawNumeroNF: string;
  rawCnpjPrestador: string;
  rawNomeFornecedor: string;
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

type SpreadsheetKind = "system" | "government";

type MappedRow = Record<string, unknown>;

type ColumnIndexes = {
  dataIndex: number;
  nfIndex: number;
  cnpjIndex: number;
  valorIndex: number;
  nomeIndex: number;
};

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

function getCNPJDateAndValueKey(record: ParsedRecord) {
  return [
    record.normalizedCnpjPrestador,
    record.normalizedDataEmissao,
    record.normalizedValor.toFixed(2),
  ].join("|");
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
      ? ["data", "nonf", "nota/cnpj/cpf"]
      : [
          "numero (nnfse)",
          "data da emissao (dhemi)",
          "prestador (cnpj / cpf)",
          "valor servico (vserv)",
        ];

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

function mapSystemColumns(headers: string[]): ColumnIndexes {
  const dataIndex = findColumnIndex(headers, ["Data"]);
  const nfIndex = findColumnIndex(headers, ["N°NF", "NoNF", "NºNF", "N NF", "NF"]);
  const cnpjIndex = findColumnIndex(headers, ["NOTA/CNPJ/CPF", "CNPJ/CPF", "NOTA CNPJ CPF"]);
  const nomeIndex = findColumnIndex(headers, [
    "Razão Social",
    "Razao Social",
    "Nome",
    "Nome Fornecedor",
    "Nome do Fornecedor",
    "Prestador",
    "Fornecedor",
  ]);

  const missing: string[] = [];
  if (dataIndex === -1) missing.push("Data");
  if (nfIndex === -1) missing.push("N°NF");
  if (cnpjIndex === -1) missing.push("NOTA/CNPJ/CPF");

  const valorIndex = 9;

  if (headers.length <= valorIndex) {
    missing.push("coluna J (valor sem título)");
  }

  if (missing.length > 0) {
    throw new Error(
      `Na planilha do sistema não encontrei estas colunas esperadas: ${missing.join(", ")}.`,
    );
  }

  return { dataIndex, nfIndex, cnpjIndex, valorIndex, nomeIndex };
}

function mapGovernmentColumns(headers: string[]): ColumnIndexes {
  const nfIndex = findColumnIndex(headers, ["Número (nNFSe)"]);
  const dataIndex = findColumnIndex(headers, ["Data da Emissão (dhEmi)"]);
  const cnpjIndex = findColumnIndex(headers, ["Prestador (CNPJ / CPF)"]);
  const valorIndex = findColumnIndex(headers, ["Valor Serviço (vServ)"]);
  const nomeIndex = findColumnIndex(headers, [
    "Razão Social",
    "Razao Social",
    "Nome",
    "Nome Prestador",
    "Nome do Prestador",
    "Prestador (Razão Social)",
    "Prestador (Razao Social)",
    "Fornecedor",
  ]);

  const missing: string[] = [];
  if (dataIndex === -1) missing.push("Data da Emissão (dhEmi)");
  if (nfIndex === -1) missing.push("Número (nNFSe)");
  if (cnpjIndex === -1) missing.push("Prestador (CNPJ / CPF)");
  if (valorIndex === -1) missing.push("Valor Serviço (vServ)");

  if (missing.length > 0) {
    throw new Error(
      `Na planilha do governo não encontrei estas colunas esperadas: ${missing.join(", ")}.`,
    );
  }

  return { dataIndex, nfIndex, cnpjIndex, valorIndex, nomeIndex };
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

function parseRecordsByKind(rows: MappedRow[], indexes: ColumnIndexes): ParsedRecord[] {
  return rows
    .map((row) => {
      const values = Object.values(row);

      const originalDataEmissao = values[indexes.dataIndex];
      const originalNumeroNF = values[indexes.nfIndex];
      const originalCnpjPrestador = values[indexes.cnpjIndex];
      const originalValor = values[indexes.valorIndex] ?? "";
      const originalNomeFornecedor = indexes.nomeIndex >= 0 ? values[indexes.nomeIndex] : "";

      const rawDataEmissao =
        typeof originalDataEmissao === "number"
          ? formatDateToBR(normalizeDate(originalDataEmissao))
          : String(originalDataEmissao ?? "").trim();

      const rawNumeroNF = String(originalNumeroNF ?? "").trim();
      const rawCnpjPrestador = String(originalCnpjPrestador ?? "").trim();
      const rawNomeFornecedor = String(originalNomeFornecedor ?? "").trim();

      return {
        rawDataEmissao,
        rawNumeroNF,
        rawCnpjPrestador,
        rawNomeFornecedor,
        rawValor:
          typeof originalValor === "number"
            ? originalValor
            : String(originalValor ?? "").trim(),
        normalizedDataEmissao: normalizeDate(originalDataEmissao),
        normalizedNumeroNF: normalizeNF(originalNumeroNF),
        normalizedCnpjPrestador: digitsOnly(originalCnpjPrestador),
        normalizedValor: normalizeCurrency(originalValor),
      };
    })
    .filter(
      (row) =>
        row.normalizedDataEmissao ||
        row.normalizedNumeroNF ||
        row.normalizedCnpjPrestador ||
        row.normalizedValor > 0,
    );
}

export async function parseSpreadsheetFile(file: File, kind: SpreadsheetKind) {
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
  const indexes = kind === "system" ? mapSystemColumns(headers) : mapGovernmentColumns(headers);

  return parseRecordsByKind(mappedRows, indexes);
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
    dataEmissao: formatDateToBR(govRecord.normalizedDataEmissao || govRecord.rawDataEmissao),
    numeroNF: govRecord.normalizedNumeroNF || govRecord.rawNumeroNF || "-",
    cnpjPrestador: formatCNPJ(govRecord.normalizedCnpjPrestador || govRecord.rawCnpjPrestador),
    nomeFornecedor: resolveSupplierName(govRecord, systemRecord),
    valor: govRecord.normalizedValor,
    valorSistema: systemRecord ? systemRecord.normalizedValor : null,
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

  const systemByNFAndCNPJ = new Map<string, ParsedRecord[]>();
  const systemByCNPJDateAndValue = new Map<string, ParsedRecord[]>();

  systemRecords.forEach((record) => {
    const nfAndCnpjKey = getNFAndCNPJKey(record);
    if (!systemByNFAndCNPJ.has(nfAndCnpjKey)) {
      systemByNFAndCNPJ.set(nfAndCnpjKey, []);
    }
    systemByNFAndCNPJ.get(nfAndCnpjKey)!.push(record);

    const cnpjDateAndValueKey = getCNPJDateAndValueKey(record);
    if (!systemByCNPJDateAndValue.has(cnpjDateAndValueKey)) {
      systemByCNPJDateAndValue.set(cnpjDateAndValueKey, []);
    }
    systemByCNPJDateAndValue.get(cnpjDateAndValueKey)!.push(record);
  });

  governmentRecords.forEach((govRecord, index) => {
    const key = getNFAndCNPJKey(govRecord);
    const matches = systemByNFAndCNPJ.get(key) ?? [];

    if (matches.length === 0) {
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
            `${index + 1}`,
          ),
        );
        return;
      }

      results.push(
        buildComparisonRow(
          govRecord,
          null,
          "Não lançada",
          "Nota encontrada no governo e não localizada no sistema.",
          `${index + 1}`,
        ),
      );
      return;
    }

    const exactMatch = matches.some(
      (item) => getCompositeKey(item) === getCompositeKey(govRecord),
    );

    if (exactMatch) {
      reconciled += 1;
      const exactRecord = matches.find(
        (item) => getCompositeKey(item) === getCompositeKey(govRecord),
      )!;

      results.push(
        buildComparisonRow(
          govRecord,
          exactRecord,
          "Lançada",
          "Nota conciliada — registro idêntico encontrado no sistema.",
          `${index + 1}`,
        ),
      );
      return;
    }

    const bestMatch = matches[0]!;

    const sameDate = matches.some(
      (item) => item.normalizedDataEmissao === govRecord.normalizedDataEmissao,
    );

    const sameValue = matches.some(
      (item) => item.normalizedValor === govRecord.normalizedValor,
    );

    if (!sameDate && !sameValue) {
      results.push(
        buildComparisonRow(
          govRecord,
          bestMatch,
          "Múltiplas divergências",
          "Nota localizada no sistema pelo mesmo número da NF e CNPJ, mas com divergência de data e valor.",
          `${index + 1}`,
        ),
      );
      return;
    }

    if (!sameDate) {
      results.push(
        buildComparisonRow(
          govRecord,
          bestMatch,
          "Data divergente",
          "Nota localizada no sistema pelo mesmo número da NF e CNPJ, porém com data de emissão diferente.",
          `${index + 1}`,
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
        `${index + 1}`,
      ),
    );
  });

  const notLaunched = results.filter((item) => item.tipo === "Não lançada");
  const divergences = results.filter(
    (item) => item.tipo !== "Não lançada" && item.tipo !== "Lançada",
  );

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
      divergencesValue: Number(
        divergences.reduce((acc, item) => acc + item.valor, 0).toFixed(2),
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
      Fornecedor: item.nomeFornecedor || "",
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
    { wch: 28 },
    { wch: 14 },
    { wch: 18 },
    { wch: 60 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Não Lançadas");
  XLSX.writeFile(workbook, "notas-nao-lancadas.xlsx");
}

export function exportFilteredToExcel(rows: ComparisonRow[], filterLabel: string) {
  const mapped = rows.map((item) => ({
    "Data de Emissão": item.dataEmissao,
    "Número da NF": item.numeroNF,
    "CNPJ do Prestador": item.cnpjPrestador,
    Fornecedor: item.nomeFornecedor || "",
    "Valor Gov.": item.valor,
    "Valor Sist.": item.valorSistema ?? "",
    Status: item.tipo,
    Observação: item.observacao,
  }));

  if (!mapped.length) {
    throw new Error("Nenhum registro encontrado para exportação.");
  }

  const worksheet = XLSX.utils.json_to_sheet(mapped);
  const workbook = XLSX.utils.book_new();

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 60 },
  ];

  const sheetName = filterLabel.slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(
    workbook,
    `conciliacao-${filterLabel.toLowerCase().replace(/\s+/g, "-")}.xlsx`,
  );
}