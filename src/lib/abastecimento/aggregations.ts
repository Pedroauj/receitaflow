/**
 * Funções de agregação e cálculo de KPIs.
 * Desacopladas da fonte de dados — recebem arrays tipados e retornam resultados.
 */
import type {
  VehicleRecord, FleetSummary, GlobalKpis, RankedItem,
  Insight, EfficiencyDistribution,
} from "./types";

/* ── KPIs globais ──────────────────────────────── */
export function computeGlobalKpis(records: VehicleRecord[]): GlobalKpis {
  const totalKm = records.reduce((s, r) => s + r.km, 0);
  const totalDiesel = records.reduce((s, r) => s + r.litros, 0);
  const custoTotal = records.reduce((s, r) => s + r.custoEstimado, 0);
  const ganhos = records.filter((r) => r.ganhoPerda > 0).reduce((s, r) => s + r.ganhoPerda, 0);
  const perdas = records.filter((r) => r.ganhoPerda < 0).reduce((s, r) => s + Math.abs(r.ganhoPerda), 0);
  const mediaGeral = totalDiesel > 0 ? totalKm / totalDiesel : 0;

  const metaPonderada = totalKm > 0
    ? records.reduce((s, r) => s + r.metaKmL * r.km, 0) / totalKm
    : 0;

  const eficienciaGeral = metaPonderada > 0 ? (mediaGeral / metaPonderada) * 100 : 0;

  const motoristas = new Set(records.map((r) => r.motorista));

  return {
    totalDiesel,
    totalKm,
    mediaGeral,
    ganhoTotal: ganhos,
    perdaTotal: perdas,
    custoTotal,
    eficienciaGeral,
    totalVeiculos: records.length,
    totalMotoristas: motoristas.size,
  };
}

/* ── Resumo por tipo de frota ──────────────────── */
export function computeFleetSummaries(records: VehicleRecord[]): FleetSummary[] {
  const totalLitros = records.reduce((s, r) => s + r.litros, 0);
  const tipos = [...new Set(records.map((r) => r.tipoFrota))];

  return tipos
    .map((tipo) => {
      const recs = records.filter((r) => r.tipoFrota === tipo);
      const kmTotal = recs.reduce((s, r) => s + r.km, 0);
      const litrosTotal = recs.reduce((s, r) => s + r.litros, 0);
      const mediaKmL = litrosTotal > 0 ? kmTotal / litrosTotal : 0;

      const metaKmL = kmTotal > 0
        ? recs.reduce((s, r) => s + r.metaKmL * r.km, 0) / kmTotal
        : 0;

      const eficiencia = metaKmL > 0 ? (mediaKmL / metaKmL) * 100 : 0;
      const participacao = totalLitros > 0 ? (litrosTotal / totalLitros) * 100 : 0;
      const ganhoPerda = recs.reduce((s, r) => s + r.ganhoPerda, 0);

      return {
        tipo,
        kmTotal,
        litrosTotal,
        mediaKmL,
        metaKmL,
        eficiencia,
        participacao,
        ganhoPerda,
        veiculos: recs.length,
      };
    })
    .sort((a, b) => b.litrosTotal - a.litrosTotal);
}

/* ── Rankings ──────────────────────────────────── */
export function rankByConsumption(records: VehicleRecord[], limit = 10): RankedItem[] {
  return [...records]
    .sort((a, b) => b.litros - a.litros)
    .slice(0, limit)
    .map((r) => ({
      label: r.motorista,
      placa: r.placa,
      tipoFrota: r.tipoFrota,
      value: r.litros,
    }));
}

export function rankByEfficiency(
  records: VehicleRecord[],
  best: boolean,
  limit = 10
): RankedItem[] {
  return [...records]
    .sort((a, b) => (best ? b.mediaKmL - a.mediaKmL : a.mediaKmL - b.mediaKmL))
    .slice(0, limit)
    .map((r) => ({
      label: r.motorista,
      placa: r.placa,
      tipoFrota: r.tipoFrota,
      value: r.mediaKmL,
      meta: r.metaKmL,
    }));
}

/* ── Distribuição de eficiência ────────────────── */
export function computeEfficiencyDistribution(
  records: VehicleRecord[],
  tolerance = 3
): EfficiencyDistribution {
  let above = 0;
  let within = 0;
  let below = 0;

  for (const r of records) {
    if (r.eficiencia >= 100 + tolerance) above++;
    else if (r.eficiencia >= 100 - tolerance) within++;
    else below++;
  }

  return { above, within, below, total: records.length };
}

/* ── Destaques executivos ──────────────────────── */
export type RecordHighlights = {
  highestConsumption: VehicleRecord | null;
  lowestConsumption: VehicleRecord | null;
  bestEfficiency: VehicleRecord | null;
  worstEfficiency: VehicleRecord | null;
  highestKm: VehicleRecord | null;
  biggestLoss: VehicleRecord | null;
  biggestGain: VehicleRecord | null;
};

export function computeRecordHighlights(records: VehicleRecord[]): RecordHighlights {
  if (!records.length) {
    return {
      highestConsumption: null,
      lowestConsumption: null,
      bestEfficiency: null,
      worstEfficiency: null,
      highestKm: null,
      biggestLoss: null,
      biggestGain: null,
    };
  }

  const highestConsumption = [...records].sort((a, b) => b.litros - a.litros)[0] ?? null;
  const lowestConsumption = [...records].sort((a, b) => a.litros - b.litros)[0] ?? null;
  const bestEfficiency = [...records].sort((a, b) => b.mediaKmL - a.mediaKmL)[0] ?? null;
  const worstEfficiency = [...records].sort((a, b) => a.mediaKmL - b.mediaKmL)[0] ?? null;
  const highestKm = [...records].sort((a, b) => b.km - a.km)[0] ?? null;

  const biggestLossCandidate = [...records].sort((a, b) => a.ganhoPerda - b.ganhoPerda)[0] ?? null;
  const biggestGainCandidate = [...records].sort((a, b) => b.ganhoPerda - a.ganhoPerda)[0] ?? null;

  return {
    highestConsumption,
    lowestConsumption,
    bestEfficiency,
    worstEfficiency,
    highestKm,
    biggestLoss: biggestLossCandidate && biggestLossCandidate.ganhoPerda < 0 ? biggestLossCandidate : null,
    biggestGain: biggestGainCandidate && biggestGainCandidate.ganhoPerda > 0 ? biggestGainCandidate : null,
  };
}

/* ── Insights automáticos ──────────────────────── */
export function generateInsights(
  records: VehicleRecord[],
  fleetSummaries: FleetSummary[],
  kpis: GlobalKpis,
  dist: EfficiencyDistribution,
): Insight[] {
  const insights: Insight[] = [];

  const topConsumer = fleetSummaries[0];
  if (topConsumer) {
    insights.push({
      id: "top-consumer",
      text: `${topConsumer.tipo} representa ${topConsumer.participacao.toFixed(0)}% do consumo total de diesel`,
      severity: "info",
      icon: "truck",
    });
  }

  const mostEfficient = [...fleetSummaries].sort((a, b) => b.eficiencia - a.eficiencia)[0];
  if (mostEfficient && mostEfficient.eficiencia >= 100) {
    insights.push({
      id: "most-efficient",
      text: `${mostEfficient.tipo} possui a melhor eficiência da operação (${mostEfficient.eficiencia.toFixed(1)}%)`,
      severity: "success",
      icon: "star",
    });
  }

  const pctBelow = dist.total > 0 ? (dist.below / dist.total) * 100 : 0;
  if (pctBelow > 0) {
    insights.push({
      id: "below-target",
      text: `${pctBelow.toFixed(0)}% dos veículos estão abaixo da meta esperada`,
      severity: pctBelow > 40 ? "critical" : "warning",
      icon: "alert",
    });
  }

  const wasteful = records
    .filter((r) => r.ganhoPerda < 0)
    .sort((a, b) => a.ganhoPerda - b.ganhoPerda);

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

  if (kpis.ganhoTotal > kpis.perdaTotal) {
    insights.push({
      id: "positive-trend",
      text: `A operação apresenta saldo positivo de ${(kpis.ganhoTotal - kpis.perdaTotal).toFixed(0)} litros economizados`,
      severity: "success",
      icon: "trend",
    });
  }

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

  const highlights = computeRecordHighlights(records);

  if (highlights.worstEfficiency) {
    insights.push({
      id: "worst-efficiency-vehicle",
      text: `${highlights.worstEfficiency.placa} (${highlights.worstEfficiency.motorista}) tem a pior média do período: ${highlights.worstEfficiency.mediaKmL.toFixed(2)} km/l`,
      severity: "warning",
      icon: "alert",
    });
  }

  if (highlights.highestConsumption) {
    insights.push({
      id: "highest-consumption-vehicle",
      text: `${highlights.highestConsumption.placa} foi o veículo com maior consumo: ${highlights.highestConsumption.litros.toFixed(0)} litros`,
      severity: "info",
      icon: "fuel",
    });
  }

  if (highlights.biggestLoss) {
    insights.push({
      id: "biggest-loss-vehicle",
      text: `${highlights.biggestLoss.placa} registrou a maior perda do período: ${Math.abs(highlights.biggestLoss.ganhoPerda).toFixed(0)} litros`,
      severity: "critical",
      icon: "alert",
    });
  }

  return insights;
}

/* ── Filtro por tipo ───────────────────────────── */
export function filterByFleetType(records: VehicleRecord[], tipo: string): VehicleRecord[] {
  if (!tipo || tipo === "Geral") return records;
  return records.filter((r) => r.tipoFrota === tipo);
}