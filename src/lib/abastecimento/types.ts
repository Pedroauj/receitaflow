/**
 * Tipos da camada de dados de Abastecimento.
 * Desacoplados da UI — prontos para futura integração com banco/API.
 */

export interface VehicleRecord {
  id: string;
  placa: string;
  motorista: string;
  tipoFrota: FleetType;
  km: number;
  litros: number;
  mediaKmL: number;
  metaKmL: number;
  ganhoPerda: number; // litros (positivo = economia, negativo = desperdício)
  eficiencia: number; // percentual vs meta (ex: 105 = 5% acima)
  custoEstimado: number; // R$
  periodo: string; // ex: "2025-01"
}

export type FleetType = "Truck" | "Carreta LS" | "Rodotrem" | "3/4" | string;

export const FLEET_TYPES: FleetType[] = ["Truck", "Carreta LS", "Rodotrem", "3/4"];

export interface FleetSummary {
  tipo: FleetType;
  kmTotal: number;
  litrosTotal: number;
  mediaKmL: number;
  metaKmL: number;
  eficiencia: number;
  participacao: number; // % do consumo total
  ganhoPerda: number;
  veiculos: number;
}

export interface GlobalKpis {
  totalDiesel: number;
  totalKm: number;
  mediaGeral: number; // ponderada
  ganhoTotal: number;
  perdaTotal: number;
  custoTotal: number;
  eficienciaGeral: number;
  totalVeiculos: number;
  totalMotoristas: number;
}

export interface TimeSeriesPoint {
  periodo: string;
  litros: number;
  kmL: number;
  custoEstimado: number;
}

export interface RankedItem {
  label: string;
  placa: string;
  tipoFrota: FleetType;
  value: number;
  meta?: number;
}

export interface Insight {
  id: string;
  text: string;
  severity: "info" | "warning" | "critical" | "success";
  icon: "trend" | "alert" | "fuel" | "truck" | "star";
}

export type EfficiencyBand = "above" | "within" | "below";

export interface EfficiencyDistribution {
  above: number;
  within: number;
  below: number;
  total: number;
}
