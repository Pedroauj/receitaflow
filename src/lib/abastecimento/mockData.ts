/**
 * Dados mock realistas separados por tipo de frota.
 * No futuro, essa camada será substituída por fetch ao banco/API.
 */
import type { VehicleRecord, TimeSeriesPoint } from "./types";

const DIESEL_PRICE = 6.15; // R$/litro referência

function rec(
  id: string, placa: string, motorista: string, tipo: string,
  km: number, litros: number, meta: number, periodo: string
): VehicleRecord {
  const mediaKmL = km / litros;
  const litrosEsperados = km / meta;
  const ganhoPerda = litrosEsperados - litros;
  const eficiencia = (mediaKmL / meta) * 100;
  return {
    id, placa, motorista, tipoFrota: tipo, km, litros,
    mediaKmL, metaKmL: meta, ganhoPerda, eficiencia,
    custoEstimado: litros * DIESEL_PRICE, periodo,
  };
}

export const mockVehicleRecords: VehicleRecord[] = [
  // Truck (meta ~2.70)
  rec("1", "ABC-1234", "Carlos Silva", "Truck", 12150, 4265, 2.70, "2025-06"),
  rec("2", "JKL-3456", "André Costa", "Truck", 13500, 4355, 2.70, "2025-06"),
  rec("3", "PQR-1122", "Rafael Lima", "Truck", 11800, 4041, 2.70, "2025-06"),
  rec("4", "YZA-7788", "Fernando Dias", "Truck", 10200, 3923, 2.70, "2025-06"),
  rec("5", "BCD-9900", "Gustavo Ramos", "Truck", 14300, 5107, 2.70, "2025-06"),

  // Carreta LS (meta ~2.50)
  rec("6", "DEF-5678", "João Pereira", "Carreta LS", 11000, 4400, 2.50, "2025-06"),
  rec("7", "VWX-5566", "Thiago Alves", "Carreta LS", 12600, 4667, 2.50, "2025-06"),
  rec("8", "EFG-2233", "Leandro Martins", "Carreta LS", 9800, 4083, 2.50, "2025-06"),
  rec("9", "HIJ-4455", "Bruno Ferreira", "Carreta LS", 10500, 4375, 2.50, "2025-06"),

  // Rodotrem (meta ~2.10)
  rec("10", "GHI-9012", "Pedro Santos", "Rodotrem", 9200, 4718, 2.10, "2025-06"),
  rec("11", "STU-3344", "Marcos Souza", "Rodotrem", 8500, 3953, 2.10, "2025-06"),
  rec("12", "KLM-6677", "Vinicius Nunes", "Rodotrem", 7800, 3900, 2.10, "2025-06"),

  // 3/4 (meta ~5.50)
  rec("13", "NOP-8899", "Diego Moreira", "3/4", 6500, 1182, 5.50, "2025-06"),
  rec("14", "QRS-1100", "Lucas Oliveira", "3/4", 5800, 1071, 5.50, "2025-06"),
  rec("15", "TUV-2211", "Renato Barros", "3/4", 7200, 1385, 5.50, "2025-06"),
];

export const mockTimeSeries: TimeSeriesPoint[] = [
  { periodo: "Jan", litros: 38200, kmL: 2.42, custoEstimado: 234930 },
  { periodo: "Fev", litros: 36800, kmL: 2.48, custoEstimado: 226320 },
  { periodo: "Mar", litros: 39500, kmL: 2.45, custoEstimado: 242925 },
  { periodo: "Abr", litros: 37100, kmL: 2.53, custoEstimado: 228165 },
  { periodo: "Mai", litros: 35600, kmL: 2.58, custoEstimado: 218940 },
  { periodo: "Jun", litros: 34200, kmL: 2.62, custoEstimado: 210330 },
];

export const DIESEL_PRICE_REF = DIESEL_PRICE;
