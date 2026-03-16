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

export interface ProcessingResult {
  documents: ProcessedDocument[];
  errors: ProcessingError[];
  totalValorBruto: number;
  totalDocumentos: number;
}
