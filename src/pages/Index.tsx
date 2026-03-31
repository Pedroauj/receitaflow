import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  color: string;
  masterOnly?: boolean;
}

const MODULE_REGISTRY: ModuleDef[] = [
  {
    key: "dashboard",
    title: "Dashboard",
    description: "Visão geral e métricas do sistema",
    icon: LayoutDashboard,
    path: "/dashboard",
    color: "#C6A35B",
  },
  {
    key: "historico",
    title: "Histórico",
    description: "Registros de processamentos realizados",
    icon: History,
    path: "/historico",
    color: "#6C8DB8",
  },
  {
    key: "conciliacao",
    title: "NF-e / NFS-e",
    description: "Conciliação fiscal de notas",
    icon: FileSearch,
    path: "/conciliacao",
    color: "#4E9A6E",
  },
  {
    key: "abastecimento",
    title: "Abastecimento",
    description: "Registro e controle de abastecimentos",
    icon: Fuel,
    path: "/abastecimento",
    color: "#C48B3A",
  },
  {
    key: "medias-abastecimento",
    title: "Médias de Abastecimento",
    description: "Dashboard executivo de consumo e eficiência",
    icon: BarChart3,
    path: "/medias-abastecimento",
    color: "#8E78BF",
  },
  {
    key: "clientes",
    title: "Clientes",
    description: "Gestão e processamento por cliente",
    icon: Building2,
    path: "/clientes",
    color: "#48A690",
  },
  {
    key: "configuracoes",
    title: "Configurações",
    description: "Preferências e ajustes do sistema",
    icon: Settings,
    path: "/configuracoes",
    color: "#C56B6B",
  },
];

/* ── Formatters ──────────────────────────────────── */
const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

/* ── Animation presets ───────────────────────────── */
const EASE = [0.16, 1, 0.3, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14, filter: "blur(4px)" } as const,
  animate: { opacity: 1, y: 0, filter: "blur(0px)" } as const,
  transition: {
    delay,
    duration: 0.5,
    ease: EASE as unknown as [number, number, number, number],
  },
});

/* ── Helpers ─────────────────────────────────────── */
const PAGE_BG = "#F6F4EE";
const CARD_BG = "#FFFFFF";
const CARD_BG_SOFT = "#FBFAF7";
const BORDER = "rgba(24, 24, 27, 0.08)";
const BORDER_STRONG = "rgba(24, 24, 27, 0.12)";
const TEXT = "#171717";
const TEXT_SOFT = "#6B6B74";
const GOLD = "#C6A35B";

/* ── Component ───────────────────────────────────── */
const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canView, isMaster, loading: permLoading } = useModulePermissions();

  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, full_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfileName(data.display_name || data.full_name || null);
        }
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

  const today = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const accessibleModules = useMemo(() => {
    if (permLoading) return [];
    return MODULE_REGISTRY.filter((mod) => {
      if (mod.masterOnly && !isMaster) return false;
      return canView(mod.key);
    });
  }, [permLoading, canView, isMaster]);

  const stats = getStats();
  const records = getRecords();
  const recentRecords = records.slice(0, 5);

  const summaryCards = useMemo(() => {
    const cards: {
      icon: LucideIcon;
      label: string;
      value: string | number;
      color: string;
      moduleKey?: string;
    }[] = [];

    cards.push({
      icon: Layers,
      label: "Módulos liberados",
      value: accessibleModules.length,
      color: GOLD,
    });

    if (canView("historico") || isMaster) {
      cards.push({
        icon: FileSpreadsheet,
        label: "Planilhas processadas",
        value: stats.totalPlanilhas,
        color: "#6C8DB8",
        moduleKey: "historico",
      });
      cards.push({
        icon: Hash,
        label: "Documentos gerados",
        value: stats.totalDocumentos,
        color: "#4E9A6E",
        moduleKey: "historico",
      });
      cards.push({
        icon: DollarSign,
        label: "Valor total processado",
        value: formatCurrency(stats.valorTotalProcessado),
        color: "#C48B3A",
        moduleKey: "historico",
      });
    }

    return cards;
  }, [accessibleModules, stats, canView, isMaster]);

  if (permLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="flex items-center gap-3 rounded-2xl border px-4 py-3"
          style={{
            background: CARD_BG,
            borderColor: BORDER,
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
          }}
        >
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: GOLD }} />
          <span className="text-sm font-medium" style={{ color: TEXT_SOFT }}>
            Carregando painel...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <style>
        {`
          .hybrid-page-shell {
            position: relative;
            border-radius: 32px;
            background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(250,248,242,0.98) 100%);
            border: 1px solid rgba(24,24,27,0.06);
            box-shadow:
              0 24px 60px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255,255,255,0.55);
            overflow: hidden;
          }

          .hybrid-page-shell::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
              radial-gradient(circle at top right, rgba(198,163,91,0.08), transparent 26%),
              radial-gradient(circle at top left, rgba(255,255,255,0.58), transparent 24%);
          }

          .hybrid-card {
            position: relative;
            overflow: hidden;
            border-radius: 22px;
            background: #FFFFFF;
            border: 1px solid rgba(24,24,27,0.07);
            box-shadow:
              0 10px 24px rgba(15, 23, 42, 0.05),
              inset 0 1px 0 rgba(255,255,255,0.7);
            transition:
              transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1),
              border-color 220ms cubic-bezier(0.16, 1, 0.3, 1),
              background-color 220ms cubic-bezier(0.16, 1, 0.3, 1);
          }

          .hybrid-card::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            border-radius: inherit;
            background: linear-gradient(
              180deg,
              rgba(255,255,255,0.55) 0%,
              rgba(255,255,255,0.12) 28%,
              rgba(255,255,255,0) 100%
            );
          }

          .hybrid-card:hover {
            transform: translateY(-2px);
            border-color: rgba(24,24,27,0.10);
            box-shadow:
              0 18px 34px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255,255,255,0.78);
          }

          .hybrid-soft {
            background: #FBFAF7;
            border: 1px solid rgba(24,24,27,0.06);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
          }
        `}
      </style>

      <div className="hybrid-page-shell px-5 py-5 md:px-6 md:py-6 lg:px-7 lg:py-7" style={{ backgroundColor: PAGE_BG }}>
        {/* ════════ Header ════════ */}
        <motion.div {...fadeUp(0)}>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                  style={{
                    background: "linear-gradient(180deg, rgba(198,163,91,0.14) 0%, rgba(198,163,91,0.07) 100%)",
                    borderColor: "rgba(198,163,91,0.16)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                  }}
                >
                  <GreetingIcon className="h-5 w-5" style={{ color: GOLD }} />
                </div>

                <div className="min-w-0">
                  <h1
                    className="text-[26px] font-semibold leading-tight tracking-[-0.03em]"
                    style={{ color: TEXT }}
                  >
                    {greeting}, <span style={{ color: GOLD }}>{firstName}</span>
                  </h1>
                  <p
                    className="mt-1 text-sm capitalize"
                    style={{ color: TEXT_SOFT }}
                  >
                    {today}
                  </p>
                </div>
              </div>

              <p className="mt-3 pl-[56px] text-xs" style={{ color: TEXT_SOFT }}>
                Visão geral dos módulos e atalhos disponíveis de acordo com seu acesso.
              </p>
            </div>

            <div
              className="hybrid-soft inline-flex h-10 items-center rounded-full px-4 text-[12px] font-medium"
              style={{ color: GOLD }}
            >
              Painel executivo
            </div>
          </div>
        </motion.div>

        {/* ════════ Summary Cards ════════ */}
        {summaryCards.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card, i) => (
              <motion.div
                key={card.label}
                {...fadeUp(0.06 + i * 0.05)}
                className="hybrid-card group cursor-default p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover:scale-[1.04]"
                    style={{
                      background: `${card.color}12`,
                      borderColor: `${card.color}22`,
                    }}
                  >
                    <card.icon className="h-[18px] w-[18px]" style={{ color: card.color }} />
                  </div>

                  {typeof card.value === "number" && card.value > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        background: "rgba(198,163,91,0.10)",
                        color: GOLD,
                        border: "1px solid rgba(198,163,91,0.14)",
                      }}
                    >
                      <TrendingUp className="h-3 w-3" />
                      ativo
                    </span>
                  )}
                </div>

                <p
                  className="text-[28px] font-bold leading-none tracking-[-0.04em]"
                  style={{ color: TEXT }}
                >
                  {card.value}
                </p>
                <p
                  className="mt-2 text-[12px] font-medium"
                  style={{ color: TEXT_SOFT }}
                >
                  {card.label}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ════════ Quick Links ════════ */}
        {accessibleModules.length > 0 && (
          <motion.section {...fadeUp(0.25)} className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: GOLD }} />
              <h2 className="text-[15px] font-semibold" style={{ color: TEXT }}>
                Atalhos rápidos
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {accessibleModules.map((mod, i) => (
                <motion.button
                  key={mod.key}
                  type="button"
                  onClick={() => navigate(mod.path)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.28 + i * 0.04,
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="hybrid-card group/link p-5 text-left active:scale-[0.98]"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover/link:scale-[1.06]"
                      style={{
                        background: `${mod.color}12`,
                        borderColor: `${mod.color}20`,
                      }}
                    >
                      <mod.icon className="h-5 w-5" style={{ color: mod.color }} />
                    </div>

                    <ArrowRight
                      className="mt-1 h-4 w-4 transition-all duration-200 group-hover/link:translate-x-0.5"
                      style={{ color: "rgba(23,23,23,0.28)" }}
                    />
                  </div>

                  <h3
                    className="text-[13px] font-semibold transition-colors"
                    style={{ color: TEXT }}
                  >
                    {mod.title}
                  </h3>
                  <p
                    className="mt-1 line-clamp-2 text-[11px] leading-relaxed"
                    style={{ color: TEXT_SOFT }}
                  >
                    {mod.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* ════════ Bottom grid: Modules + Activity ════════ */}
        <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_380px]">
          {/* ── Seus módulos ── */}
          <motion.div {...fadeUp(0.35)} className="hybrid-card overflow-hidden">
            <div
              className="flex items-center justify-between border-b px-6 py-5"
              style={{ borderColor: BORDER }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                  style={{
                    background: CARD_BG_SOFT,
                    borderColor: BORDER,
                  }}
                >
                  <Layers className="h-4 w-4" style={{ color: TEXT_SOFT }} />
                </div>

                <div>
                  <h2 className="text-[15px] font-semibold" style={{ color: TEXT }}>
                    Seus módulos
                  </h2>
                  <p className="mt-0.5 text-xs" style={{ color: TEXT_SOFT }}>
                    {accessibleModules.length} módulo
                    {accessibleModules.length !== 1 ? "s" : ""} disponíve
                    {accessibleModules.length !== 1 ? "is" : "l"}
                  </p>
                </div>
              </div>
            </div>

            {accessibleModules.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <AlertCircle
                  className="mx-auto mb-3 h-8 w-8"
                  style={{ color: "rgba(23,23,23,0.25)" }}
                />
                <p className="text-sm" style={{ color: TEXT_SOFT }}>
                  Nenhum módulo disponível para sua conta.
                </p>
                <p className="mt-1 text-xs" style={{ color: "rgba(107,107,116,0.75)" }}>
                  Entre em contato com o administrador.
                </p>
              </div>
            ) : (
              <div style={{ borderTop: "none" }}>
                {accessibleModules.map((mod, i) => (
                  <motion.button
                    key={mod.key}
                    type="button"
                    onClick={() => navigate(mod.path)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.04, duration: 0.4 }}
                    className="group/mod flex w-full items-center gap-4 px-6 py-4 text-left transition-all duration-150 active:scale-[0.995]"
                    style={{
                      borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(250,248,242,0.9)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover/mod:scale-[1.04]"
                      style={{
                        background: `${mod.color}12`,
                        borderColor: `${mod.color}20`,
                      }}
                    >
                      <mod.icon className="h-5 w-5" style={{ color: mod.color }} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-[13px] font-semibold"
                        style={{ color: TEXT }}
                      >
                        {mod.title}
                      </p>
                      <p
                        className="mt-0.5 truncate text-[11px]"
                        style={{ color: TEXT_SOFT }}
                      >
                        {mod.description}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: "rgba(78,154,110,0.10)",
                          color: "#4E9A6E",
                          border: "1px solid rgba(78,154,110,0.12)",
                        }}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Disponível
                      </span>

                      <ArrowRight
                        className="h-4 w-4 transition-all duration-200 group-hover/mod:translate-x-0.5"
                        style={{ color: "rgba(23,23,23,0.28)" }}
                      />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Activity Feed ── */}
          <motion.div
            {...fadeUp(0.4)}
            className="hybrid-card flex flex-col overflow-hidden"
          >
            <div className="border-b px-6 py-5" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                  style={{
                    background: CARD_BG_SOFT,
                    borderColor: BORDER,
                  }}
                >
                  <Activity className="h-4 w-4" style={{ color: TEXT_SOFT }} />
                </div>

                <div>
                  <h2 className="text-[15px] font-semibold" style={{ color: TEXT }}>
                    Atividade recente
                  </h2>
                  <p className="mt-0.5 text-xs" style={{ color: TEXT_SOFT }}>
                    Últimos processamentos
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
              {recentRecords.length === 0 ? (
                <div className="py-10 text-center">
                  <Clock
                    className="mx-auto mb-3 h-7 w-7"
                    style={{ color: "rgba(23,23,23,0.24)" }}
                  />
                  <p className="text-sm" style={{ color: TEXT_SOFT }}>
                    Nenhuma atividade registrada ainda.
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "rgba(107,107,116,0.75)" }}>
                    Processamentos aparecerão aqui automaticamente.
                  </p>
                </div>
              ) : (
                recentRecords.map((record, i) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.5 + i * 0.06,
                      duration: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="rounded-2xl border p-3.5 transition-all duration-200"
                    style={{
                      background: CARD_BG_SOFT,
                      borderColor: BORDER,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#FFFFFF";
                      e.currentTarget.style.borderColor = BORDER_STRONG;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = CARD_BG_SOFT;
                      e.currentTarget.style.borderColor = BORDER;
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background:
                            record.statusConferencia === "confere"
                              ? "rgba(78,154,110,0.12)"
                              : "rgba(197,107,107,0.12)",
                        }}
                      >
                        {record.statusConferencia === "confere" ? (
                          <CheckCircle2 className="h-4 w-4" style={{ color: "#4E9A6E" }} />
                        ) : (
                          <AlertCircle className="h-4 w-4" style={{ color: "#C56B6B" }} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[13px] font-medium leading-relaxed"
                          style={{ color: TEXT }}
                        >
                          {record.cliente} — {record.quantidadeDocumentos} documento
                          {record.quantidadeDocumentos !== 1 ? "s" : ""}
                        </p>

                        <div className="mt-1.5 flex items-center gap-3">
                          <p
                            className="flex items-center gap-1 text-[11px]"
                            style={{ color: TEXT_SOFT }}
                          >
                            <Clock className="h-3 w-3" />
                            {formatDate(record.dataProcessamento)}
                          </p>

                          <p
                            className="tabular-nums text-[11px] font-semibold"
                            style={{ color: GOLD }}
                          >
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
              <div className="border-t px-5 py-4" style={{ borderColor: BORDER }}>
                <button
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border text-[13px] font-medium transition-all duration-150 active:scale-[0.97]"
                  style={{
                    background: CARD_BG_SOFT,
                    color: TEXT_SOFT,
                    borderColor: BORDER,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.color = TEXT;
                    e.currentTarget.style.borderColor = BORDER_STRONG;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = CARD_BG_SOFT;
                    e.currentTarget.style.color = TEXT_SOFT;
                    e.currentTarget.style.borderColor = BORDER;
                  }}
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
    </div>
  );
};

export default Index;