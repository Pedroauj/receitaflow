import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { motion } from "framer-motion";
import {
  LayoutDashboard, History, FileSearch, Fuel, Landmark,
  BarChart3, Building2, Settings, Sun, Moon, CloudSun,
  Sparkles, ArrowUpRight, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import { getRecords } from "@/lib/history";
import type { HistoryRecord } from "@/lib/history";
import type { LucideIcon } from "lucide-react";

// ─── Module registry ──────────────────────────────────────────────────────────

interface ModuleDef {
  key: string; title: string; description: string;
  icon: LucideIcon; path: string; color: string; masterOnly?: boolean;
}

const MODULE_REGISTRY: ModuleDef[] = [
  { key: "dashboard",           title: "Dashboard",               description: "Visão geral e métricas do sistema",              icon: LayoutDashboard, path: "/dashboard",            color: "#EF9F27" },
  { key: "historico",           title: "Histórico",               description: "Registros de processamentos realizados",          icon: History,         path: "/historico",            color: "#5B9BD5" },
  { key: "conciliacao",         title: "NF-e / NFS-e",            description: "Conciliação fiscal de notas",                     icon: FileSearch,      path: "/conciliacao",          color: "#4AAF60" },
  { key: "abastecimento",       title: "Abastecimento",           description: "Correção de XMLs de notas sem placa",             icon: Fuel,            path: "/abastecimento",        color: "#D4922A" },
  { key: "medias-abastecimento",title: "Médias de Abastecimento", description: "Dashboard executivo de consumo e eficiência",     icon: BarChart3,       path: "/medias-abastecimento", color: "#9B7BD4" },
  { key: "contas-a-pagar",      title: "Contas a Pagar",          description: "Conciliação de pagamentos com extratos bancários", icon: Landmark,        path: "/contas-a-pagar",       color: "#5B9BD5" },
  { key: "clientes",            title: "Clientes",                description: "Gestão e processamento por cliente",              icon: Building2,       path: "/clientes",             color: "#3BBFA0" },
  { key: "configuracoes",       title: "Configurações",           description: "Preferências e ajustes do sistema",               icon: Settings,        path: "/configuracoes",        color: "#D95F5F" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const EASE = [0.16, 1, 0.3, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14, filter: "blur(4px)" } as const,
  animate: { opacity: 1, y: 0, filter: "blur(0px)" } as const,
  transition: { delay, duration: 0.45, ease: EASE as unknown as [number, number, number, number] },
});

type Period = "semana" | "mes" | "ano";

function filterByPeriod(records: HistoryRecord[], period: Period): HistoryRecord[] {
  const now = new Date();
  return records.filter((r) => {
    const d = new Date(r.dataProcessamento);
    if (period === "semana") {
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }
    if (period === "mes") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return d.getFullYear() === now.getFullYear();
  });
}

// Agrupa records por mês e retorna até 12 barras
function groupByMonth(records: HistoryRecord[]): { label: string; value: number; height: number }[] {
  const map = new Map<string, number>();
  records.forEach((r) => {
    const d = new Date(r.dataProcessamento);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + r.valorTotal);
  });

  const sorted = Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12);

  const max = Math.max(...sorted.map(([, v]) => v), 1);
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  return sorted.map(([key, value]) => ({
    label: meses[parseInt(key.split("-")[1]) - 1],
    value,
    height: Math.max(8, Math.round((value / max) * 88)),
  }));
}

// Agrupa records por dia nos últimos 7 dias
function groupByDay(records: HistoryRecord[]): { label: string; value: number; height: number }[] {
  const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const now = new Date();
  const result = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const label = days[d.getDay()];
    const value = records
      .filter((r) => {
        const rd = new Date(r.dataProcessamento);
        return rd.toDateString() === d.toDateString();
      })
      .reduce((sum, r) => sum + r.valorTotal, 0);
    return { label, value, height: 0 };
  });
  const max = Math.max(...result.map((r) => r.value), 1);
  return result.map((r) => ({ ...r, height: Math.max(r.value > 0 ? 8 : 0, Math.round((r.value / max) * 88)) }));
}

// ─── Componente ───────────────────────────────────────────────────────────────

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canView, isMaster, loading: permLoading } = useModulePermissions();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("mes");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, full_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfileName(data.display_name || data.full_name || null);
      });
  }, [user]);

  const firstName =
    profileName?.split(" ")[0] ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Usuário";

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const GreetingIcon = hour < 12 ? Sun : hour < 18 ? CloudSun : Moon;

  const accessibleModules = useMemo(() => {
    if (permLoading) return [];
    return MODULE_REGISTRY.filter((mod) => {
      if (mod.masterOnly && !isMaster) return false;
      return canView(mod.key);
    });
  }, [permLoading, canView, isMaster]);

  const allRecords = getRecords();
  const filtered = useMemo(() => filterByPeriod(allRecords, period), [allRecords, period]);

  // Stats do período selecionado
  const totalValor = filtered.reduce((s, r) => s + r.valorTotal, 0);
  const totalDocs  = filtered.reduce((s, r) => s + r.quantidadeDocumentos, 0);
  const confere    = filtered.filter((r) => r.statusConferencia === "confere").length;
  const diverge    = filtered.filter((r) => r.statusConferencia === "diverge").length;

  // Stats globais (card esquerdo)
  const totalGlobal = allRecords.reduce((s, r) => s + r.valorTotal, 0);
  const docsGlobal  = allRecords.reduce((s, r) => s + r.quantidadeDocumentos, 0);

  // Gráfico de barras
  const bars = useMemo(() =>
    period === "semana" ? groupByDay(allRecords) : groupByMonth(allRecords),
    [allRecords, period]
  );

  // Últimos 4 registros para o mini-painel
  const recent4 = allRecords.slice(0, 4);

  // Datas extremas dos records filtrados
  const datas = filtered.map((r) => new Date(r.dataProcessamento)).sort((a, b) => a.getTime() - b.getTime());
  const dtInicio = datas.length > 0 ? datas[0].toLocaleDateString("pt-BR", { month: "long", year: "2-digit" }) : "—";
  const dtFim    = datas.length > 0 ? datas[datas.length - 1].toLocaleDateString("pt-BR", { month: "long", year: "2-digit" }) : "—";

  if (permLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <motion.section {...fadeUp(0)}>
        <div className="grid gap-5 xl:grid-cols-[1.02fr_1.48fr]">

          {/* ── Painel esquerdo ── */}
          <div className="rounded-[28px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(15,19,29,0.94),rgba(10,13,21,0.94))] p-7 shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10">
                <GreetingIcon className="h-5 w-5 text-violet-300" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Executive view
                </p>
                <p className="text-sm text-white/55">{greeting}, {firstName}</p>
              </div>
            </div>

            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.05em] text-foreground md:text-[46px]">
              Bem-vindo de volta,
              <br />
              <span className="bg-gradient-to-r from-violet-300 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>

            <p className="mt-5 text-[13px] uppercase tracking-[0.14em] text-white/40">
              Total processado
            </p>

            <div className="mt-2 flex items-end gap-3">
              <p className="text-[34px] font-black leading-none tracking-[-0.06em] text-foreground md:text-[48px]">
                {formatCurrency(totalGlobal)}
              </p>
            </div>

            {/* Stats globais */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Planilhas</p>
                <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">{allRecords.length}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Documentos</p>
                <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">{docsGlobal}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/historico")}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-bold text-[#111318] transition hover:opacity-90"
              >
                Histórico
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/clientes")}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 text-[13px] font-bold text-foreground transition hover:bg-white/[0.07]"
              >
                Clientes
              </button>
            </div>
          </div>

          {/* ── Painel direito ── */}
          <div className="rounded-[28px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(15,19,29,0.94),rgba(10,13,21,0.94))] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.28)]">

            {/* Filtro de período */}
            <div className="mb-4 flex items-center justify-end gap-2">
              {(["semana", "mes", "ano"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`h-8 rounded-full px-3 text-[12px] font-bold capitalize transition-all ${
                    period === p
                      ? "bg-white text-[#111318]"
                      : "border border-white/[0.06] bg-white/[0.04] text-white/70 hover:bg-white/[0.07]"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {/* Cards de stats do período */}
            <div className="grid h-[250px] grid-cols-[1fr_1fr_1.15fr_100px] overflow-hidden rounded-[22px] border border-white/[0.06]">

              {/* Valor do período */}
              <div className="border-r border-white/[0.05] p-4">
                <p className="text-[22px] font-black tracking-[-0.05em] text-foreground leading-tight">
                  {formatCurrency(totalValor)}
                </p>
                <p className="mt-2 text-[11px] text-white/50 uppercase tracking-[0.12em]">Valor</p>
                <p className="mt-5 text-[13px] text-white/60">{totalDocs} docs</p>
                <div className="mt-4 h-8 rounded-md bg-gradient-to-r from-violet-500 to-indigo-400 shadow-[0_0_20px_rgba(139,92,246,0.26)]" />
              </div>

              {/* Confere vs Diverge */}
              <div className="border-r border-white/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-white/40 mb-3">Status</p>

                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <p className="text-[22px] font-black tracking-[-0.04em] text-foreground">{confere}</p>
                </div>
                <p className="text-[11px] text-white/50 mb-4">Conferidos</p>

                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <p className="text-[18px] font-bold tracking-[-0.04em] text-white/70">{diverge}</p>
                </div>
                <p className="text-[11px] text-white/40">Divergentes</p>
              </div>

              {/* Gráfico de barras */}
              <div className="relative border-r border-white/[0.05] p-4">
                <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-white/[0.08] bg-[#272b35] px-3 py-1 text-[11px] font-bold text-white/70 whitespace-nowrap">
                  {period === "semana" ? "Por dia" : period === "mes" ? "Por mês" : "Por mês"}
                </div>

                {bars.length > 0 ? (
                  <div className="absolute bottom-5 left-4 right-4 flex h-[88px] items-end gap-1">
                    {bars.map((b, i) => (
                      <span
                        key={i}
                        title={`${b.label}: ${formatCurrency(b.value)}`}
                        className="flex-1 rounded-sm bg-gradient-to-b from-violet-400 to-indigo-600 transition-all duration-300"
                        style={{ height: `${b.height}px`, minWidth: 0 }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-[11px] text-white/30">Sem dados</p>
                  </div>
                )}
              </div>

              {/* Últimos clientes */}
              <div className="relative p-3 overflow-hidden">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/40 mb-2">Recentes</p>
                {recent4.length > 0 ? (
                  <div className="space-y-2">
                    {recent4.map((r, i) => (
                      <div key={r.id} className="flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ background: i % 2 === 0 ? "#8b5cf6" : "#6366f1" }}
                        />
                        <p className="truncate text-[10px] text-white/60">{r.cliente}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-white/30 mt-4">Nenhum</p>
                )}
              </div>
            </div>

            {/* Datas do período */}
            <div className="mt-3 flex items-center justify-between text-[12px] text-white/35">
              <span>{filtered.length > 0 ? dtInicio : "—"}</span>
              <span className="text-white/20">{filtered.length} registros</span>
              <span>{filtered.length > 0 ? dtFim : "—"}</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Atalhos rápidos ── */}
      {accessibleModules.length > 0 && (
        <motion.section {...fadeUp(0.12)}>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <h2 className="text-[16px] font-semibold text-foreground">Atalhos rápidos</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {accessibleModules.map((mod, i) => (
              <motion.button
                key={mod.key}
                type="button"
                onClick={() => navigate(mod.path)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(15,19,29,0.94),rgba(10,13,21,0.94))] p-5 text-left shadow-[0_16px_38px_rgba(0,0,0,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.10]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_35%)]" />
                <div className="relative z-10">
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ background: `${mod.color}18` }}
                    >
                      <mod.icon className="h-5 w-5" style={{ color: mod.color }} />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-white/35 transition-all duration-200 group-hover:text-violet-400" />
                  </div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-foreground">{mod.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/50">{mod.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default Index;
