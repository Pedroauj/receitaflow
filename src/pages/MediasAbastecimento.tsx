import { useState, useMemo } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, FileSpreadsheet, X, TrendingUp, Users, Truck,
  Droplets, Leaf, DollarSign, Download, FileText, Presentation,
  Maximize2, Minimize2, Gauge, Percent, Fuel,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePresentationMode } from "@/contexts/PresentationModeContext";

// Data layer (desacoplada — pronta para futura integração)
import {
  mockVehicleRecords,
  mockTimeSeries,
  DIESEL_PRICE_REF,
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

// Componentes modulares
import KpiCard from "@/components/abastecimento/KpiCard";
import FleetComparison from "@/components/abastecimento/FleetComparison";
import TimeSeriesChart from "@/components/abastecimento/TimeSeriesChart";
import RankingChart from "@/components/abastecimento/RankingChart";
import InsightsPanel from "@/components/abastecimento/InsightsPanel";
import EfficiencyDonut from "@/components/abastecimento/EfficiencyDonut";
import GainLossBlock from "@/components/abastecimento/GainLossBlock";
import DetailedTable from "@/components/abastecimento/DetailedTable";

/* ── Formatters ─────────────────────────────────── */
const fmtNum = (v: number) => v.toLocaleString("pt-BR");
const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

/* ── Component ──────────────────────────────────── */
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

  /* ── Data processing (desacoplado) ─────────────── */
  const allRecords = mockVehicleRecords; // Futuro: substituir por dados do banco/API

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
  const bestEfficiency = useMemo(() => rankByEfficiency(filteredRecords, true, 10), [filteredRecords]);
  const worstEfficiency = useMemo(() => rankByEfficiency(filteredRecords, false, 10), [filteredRecords]);

  const availableTypes = useMemo(
    () => ["Geral", ...new Set(allRecords.map(r => r.tipoFrota))],
    [allRecords]
  );

  /* ── Handlers ──────────────────────────────────── */
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
      toast.success("Planilha processada com sucesso!");
    }, 1800);
  };

  const handleExport = (type: string) => {
    toast.info(`Exportação ${type} será implementada em breve.`);
  };

  /* ── KPIs ──────────────────────────────────────── */
  const kpis = [
    { label: "Total de Diesel", value: `${fmtNum(Math.round(globalKpis.totalDiesel))} L`, icon: Droplets, color: "text-cyan-400", highlight: true },
    { label: "Total de KM", value: fmtNum(Math.round(globalKpis.totalKm)), icon: Truck, color: "text-purple-400" },
    { label: "Média Geral", value: `${globalKpis.mediaGeral.toFixed(2)} km/l`, icon: TrendingUp, color: "text-primary", highlight: true, subValue: "Ponderada por KM" },
    { label: "Eficiência Geral", value: `${globalKpis.eficienciaGeral.toFixed(1)}%`, icon: Gauge, color: "text-primary", highlight: true },
    { label: "Economia Total", value: `+${fmtNum(Math.round(globalKpis.ganhoTotal))} L`, icon: Leaf, color: "text-emerald-400", highlight: true },
    { label: "Custo Total", value: fmtBRL(globalKpis.custoTotal), icon: DollarSign, color: "text-primary" },
    { label: "Veículos", value: String(globalKpis.totalVeiculos), icon: Truck, color: "text-blue-400" },
    { label: "Motoristas", value: String(globalKpis.totalMotoristas), icon: Users, color: "text-blue-400" },
  ];

  return (
    <motion.div
      className={`space-y-6 w-full mx-auto ${pm ? "max-w-[1600px]" : "max-w-[1600px]"}`}
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Header ─────────────────────────────── */}
      <div className="flex items-start justify-between">
        <AnimatePresence mode="wait">
          {pm ? (
            <motion.div
              key="pm-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                Desempenho de Frota
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Visão executiva · {activeTab === "Geral" ? "Todas as frotas" : activeTab}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="normal-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-xl font-semibold text-foreground">Médias de Abastecimento</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Dashboard executivo de consumo de diesel da frota
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={togglePresentationMode}
          title={pm ? "Sair do modo apresentação (ESC)" : "Modo apresentação (F)"}
          className={`
            flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium
            transition-all duration-300 shrink-0
            ${pm
              ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.25)]"
              : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
            }
          `}
        >
          {pm ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span className="hidden sm:inline">{pm ? "Sair" : "Apresentar"}</span>
        </button>
      </div>

      {/* ── Upload & Filters (hidden in presentation) ── */}
      <AnimatePresence>
        {!pm && (
          <motion.div
            initial={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="rounded-xl border border-border bg-card p-5 space-y-5"
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              {file ? (
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="ml-2 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-10 w-10 text-muted-foreground/60" />
                  <p className="text-sm text-muted-foreground text-center">
                    Envie a planilha exportada do sistema da empresa
                  </p>
                  <label className="cursor-pointer rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">
                    Selecionar arquivo
                    <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                  </label>
                  <p className="text-xs text-muted-foreground/50">.xlsx ou .xls</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Data inicial</label>
                <input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Data final</label>
                <input
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tipo de frota</label>
                <Select value={tipoFrota} onValueChange={setTipoFrota}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {FLEET_TYPES.map(t => (
                      <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={processing}
              className="w-full sm:w-auto rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {processing ? "Processando…" : "Processar Planilha"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ─────────────────────────────── */}
      {showResults && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: pm ? 0.15 : 0 }}
        >
          {/* Fleet type tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`bg-card border border-border ${pm ? "w-full flex-wrap h-auto" : ""}`}>
              {availableTypes.map(t => (
                <TabsTrigger key={t} value={t} className="text-xs sm:text-sm">
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* KPIs */}
          <div
            className={`grid gap-4 transition-all duration-500 ${
              pm
                ? "grid-cols-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8"
                : "grid-cols-2 md:grid-cols-4 lg:grid-cols-8"
            }`}
          >
            {kpis.map((kpi, i) => (
              <KpiCard key={kpi.label} {...kpi} pm={pm} index={i} />
            ))}
          </div>

          {/* Insights */}
          <InsightsPanel insights={insights} pm={pm} />

          {/* Destaques executivos */}
          <div
            className={`grid ${pm ? "gap-6" : "gap-4"} grid-cols-1 md:grid-cols-2 xl:grid-cols-3`}
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

          {/* Fleet Comparison (only on Geral tab) */}
          {activeTab === "Geral" && (
            <FleetComparison summaries={fleetSummaries} pm={pm} />
          )}

          {/* Main charts row */}
          <div className={`grid grid-cols-1 lg:grid-cols-3 ${pm ? "gap-6" : "gap-4"}`}>
            <div className={`lg:col-span-2 ${pm ? "min-h-[420px]" : ""}`}>
              <TimeSeriesChart data={mockTimeSeries} pm={pm} />
            </div>
            <EfficiencyDonut dist={effDist} pm={pm} />
          </div>

          {/* Gain/Loss */}
          <GainLossBlock records={filteredRecords} pm={pm} />

          {/* Rankings */}
          <div className={`grid grid-cols-1 lg:grid-cols-3 ${pm ? "gap-6" : "gap-4"}`}>
            <RankingChart title="Maior Consumo (L)" items={topConsumption} unit="L" pm={pm} />
            <RankingChart title="Melhores Médias (KM/L)" items={bestEfficiency} unit="km/l" pm={pm} />
            <RankingChart title="Piores Médias (KM/L)" items={worstEfficiency} unit="km/l" invertColors pm={pm} />
          </div>

          {/* Detailed Table */}
          <div className={pm ? "max-w-[1600px] mx-auto" : ""}>
            <DetailedTable records={filteredRecords} pm={pm} />
          </div>

          {/* Export (hidden in presentation) */}
          <AnimatePresence>
            {!pm && (
              <motion.div
                initial={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-border bg-card p-5 space-y-4"
              >
                <h3 className="text-sm font-medium text-foreground">Exportar Relatório</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleExport("PowerPoint")}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <Presentation className="h-4 w-4 text-primary" />
                    Gerar Apresentação
                  </button>
                  <button
                    onClick={() => handleExport("PDF")}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <FileText className="h-4 w-4 text-red-400" />
                    Exportar PDF
                  </button>
                  <button
                    onClick={() => handleExport("Excel")}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <Download className="h-4 w-4 text-emerald-400" />
                    Exportar Excel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MediasAbastecimento;