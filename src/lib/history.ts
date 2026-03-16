export interface HistoryRecord {
  id: string;
  cliente: string;
  dataProcessamento: string; // ISO string
  dataVencimento: string;
  dataRecebimento: string;
  quantidadeDocumentos: number;
  valorTotal: number;
  valorInformadoBanco: number;
  statusConferencia: "confere" | "diverge";
  quantidadeErros: number;
}

export interface HistoryStats {
  totalPlanilhas: number;
  totalDocumentos: number;
  valorTotalProcessado: number;
}

const STORAGE_KEY = "sheetflow_history";

function loadRecords(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: HistoryRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function addRecord(record: Omit<HistoryRecord, "id">): HistoryRecord {
  const records = loadRecords();
  const newRecord: HistoryRecord = {
    ...record,
    id: crypto.randomUUID(),
  };
  records.unshift(newRecord);
  saveRecords(records);
  return newRecord;
}

export function getRecords(): HistoryRecord[] {
  return loadRecords();
}

export function getRecordById(id: string): HistoryRecord | undefined {
  return loadRecords().find((r) => r.id === id);
}

export function getStats(): HistoryStats {
  const records = loadRecords();
  return {
    totalPlanilhas: records.length,
    totalDocumentos: records.reduce((sum, r) => sum + r.quantidadeDocumentos, 0),
    valorTotalProcessado: records.reduce((sum, r) => sum + r.valorTotal, 0),
  };
}
