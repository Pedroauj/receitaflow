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
  dataVcto: string;
  dataPagamento: string;
  faturaOriginal: string;
  serie: string;
  numeroDocumento: string;
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
  totalLinhasFiltradasData: number;
  totalLinhasRemovidasPagamento: number;
  totalLinhasIgnoradas: number;
  totalLinhasValidas: number;
  totalLinhasComErro: number;
}
