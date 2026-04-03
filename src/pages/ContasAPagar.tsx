import { useState } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  Landmark,
  UploadCloud,
  X,
  Search,
  Filter,
  CalendarDays,
  ArrowDownUp,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Table2,
} from "lucide-react";

/* ─── animation helpers ─── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

/* ─── placeholder KPI data ─── */
const placeholderKpis = [
  { label: "Total de títulos", value: "—", icon: FileText, color: "text-blue-400" },
  { label: "Conciliados", value: "—", icon: CheckCircle2, color: "text-emerald-400" },
  { label: "Divergentes", value: "—", icon: AlertTriangle, color: "text-amber-400" },
  { label: "Não encontrados", value: "—", icon: XCircle, color: "text-red-400" },
];

const ContasAPagar = () => {
  /* ─── file state (visual only) ─── */
  const [sistemaFile, setSistemaFile] = useState<File | null>(null);
  const [extratoFile, setExtratoFile] = useState<File | null>(null);
  const [dragSistema, setDragSistema] = useState(false);
  const [dragExtrato, setDragExtrato] = useState(false);

  /* ─── drag helpers ─── */
  const handleDrag = (setter: (v: boolean) => void) => ({
    onDragOver: (e: DragEvent) => { e.preventDefault(); setter(true); },
    onDragLeave: () => setter(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setter(false);
      const f = e.dataTransfer.files[0];
      return f;
    },
  });

  const handleFileInput = (setter: (f: File | null) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setter(e.target.files[0]);
  };

  /* ─── shared card style ─── */
  const cardBase =
    "rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,14,25,0.88),rgba(8,12,22,0.94))] shadow-[0_14px_34px_rgba(0,0,0,0.18)]";

  return (
    <motion.div
      className="mx-auto w-full max-w-[1600px] space-y-6"
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* ═══════════ HEADER ═══════════ */}
      <section
        className="relative overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(9,13,24,0.92),rgba(6,10,18,0.96))] px-5 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] md:px-7 md:py-6"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-0 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_28%)]" />
        </div>

        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            <Landmark className="h-3.5 w-3.5 text-primary" />
            Financeiro
          </div>

          <h1 className="max-w-4xl text-[28px] font-semibold leading-tight tracking-[-0.04em] text-foreground md:text-[40px]">
            Contas a Pagar
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-white/62 md:text-[15px]">
            Conciliação e importação de dados financeiros — cruze relatórios do sistema com extratos
            bancários para identificar divergências e garantir acurácia nos pagamentos.
          </p>
        </div>
      </section>

      {/* ═══════════ IMPORT AREAS ═══════════ */}
      <motion.div
        className="grid gap-5 lg:grid-cols-2"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* ── Área 1: Relatório do Sistema ── */}
        <motion.section variants={fadeUp} className={`${cardBase} p-5`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                Relatório do Sistema
              </h2>
              <p className="mt-0.5 text-sm text-white/55">
                Importe o arquivo Excel (.xlsx) exportado pelo sistema financeiro.
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            </div>
          </div>

          <div
            {...handleDrag(setDragSistema)}
            onDrop={(e) => {
              const f = handleDrag(setDragSistema).onDrop(e);
              if (f) setSistemaFile(f);
            }}
            className={`relative rounded-[20px] border-2 border-dashed p-8 text-center transition-all duration-300 ${
              dragSistema
                ? "border-primary/60 bg-primary/6"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            {sistemaFile ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{sistemaFile.name}</p>
                    <p className="text-xs text-white/48">
                      {(sistemaFile.size / 1024).toFixed(0)} KB • pronto para processamento
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSistemaFile(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 transition-colors hover:bg-white/[0.08] hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <UploadCloud className="h-7 w-7 text-white/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Arraste o arquivo ou{" "}
                    <span className="text-primary underline underline-offset-2">selecione</span>
                  </p>
                  <p className="mt-1 text-xs text-white/40">Formatos aceitos: .xlsx, .xls</p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileInput(setSistemaFile)}
                />
              </label>
            )}
          </div>
        </motion.section>

        {/* ── Área 2: Extrato Bancário ── */}
        <motion.section variants={fadeUp} className={`${cardBase} p-5`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                Extrato Bancário
              </h2>
              <p className="mt-0.5 text-sm text-white/55">
                Importe o extrato bancário em formato CSV para cruzamento de dados.
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <Landmark className="h-5 w-5 text-blue-400" />
            </div>
          </div>

          <div
            {...handleDrag(setDragExtrato)}
            onDrop={(e) => {
              const f = handleDrag(setDragExtrato).onDrop(e);
              if (f) setExtratoFile(f);
            }}
            className={`relative rounded-[20px] border-2 border-dashed p-8 text-center transition-all duration-300 ${
              dragExtrato
                ? "border-primary/60 bg-primary/6"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            {extratoFile ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{extratoFile.name}</p>
                    <p className="text-xs text-white/48">
                      {(extratoFile.size / 1024).toFixed(0)} KB • pronto para processamento
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExtratoFile(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 transition-colors hover:bg-white/[0.08] hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <UploadCloud className="h-7 w-7 text-white/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Arraste o arquivo ou{" "}
                    <span className="text-primary underline underline-offset-2">selecione</span>
                  </p>
                  <p className="mt-1 text-xs text-white/40">Formatos aceitos: .csv</p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileInput(setExtratoFile)}
                />
              </label>
            )}
          </div>
        </motion.section>
      </motion.div>

      {/* ═══════════ ACTION BAR ═══════════ */}
      <section className={`${cardBase} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <ArrowDownUp className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Processar conciliação</p>
            <p className="text-xs text-white/45">
              {sistemaFile && extratoFile
                ? "Ambos os arquivos carregados — pronto para processar"
                : "Importe os dois arquivos acima para iniciar"}
            </p>
          </div>
        </div>

        <button
          disabled={!sistemaFile || !extratoFile}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/12 px-6 text-sm font-semibold text-primary shadow-[0_0_24px_-8px_hsl(var(--primary)/0.35)] transition-all duration-300 hover:bg-primary/18 disabled:pointer-events-none disabled:opacity-40"
        >
          <ArrowDownUp className="h-4 w-4" />
          Conciliar dados
        </button>
      </section>

      {/* ═══════════ FILTERS (placeholder) ═══════════ */}
      <section className={`${cardBase} p-5`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-white/45" />
            <h2 className="text-sm font-semibold tracking-[-0.02em] text-foreground">Filtros</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
            <CalendarDays className="h-3.5 w-3.5" />
            Período &amp; Status
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["Período inicial", "Período final", "Status", "Fornecedor"].map((label) => (
            <div key={label}>
              <label className="mb-1.5 block text-xs font-medium text-white/50">{label}</label>
              <div className="h-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 flex items-center text-sm text-white/30">
                Selecionar...
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ KPIs (placeholder) ═══════════ */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {placeholderKpis.map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={fadeUp}
            className={`${cardBase} flex items-center gap-4 p-5`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-white/50">{kpi.label}</p>
              <p className="text-xl font-semibold tracking-[-0.02em] text-foreground">{kpi.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══════════ RESULTS TABLE (empty state) ═══════════ */}
      <section className={`${cardBase} p-5`}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em] text-foreground">
              Resultado da conciliação
            </h2>
            <p className="mt-0.5 text-sm text-white/55">
              A tabela abaixo exibirá o cruzamento entre os dados do sistema e o extrato bancário.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type="text"
                placeholder="Buscar título..."
                disabled
                className="h-10 w-56 rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm text-white/70 placeholder:text-white/30 transition-colors focus:border-primary/40 focus:outline-none disabled:opacity-50"
              />
            </div>

            <button
              disabled
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.06] disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* ── table header ── */}
        <div className="overflow-hidden rounded-2xl border border-white/8">
          <div className="grid grid-cols-[1fr_1fr_120px_120px_100px] gap-px bg-white/[0.04] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
            <span>Fornecedor</span>
            <span>Descrição</span>
            <span className="text-right">Valor Sistema</span>
            <span className="text-right">Valor Extrato</span>
            <span className="text-center">Status</span>
          </div>

          {/* ── empty state ── */}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <Table2 className="h-8 w-8 text-white/25" />
            </div>
            <p className="text-sm font-medium text-white/50">Nenhum dado para exibir</p>
            <p className="mt-1 max-w-xs text-xs text-white/35">
              Importe o relatório do sistema e o extrato bancário e clique em "Conciliar dados" para
              visualizar os resultados aqui.
            </p>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default ContasAPagar;
