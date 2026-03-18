import * as XLSX from "xlsx";

export type DivergenceType = "Lançada" | "Não lançada";

export type ComparisonRow = {
  id: string;
  chave: string;
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
  chave: string;
};

type ComparisonResult = {
  results: ComparisonRow[];
  summary: ComparisonSummary;
};

export async function parseSpreadsheetFile(_file: File, _kind: SpreadsheetKind): Promise<ParsedRecord[]> {
  return [];
}

export function compareReports(
  governmentRecords: ParsedRecord[],
  systemRecords: ParsedRecord[],
): ComparisonResult {
  const results: ComparisonRow[] = [];

  governmentRecords.forEach((govRecord, index) => {
    const found = systemRecords.some((systemRecord) => systemRecord.chave === govRecord.chave);

    results.push({
      id: `${index + 1}`,
      chave: govRecord.chave,
      tipo: found ? "Lançada" : "Não lançada",
      observacao: found
        ? "Nota localizada no sistema pela mesma chave."
        : "Nota encontrada no governo e não localizada no sistema.",
    });
  });

  const reconciled = results.filter((item) => item.tipo === "Lançada").length;
  const notLaunched = results.filter((item) => item.tipo === "Não lançada").length;

  return {
    results,
    summary: {
      totalGovernmentNotes: governmentRecords.length,
      totalSystemNotes: systemRecords.length,
      reconciled,
      notLaunchedCount: notLaunched,
      divergencesCount: 0,
      notLaunchedValue: 0,
      divergencesValue: 0,
    },
  };
}

export function exportFilteredToExcel(_rows: ComparisonRow[], _filterLabel: string) {
  const worksheet = XLSX.utils.json_to_sheet([]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "NFe");
  XLSX.writeFile(workbook, "conciliacao-nfe.xlsx");
}