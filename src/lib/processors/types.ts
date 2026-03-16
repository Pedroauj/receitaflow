export interface ProcessedDocument {
  filial: string;
  serie: string;
  numeroDocumento: string;
  tipoDocumento: string;
  valorPago: number;
}

export interface ProcessingError {
  row: number;
  fatura: string;
  motivo: string;
}

export interface PreviewRow {
  row: number;
  faturaOriginal: string;
  valorBrutoOriginal: string;
  valorBrutoConvertido: number | null;
  status: "válida" | "erro" | "ignorada";
}

export interface ProcessingResult {
  documents: ProcessedDocument[];
  errors: ProcessingError[];
  preview: PreviewRow[];
  totalValorBruto: number;
  totalDocumentos: number;
  totalLinhasLidas: number;
  totalLinhasIgnoradas: number;
  totalLinhasValidas: number;
  totalLinhasComErro: number;
}
