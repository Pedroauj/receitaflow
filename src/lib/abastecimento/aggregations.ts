/**
 * Funções de agregação e cálculo de KPIs.
 * Desacopladas da fonte de dados — recebem arrays tipados e retornam resultados.
 */
import type {
  VehicleRecord, FleetSummary, GlobalKpis, RankedItem,
  Insight, EfficiencyDistribution, FleetType,
} from "./types";
import { FLEET_TYPES } from "./types";

/* ── KPIs globais ──────────────────────────────── */
export function computeGlobalKpis(records: VehicleRecord[]): GlobalKpis {
  const totalKm = records.reduce((s, r) => s + r.km, 0);
  const totalDiesel = records.reduce((s, r) => s + r.litros, 0);
  const custoTotal = records.reduce((s, r) => s + r.custoEstimado, 0);
  const ganhos = records.filter(r => r.ganhoPerda > 0).reduce((s, r) => s + r.ganhoPerda, 0);
  const perdas = records.filter(r => r.ganhoPerda < 0).reduce((s, r) => s + Math.abs(r.ganhoPerda), 0);
  const mediaGeral = totalDiesel > 0 ? totalKm / totalDiesel : 0;

  // eficiência ponderada
  const metaPonderada = totalKm > 0
    ? records.reduce((s, r) => s + r.metaKmL * r.km, 0) / totalKm
    : 0;
  const eficienciaGeral = metaPonderada > 0 ? (mediaGeral / metaPonderada) * 100 : 0;

  const motoristas = new Set(records.map(r => r.motorista));

  return {
    totalDiesel, totalKm, mediaGeral, ganhoTotal: ganhos,
    perdaTotal: perdas, custoTotal, eficienciaGeral,
    totalVeiculos: records.length, totalMotoristas: motoristas.size,
  };
}

/* ── Resumo por tipo de frota ──────────────────── */
export function computeFleetSummaries(records: VehicleRecord[]): FleetSummary[] {
  const totalLitros = records.reduce((s, r) => s + r.litros, 0);
  const tipos = [...new Set(records.map(r => r.tipoFrota))];

  return tipos.map(tipo => {
    const recs = records.filter(r => r.tipoFrota === tipo);
    const kmTotal = recs.reduce((s, r) => s + r.km, 0);
    const litrosTotal = recs.reduce((s, r) => s + r.litros, 0);
    const mediaKmL = litrosTotal > 0 ? kmTotal / litrosTotal : 0;
    const metaKmL = recs.length > 0 ? recs[0].metaKmL : 0;
    const eficiencia = metaKmL > 0 ? (mediaKmL / metaKmL) * 100 : 0;
    const participacao = totalLitros > 0 ? (litrosTotal / totalLitros) * 100 : 0;
    const ganhoPerda = recs.reduce((s, r) => s + r.ganhoPerda, 0);

    return { tipo, kmTotal, litrosTotal, mediaKmL, metaKmL, eficiencia, participacao, ganhoPerda, veiculos: recs.length };
  }).sort((a, b) => b.litrosTotal - a.litrosTotal);
}

/* ── Rankings ──────────────────────────────────── */
export function rankByConsumption(records: VehicleRecord[], limit = 10): RankedItem[] {
  return [...records]
    .sort((a, b) => b.litros - a.litros)
    .slice(0, limit)
    .map(r => ({ label: r.motorista, placa: r.placa, tipoFrota: r.tipoFrota, value: r.litros }));
}

export function rankByEfficiency(records: VehicleRecord[], best: boolean, limit = 10): RankedItem[] {
  return [...records]
    .sort((a, b) => best ? b.mediaKmL - a.mediaKmL : a.mediaKmL - b.mediaKmL)
    .slice(0, limit)
    .map(r => ({
      label: r.motorista, placa: r.placa, tipoFrota: r.tipoFrota,
      value: r.mediaKmL, meta: r.metaKmL,
    }));
}

/* ── Distribuição de eficiência ────────────────── */
export function computeEfficiencyDistribution(records: VehicleRecord[], tolerance = 3): EfficiencyDistribution {
  let above = 0, within = 0, below = 0;
  for (const r of records) {
    if (r.eficiencia >= 100 + tolerance) above++;
    else if (r.eficiencia >= 100 - tolerance) within++;
    else below++;
  }
  return { above, within, below, total: records.length };
}

/* ── Insights automáticos ──────────────────────── */
export function generateInsights(
  records: VehicleRecord[],
  fleetSummaries: FleetSummary[],
  kpis: GlobalKpis,
  dist: EfficiencyDistribution,
): Insight[] {
  const insights: Insight[] = [];

  // Maior consumidor
  const topConsumer = fleetSummaries[0];
  if (topConsumer) {
    insights.push({
      id: "top-consumer",
      text: `${topConsumer.tipo} representa ${topConsumer.participacao.toFixed(0)}% do consumo total de diesel`,
      severity: "info",
      icon: "truck",
    });
  }

  // Mais eficiente
  const mostEfficient = [...fleetSummaries].sort((a, b) => b.eficiencia - a.eficiencia)[0];
  if (mostEfficient && mostEfficient.eficiencia >= 100) {
    insights.push({
      id: "most-efficient",
      text: `${mostEfficient.tipo} possui a melhor eficiência da operação (${mostEfficient.eficiencia.toFixed(1)}%)`,
      severity: "success",
      icon: "star",
    });
  }

  // Veículos abaixo da meta
  const pctBelow = dist.total > 0 ? (dist.below / dist.total) * 100 : 0;
  if (pctBelow > 0) {
    insights.push({
      id: "below-target",
      text: `${pctBelow.toFixed(0)}% dos veículos estão abaixo da meta esperada`,
      severity: pctBelow > 40 ? "critical" : "warning",
      icon: "alert",
    });
  }

  // Maiores desperdiçadores
  const wasteful = records.filter(r => r.ganhoPerda < 0).sort((a, b) => a.ganhoPerda - b.ganhoPerda);
  if (wasteful.length > 0) {
    const top3 = wasteful.slice(0, 3);
    const totalWaste = top3.reduce((s, r) => s + Math.abs(r.ganhoPerda), 0);
    insights.push({
      id: "top-waste",
      text: `${top3.length} veículos concentram ${totalWaste.toFixed(0)} litros de desperdício`,
      severity: "warning",
      icon: "fuel",
    });
  }

  // Tendência de melhoria
  if (kpis.ganhoTotal > kpis.perdaTotal) {
    insights.push({
      id: "positive-trend",
      text: `A operação apresenta saldo positivo de ${(kpis.ganhoTotal - kpis.perdaTotal).toFixed(0)} litros economizados`,
      severity: "success",
      icon: "trend",
    });
  }

  // Variação entre frotas
  if (fleetSummaries.length >= 2) {
    const sorted = [...fleetSummaries].sort((a, b) => b.eficiencia - a.eficiencia);
    const diff = sorted[0].eficiencia - sorted[sorted.length - 1].eficiencia;
    if (diff > 15) {
      insights.push({
        id: "fleet-variance",
        text: `Há variação de ${diff.toFixed(0)}% de eficiência entre tipos de frota — oportunidade de padronização`,
        severity: "info",
        icon: "trend",
      });
    }
  }

  return insights;
}

/* ── Filtro por tipo ───────────────────────────── */
export function filterByFleetType(records: VehicleRecord[], tipo: string): VehicleRecord[] {
  if (!tipo || tipo === "Geral") return records;
  return records.filter(r => r.tipoFrota === tipo);
}
