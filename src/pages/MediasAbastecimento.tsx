import { useState, useMemo } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  TrendingUp,
  Users,
  Truck,
  Droplets,
  Leaf,
  DollarSign,
  Download,
  FileText,
  Presentation,
  Maximize2,
  Minimize2,
  Gauge,
  Fuel,
  CalendarDays,
  Filter,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePresentationMode } from "@/contexts/PresentationModeContext";

import {
  mockVehicleRecords,
  mockTimeSeries,
  computeGlobalKpis,
  computeFleetSummaries,
  filterByFleetType,
  rankByConsumption,
  rankByEfficiency,
  computeEfficiencyDistribution,
  computeRecordHighlights,
  generateInsights,
  FLEET_TYPES,
} from "@/lib/abastecimento";

import KpiCard from "@/components/abastecimento/KpiCard";
import FleetComparison from "@/components/abastecimento/FleetComparison";
import TimeSeriesChart from "@/components/abastecimento/TimeSeriesChart";
import RankingChart from "@/components/abastecimento/RankingChart";
import InsightsPanel from "@/components/abastecimento/InsightsPanel";
import EfficiencyDonut from "@/components/abastecimento/EfficiencyDonut";
import GainLossBlock from "@/components/abastecimento/GainLossBlock";
import DetailedTable from "@/components/abastecimento/DetailedTable";

const fmtNum = (v: number) => v.toLocaleString("pt-BR");
const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const MediasAbastecimento = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [tipoFrota, setTipoFrota] = useState<string>("todos");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [activeTab, setActiveTab] = useState("Geral");

  const { isPresentationMode, togglePresentationMode } = usePresentationMode();
  const pm = isPresentationMode;

  const allRecords = mockVehicleRecords;

  const filteredRecords = useMemo(
    () => filterByFleetType(allRecords, activeTab),
    [allRecords, activeTab]
  );

  const globalKpis = useMemo(() => computeGlobalKpis(filteredRecords), [filteredRecords]);
  const fleetSummaries = useMemo(() => computeFleetSummaries(allRecords), [allRecords]);
  const effDist = useMemo(() => computeEfficiencyDistribution(filteredRecords), [filteredRecords]);
  const highlights = useMemo(() => computeRecordHighlights(filteredRecords), [filteredRecords]);

  const insights = useMemo(
    () => generateInsights(filteredRecords, fleetSummaries, globalKpis, effDist),
    [filteredRecords, fleetSummaries, globalKpis, effDist]
  );

  const topConsumption = useMemo(() => rankByConsumption(filteredRecords, 10), [filteredRecords]);
  const bestEfficiency = useMemo(
    () => rankByEfficiency(filteredRecords, true, 10),
    [filteredRecords]
  );
  const worstEfficiency = useMemo(
    () => rankByEfficiency(filteredRecords, false, 10),
    [filteredRecords]
  );

  const availableTypes = useMemo(
    () => ["Geral", ...new Set(allRecords.map((r) => r.tipoFrota))],
    [allRecords]
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleProcess = () => {
    if (!file) {
      toast.error("Selecione uma planilha antes de processar.");
      return;
    }

    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      setShowResults(true);
      toast.success("Painel executivo atualizado com sucesso.");
    }, 1800);
  };

  const handleExport = (type: string) => {
    toast.info(`Exportação ${type} será implementada em breve.`);
  };

  const kpis = [
    {
      label: "Total de Diesel",
      value: `${fmtNum(Math.round(globalKpis.totalDiesel))} L`,
      icon: Droplets,
      color: "text-cyan-400",
      highlight: true,
    },
    {
      label: "Total de KM",
      value: fmtNum(Math.round(globalKpis.totalKm)),
      icon: Truck,
      color: "text-purple-400",
    },
    {
      label: "Média Geral",
      value: `${globalKpis.mediaGeral.toFixed(2)} km/l`,
      icon: TrendingUp,
      color: "text-primary",
      highlight: true,
      subValue: "Ponderada por KM",
    },
    {
      label: "Eficiência Geral",
      value: `${globalKpis.eficienciaGeral.toFixed(1)}%`,
      icon: Gauge,
      color: "text-primary",
      highlight: true,
    },
    {
      label: "Economia Total",
      value: `+${fmtNum(Math.round(globalKpis.ganhoTotal))} L`,
      icon: Leaf,
      color: "text-emerald-400",
      highlight: true,
    },
    {
      label: "Custo Total",
      value: fmtBRL(globalKpis.custoTotal),
      icon: DollarSign,
      color: "text-primary",
    },
    {
      label: "Veículos",
      value: String(globalKpis.totalVeiculos),
      icon: Truck,
      color: "text-blue-400",
    },
    {
      label: "Motoristas",
      value: String(globalKpis.totalMotoristas),
      icon: Users,
      color: "text-blue-400",
    },
  ];

  return (
    <motion.div
      className="mx-auto w-full max-w-[1600px] space-y-6"
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <section className="relative overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(9,13,24,0.92),rgba(6,10,18,0.96))] px-5 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] md:px-7 md:py-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-0 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_28%)]" />
        </div>

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Painel executivo
            </div>

            <AnimatePresence mode="wait">
              {pm ? (
                <motion.div
                  key="pm-header"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <h1 className="max-w-4xl text-2xl font-semibold leading-tight tracking-[-0.04em] text-foreground md:text-4xl">
                    Desempenho estratégico de abastecimento da frota
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm text-white/62 md:text-[15px]">
                    Leitura consolidada da operação para apresentação executiva, com foco em
                    eficiência, consumo, custo e oportunidade de economia.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="normal-header"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <h1 className="max-w-4xl text-[28px] font-semibold leading-tight tracking-[-0.04em] text-foreground md:text-[40px]">
                    Médias de Abastecimento
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm text-white/62 md:text-[15px]">
                    Visão executiva da performance de consumo da frota, estruturada para análise
                    interna e apresentação para diretoria.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start">
            <button
              onClick={togglePresentationMode}
              title={pm ? "Sair do modo apresentação (ESC)" : "Entrar no modo apresentação (F)"}
              className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition-all duration-300 ${
                pm
                  ? "border-primary/30 bg-primary/12 text-primary shadow-[0_0_24px_-8px_hsl(var(--primary)/0.45)] hover:bg-primary/18"
                  : "border-white/10 bg-white/[0.04] text-white/78 hover:border-white/14 hover:bg-white/[0.06] hover:text-foreground"
              }`}
            >
              {pm ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span>{pm ? "Sair da apresentação" : "Modo apresentação"}</span>
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {!pm && (
          <motion.section
            initial={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,14,25,0.88),rgba(8,12,22,0.94))] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.18)]"
          >
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                  Atualização do painel
                </h2>
                <p className="text-sm text-white/55">
                  Importe a planilha e refine o recorte da análise antes de apresentar os dados.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                <Filter className="h-3.5 w-3.5" />
                Base operacional
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative rounded-[20px] border-2 border-dashed p-8 transition-all duration-300 ${
                dragOver
                  ? "border-primary/60 bg-primary/6"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {file ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <FileSpreadsheet className="h-6 w-6 text-primary" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                      <p className="text-xs text-white/48">
                        {(file.size / 1024).toFixed(0)} KB • pronto para processamento
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setFile(null)}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.04]">
                    <UploadCloud className="h-8 w-8 text-white/55" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Arraste a planilha ou selecione o arquivo manualmente
                    </p>
                    <p className="mt-1 text-sm text-white/48">
                      Utilize a exportação oficial do sistema para manter a leitura executiva
                      confiável.
                    </p>
                  </div>

                  <label className="mt-1 inline-flex h-11 cursor-pointer items-center rounded-xl border border-primary/25 bg-primary/12 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/18">
                    Selecionar arquivo
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  <p className="text-xs text-white/35">Formatos aceitos: .xlsx e .xls</p>
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/42">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Data inicial
                </label>
                <input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-foreground outline-none transition-colors placeholder:text-white/22 focus:border-primary/35"
                />
              </div>

              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/42">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Data final
                </label>
                <input
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-foreground outline-none transition-colors placeholder:text-white/22 focus:border-primary/35"
                />
              </div>

              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/42">
                  <Filter className="h-3.5 w-3.5" />
                  Tipo de frota
                </label>
                <Select value={tipoFrota} onValueChange={setTipoFrota}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-white/10 bg-white/[0.03] text-foreground">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {FLEET_TYPES.map((t) => (
                      <SelectItem key={t} value={t.toLowerCase()}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={handleProcess}
                disabled={processing}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#f3b633]/40 bg-[linear-gradient(180deg,#f3b633,#d89614)] px-5 text-sm font-semibold text-[#18120a] shadow-[0_12px_30px_-12px_rgba(243,182,51,0.75)] transition-all duration-300 hover:brightness-105 hover:shadow-[0_16px_36px_-12px_rgba(243,182,51,0.85)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? "Atualizando painel..." : "Atualizar painel executivo"}
              </button>

              <p className="text-sm text-white/42">
                A análise será refletida em todos os indicadores e rankings abaixo.
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {showResults && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: pm ? 0.1 : 0 }}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground md:text-xl">
                Leitura consolidada da operação
              </h2>
              <p className="mt-1 text-sm text-white/56">
                Recorte atual: {activeTab === "Geral" ? "todas as frotas" : activeTab}.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto flex-wrap rounded-2xl border border-white/8 bg-white/[0.03] p-1">
                {availableTypes.map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="rounded-xl px-3 py-2 text-xs font-semibold sm:text-sm"
                  >
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div
            className={`grid gap-4 ${
              pm
                ? "grid-cols-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8"
                : "grid-cols-2 md:grid-cols-4 lg:grid-cols-8"
            }`}
          >
            {kpis.map((kpi, i) => (
              <KpiCard key={kpi.label} {...kpi} pm={pm} index={i} />
            ))}
          </div>

          <InsightsPanel insights={insights} pm={pm} />

          <div
            className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 ${pm ? "xl:gap-6" : ""}`}
          >
            {highlights.worstEfficiency && (
              <KpiCard
                label="Pior Média"
                value={`${highlights.worstEfficiency.mediaKmL.toFixed(2)} km/l`}
                subValue={highlights.worstEfficiency.placa}
                icon={TrendingUp}
                color="text-red-400"
                pm={pm}
              />
            )}

            {highlights.bestEfficiency && (
              <KpiCard
                label="Melhor Média"
                value={`${highlights.bestEfficiency.mediaKmL.toFixed(2)} km/l`}
                subValue={highlights.bestEfficiency.placa}
                icon={TrendingUp}
                color="text-emerald-400"
                pm={pm}
              />
            )}

            {highlights.highestConsumption && (
              <KpiCard
                label="Maior Consumo"
                value={`${Math.round(highlights.highestConsumption.litros)} L`}
                subValue={highlights.highestConsumption.placa}
                icon={Fuel}
                color="text-red-400"
                pm={pm}
              />
            )}

            {highlights.highestKm && (
              <KpiCard
                label="Maior KM"
                value={fmtNum(Math.round(highlights.highestKm.km))}
                subValue={highlights.highestKm.placa}
                icon={Truck}
                color="text-blue-400"
                pm={pm}
              />
            )}

            {highlights.biggestLoss && (
              <KpiCard
                label="Maior Perda"
                value={`-${fmtNum(Math.abs(highlights.biggestLoss.ganhoPerda))} L`}
                subValue={highlights.biggestLoss.placa}
                icon={TrendingUp}
                color="text-red-500"
                pm={pm}
              />
            )}

            {highlights.biggestGain && (
              <KpiCard
                label="Maior Economia"
                value={`+${fmtNum(highlights.biggestGain.ganhoPerda)} L`}
                subValue={highlights.biggestGain.placa}
                icon={Leaf}
                color="text-emerald-500"
                pm={pm}
              />
            )}
          </div>

          {activeTab === "Geral" && <FleetComparison summaries={fleetSummaries} pm={pm} />}

          <div className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${pm ? "lg:gap-6" : ""}`}>
            <div className={`lg:col-span-2 ${pm ? "min-h-[420px]" : ""}`}>
              <TimeSeriesChart data={mockTimeSeries} pm={pm} />
            </div>
            <EfficiencyDonut dist={effDist} pm={pm} />
          </div>

          <GainLossBlock records={filteredRecords} pm={pm} />

          <div className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${pm ? "lg:gap-6" : ""}`}>
            <RankingChart title="Maior Consumo (L)" items={topConsumption} unit="L" pm={pm} />
            <RankingChart
              title="Melhores Médias (KM/L)"
              items={bestEfficiency}
              unit="km/l"
              pm={pm}
            />
            <RankingChart
              title="Piores Médias (KM/L)"
              items={worstEfficiency}
              unit="km/l"
              invertColors
              pm={pm}
            />
          </div>

          <DetailedTable records={filteredRecords} pm={pm} />

          <AnimatePresence>
            {!pm && (
              <motion.section
                initial={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.3 }}
                className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,14,25,0.88),rgba(8,12,22,0.94))] p-5"
              >
                <div className="mb-4">
                  <h3 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                    Exportação executiva
                  </h3>
                  <p className="mt-1 text-sm text-white/52">
                    Gere materiais de apoio para reunião, acompanhamento ou envio formal.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleExport("PowerPoint")}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.06]"
                  >
                    <Presentation className="h-4 w-4 text-primary" />
                    Gerar apresentação
                  </button>

                  <button
                    onClick={() => handleExport("PDF")}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.06]"
                  >
                    <FileText className="h-4 w-4 text-red-400" />
                    Exportar PDF
                  </button>

                  <button
                    onClick={() => handleExport("Excel")}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.06]"
                  >
                    <Download className="h-4 w-4 text-emerald-400" />
                    Exportar Excel
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MediasAbastecimento;