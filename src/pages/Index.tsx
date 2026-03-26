import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  History,
  FileSearch,
  Fuel,
  BarChart3,
  Building2,
  Settings,
  ArrowRight,
  Sun,
  Moon,
  CloudSun,
  Sparkles,
  FileSpreadsheet,
  Hash,
  DollarSign,
  Clock,
  Activity,
  Layers,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getStats, getRecords } from "@/lib/history";
import type { LucideIcon } from "lucide-react";

/* ── Module registry ─────────────────────────────── */
interface ModuleDef {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  color: string;        // hex accent for the module
  masterOnly?: boolean;
}

const MODULE_REGISTRY: ModuleDef[] = [
  { key: "dashboard", title: "Dashboard", description: "Visão geral e métricas do sistema", icon: LayoutDashboard, path: "/dashboard", color: "#EF9F27" },
  { key: "historico", title: "Histórico", description: "Registros de processamentos realizados", icon: History, path: "/historico", color: "#5B9BD5" },
  { key: "conciliacao", title: "NF-e / NFS-e", description: "Conciliação fiscal de notas", icon: FileSearch, path: "/conciliacao", color: "#4AAF60" },
  { key: "abastecimento", title: "Abastecimento", description: "Registro e controle de abastecimentos", icon: Fuel, path: "/abastecimento", color: "#D4922A" },
  { key: "medias-abastecimento", title: "Médias de Abastecimento", description: "Dashboard executivo de consumo e eficiência", icon: BarChart3, path: "/medias-abastecimento", color: "#9B7BD4" },
  { key: "clientes", title: "Clientes", description: "Gestão e processamento por cliente", icon: Building2, path: "/clientes", color: "#3BBFA0" },
  { key: "configuracoes", title: "Configurações", description: "Preferências e ajustes do sistema", icon: Settings, path: "/configuracoes", color: "#D95F5F" },
];

/* ── Formatters ──────────────────────────────────── */
const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
};

/* ── Animation presets ───────────────────────────── */
const EASE = [0.16, 1, 0.3, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14, filter: "blur(4px)" } as const,
  animate: { opacity: 1, y: 0, filter: "blur(0px)" } as const,
  transition: { delay, duration: 0.5, ease: EASE as unknown as [number, number, number, number] },
});

/* ── Component ───────────────────────────────────── */
const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canView, isMaster, loading: permLoading } = useModulePermissions();

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Usuário";

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const GreetingIcon = hour < 12 ? Sun : hour < 18 ? CloudSun : Moon;

  const today = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /* ── Permission-filtered modules ─── */
  const accessibleModules = useMemo(() => {
    if (permLoading) return [];
    return MODULE_REGISTRY.filter((mod) => {
      if (mod.masterOnly && !isMaster) return false;
      return canView(mod.key);
    });
  }, [permLoading, canView, isMaster]);

  /* ── Stats from history ─── */
  const stats = getStats();
  const records = getRecords();
  const recentRecords = records.slice(0, 5);

  /* ── Summary cards (only shown if user has relevant access) ─── */
  const summaryCards = useMemo(() => {
    const cards: { icon: LucideIcon; label: string; value: string | number; color: string; moduleKey?: string }[] = [];

    cards.push({
      icon: Layers,
      label: "Módulos liberados",
      value: accessibleModules.length,
      color: "#EF9F27",
    });

    if (canView("historico") || isMaster) {
      cards.push({
        icon: FileSpreadsheet,
        label: "Planilhas processadas",
        value: stats.totalPlanilhas,
        color: "#5B9BD5",
        moduleKey: "historico",
      });
      cards.push({
        icon: Hash,
        label: "Documentos gerados",
        value: stats.totalDocumentos,
        color: "#4AAF60",
        moduleKey: "historico",
      });
      cards.push({
        icon: DollarSign,
        label: "Valor total processado",
        value: formatCurrency(stats.valorTotalProcessado),
        color: "#D4922A",
        moduleKey: "historico",
      });
    }

    return cards;
  }, [accessibleModules, stats, canView, isMaster]);

  /* ── Loading state ─── */
  if (permLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ════════ Header ════════ */}
      <motion.div {...fadeUp(0)}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(250,199,117,0.12)" }}
            >
              <GreetingIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                {greeting}, <span className="text-primary">{firstName}</span>
              </h1>
              <p className="text-sm text-muted-foreground capitalize">{today}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 pl-[52px]">
            Visão geral dos módulos e atalhos disponíveis de acordo com seu acesso.
          </p>
        </div>
      </motion.div>

      {/* ════════ Summary Cards ════════ */}
      {summaryCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              {...fadeUp(0.06 + i * 0.05)}
              className="group rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/10 cursor-default"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                  style={{ background: `${card.color}18` }}
                >
                  <card.icon className="h-[18px] w-[18px]" style={{ color: card.color }} />
                </div>
                {typeof card.value === "number" && card.value > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 bg-primary/10 text-primary">
                    <TrendingUp className="h-3 w-3" />
                    ativo
                  </span>
                )}
              </div>
              <p className="text-[26px] font-bold tracking-tight leading-none text-foreground">
                {card.value}
              </p>
              <p className="text-[12px] text-muted-foreground mt-2 font-medium">{card.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* ════════ Quick Links ════════ */}
      {accessibleModules.length > 0 && (
        <motion.section {...fadeUp(0.25)}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-semibold text-foreground">Atalhos rápidos</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {accessibleModules.map((mod, i) => (
              <motion.button
                key={mod.key}
                type="button"
                onClick={() => navigate(mod.path)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="group/link text-left rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-black/10 active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover/link:scale-110"
                    style={{ background: `${mod.color}15` }}
                  >
                    <mod.icon className="h-5 w-5" style={{ color: mod.color }} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover/link:text-primary group-hover/link:translate-x-0.5 transition-all duration-200 mt-1" />
                </div>
                <h3 className="text-[13px] font-semibold text-foreground group-hover/link:text-primary transition-colors">
                  {mod.title}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  {mod.description}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {/* ════════ Bottom grid: Modules + Activity ════════ */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_380px]">
        {/* ── Seus módulos ── */}
        <motion.div
          {...fadeUp(0.35)}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="px-6 py-5 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center">
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Seus módulos</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {accessibleModules.length} módulo{accessibleModules.length !== 1 ? "s" : ""} disponíve{accessibleModules.length !== 1 ? "is" : "l"}
                </p>
              </div>
            </div>
          </div>

          {accessibleModules.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum módulo disponível para sua conta.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Entre em contato com o administrador.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {accessibleModules.map((mod, i) => (
                <motion.button
                  key={mod.key}
                  type="button"
                  onClick={() => navigate(mod.path)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.04, duration: 0.4 }}
                  className="w-full px-6 py-4 text-left transition-all duration-150 hover:bg-accent/50 active:scale-[0.995] group/mod flex items-center gap-4"
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover/mod:scale-105"
                    style={{ background: `${mod.color}15` }}
                  >
                    <mod.icon className="h-5 w-5" style={{ color: mod.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground group-hover/mod:text-primary transition-colors truncate">
                      {mod.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">
                      {mod.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-[hsl(142,40%,40%)]/10 text-[hsl(142,50%,60%)]">
                      <CheckCircle2 className="h-3 w-3" />
                      Disponível
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover/mod:text-primary group-hover/mod:translate-x-0.5 transition-all duration-200" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Activity Feed ── */}
        <motion.div
          {...fadeUp(0.4)}
          className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center">
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Atividade recente</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Últimos processamentos</p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-5 py-4 space-y-2.5 overflow-y-auto">
            {recentRecords.length === 0 ? (
              <div className="py-10 text-center">
                <Clock className="h-7 w-7 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Processamentos aparecerão aqui automaticamente.
                </p>
              </div>
            ) : (
              recentRecords.map((record, i) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-xl border border-border/40 p-3.5 transition-all duration-200 hover:bg-accent/40 hover:border-border/70 cursor-default"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: record.statusConferencia === "confere"
                          ? "rgba(74,175,96,0.12)"
                          : "rgba(217,95,95,0.12)",
                      }}
                    >
                      {record.statusConferencia === "confere" ? (
                        <CheckCircle2 className="h-4 w-4" style={{ color: "#4AAF60" }} />
                      ) : (
                        <AlertCircle className="h-4 w-4" style={{ color: "#D95F5F" }} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-foreground/90 leading-relaxed font-medium">
                        {record.cliente} — {record.quantidadeDocumentos} documento{record.quantidadeDocumentos !== 1 ? "s" : ""}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(record.dataProcessamento)}
                        </p>
                        <p className="text-[11px] font-semibold text-primary tabular-nums">
                          {formatCurrency(record.valorTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {(canView("historico") || isMaster) && recentRecords.length > 0 && (
            <div className="px-5 py-4 border-t border-border">
              <button
                className="w-full h-10 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-all duration-150 bg-accent text-muted-foreground border border-border hover:text-foreground hover:border-border/80 active:scale-[0.97]"
                onClick={() => navigate("/historico")}
              >
                <History className="h-4 w-4" />
                Ver histórico completo
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
