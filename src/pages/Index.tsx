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
    color: "#8EA6FF",
  },
  {
    key: "historico",
    title: "Histórico",
    description: "Registros de processamentos realizados",
    icon: History,
    path: "/historico",
    color: "#67B3FF",
  },
  {
    key: "conciliacao",
    title: "NF-e / NFS-e",
    description: "Conciliação fiscal de notas",
    icon: FileSearch,
    path: "/conciliacao",
    color: "#67D79A",
  },
  {
    key: "abastecimento",
    title: "Abastecimento",
    description: "Registro e controle de abastecimentos",
    icon: Fuel,
    path: "/abastecimento",
    color: "#F0B35E",
  },
  {
    key: "medias-abastecimento",
    title: "Médias de Abastecimento",
    description: "Dashboard executivo de consumo e eficiência",
    icon: BarChart3,
    path: "/medias-abastecimento",
    color: "#B18CFF",
  },
  {
    key: "clientes",
    title: "Clientes",
    description: "Gestão e processamento por cliente",
    icon: Building2,
    path: "/clientes",
    color: "#47D1BC",
  },
  {
    key: "configuracoes",
    title: "Configurações",
    description: "Preferências e ajustes do sistema",
    icon: Settings,
    path: "/configuracoes",
    color: "#FF7F7F",
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
const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: {
    delay,
    duration: 0.45,
    ease: EASE as unknown as [number, number, number, number],
  },
});

/* ── Helper card component ───────────────────────── */
interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  delay?: number;
}

const MetricCard = ({ icon: Icon, label, value, color, delay = 0 }: MetricCardProps) => (
  <motion.div
    {...fadeUp(delay)}
    className="rounded-2xl border border-white/[0.05] bg-[#111216] p-5 transition-all hover:bg-[#14151a]"
  >
    <div className="mb-4 flex items-center justify-between">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: `${color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>

      {typeof value === "number" && value > 0 && (
        <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/50">
          <TrendingUp className="h-3 w-3" />
          ativo
        </div>
      )}
    </div>

    <p className="text-2xl font-semibold tracking-[-0.04em] text-white">{value}</p>
    <p className="mt-1 text-xs text-white/40">{label}</p>
  </motion.div>
);

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
      color: "#8EA6FF",
    });

    if (canView("historico") || isMaster) {
      cards.push({
        icon: FileSpreadsheet,
        label: "Planilhas processadas",
        value: stats.totalPlanilhas,
        color: "#67B3FF",
        moduleKey: "historico",
      });

      cards.push({
        icon: Hash,
        label: "Documentos gerados",
        value: stats.totalDocumentos,
        color: "#67D79A",
        moduleKey: "historico",
      });

      cards.push({
        icon: DollarSign,
        label: "Valor total processado",
        value: formatCurrency(stats.valorTotalProcessado),
        color: "#F0B35E",
        moduleKey: "historico",
      });
    }

    return cards;
  }, [accessibleModules.length, stats, canView, isMaster]);

  if (permLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/70" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header refinado */}
      <motion.section {...fadeUp(0)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.03]">
                  <GreetingIcon className="h-5 w-5 text-[#8EA6FF]" />
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-[26px] font-semibold tracking-[-0.05em] text-white">
                    {greeting}, <span className="text-[#8EA6FF]">{firstName}</span>
                  </h1>
                  <p className="mt-1 text-sm capitalize text-white/40">{today}</p>
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm text-white/70">
                Ambiente: Produção
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm text-white/70">
                {isMaster ? "Master" : "Usuário"}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Cards de resumo */}
      {summaryCards.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card, i) => (
            <MetricCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              color={card.color}
              delay={0.06 + i * 0.05}
            />
          ))}
        </section>
      )}

      {/* Grid principal */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_380px]">
        {/* Atividade recente */}
        <motion.section
          {...fadeUp(0.18)}
          className="flex flex-col overflow-hidden rounded-[28px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(18,20,26,0.95)_0%,rgba(14,16,21,0.97)_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
        >
          <div className="border-b border-white/[0.06] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.03]">
                <Activity className="h-4 w-4 text-white/62" />
              </div>

              <div>
                <h2 className="text-[15px] font-semibold text-white">Atividade recente</h2>
                <p className="mt-0.5 text-xs text-white/42">Últimos processamentos registrados</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {recentRecords.length === 0 ? (
              <div className="py-12 text-center">
                <Clock className="mx-auto mb-3 h-7 w-7 text-white/22" />
                <p className="text-sm text-white/56">Nenhuma atividade registrada ainda.</p>
                <p className="mt-1 text-xs text-white/34">
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
                    delay: 0.24 + i * 0.06,
                    duration: 0.35,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.03]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background:
                          record.statusConferencia === "confere"
                            ? "rgba(103,215,154,0.12)"
                            : "rgba(255,127,127,0.12)",
                      }}
                    >
                      {record.statusConferencia === "confere" ? (
                        <CheckCircle2 className="h-4 w-4 text-[#67D79A]" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-[#FF7F7F]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-relaxed text-white/88">
                        {record.cliente} — {record.quantidadeDocumentos} documento
                        {record.quantidadeDocumentos !== 1 ? "s" : ""}
                      </p>

                      <div className="mt-2 flex items-center gap-3">
                        <p className="flex items-center gap-1 text-[11px] text-white/38">
                          <Clock className="h-3 w-3" />
                          {formatDate(record.dataProcessamento)}
                        </p>

                        <p className="text-[11px] font-semibold tabular-nums text-[#B9C7FF]">
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
            <div className="border-t border-white/[0.06] px-5 py-4">
              <button
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] text-[13px] font-medium text-white/72 transition-all hover:bg-white/[0.05] hover:text-white"
                onClick={() => navigate("/historico")}
              >
                <History className="h-4 w-4" />
                Ver histórico completo
              </button>
            </div>
          )}
        </motion.section>

        {/* Módulos */}
        <motion.section
          {...fadeUp(0.24)}
          className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(18,20,26,0.95)_0%,rgba(14,16,21,0.97)_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.03]">
                <Layers className="h-4 w-4 text-white/62" />
              </div>

              <div>
                <h2 className="text-[15px] font-semibold text-white">Seus módulos</h2>
                <p className="mt-0.5 text-xs text-white/42">
                  {accessibleModules.length} módulo{accessibleModules.length !== 1 ? "s" : ""} disponível
                  {accessibleModules.length !== 1 ? "eis" : ""}
                </p>
              </div>
            </div>
          </div>

          {accessibleModules.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-white/22" />
              <p className="text-sm text-white/56">Nenhum módulo disponível para sua conta.</p>
              <p className="mt-1 text-xs text-white/34">Entre em contato com o administrador.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {accessibleModules.map((mod, i) => (
                <motion.button
                  key={mod.key}
                  type="button"
                  onClick={() => navigate(mod.path)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.32 + i * 0.04, duration: 0.35 }}
                  className="group flex w-full items-center gap-4 px-6 py-4 text-left transition-all hover:bg-white/[0.025]"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.04]"
                    style={{ background: `${mod.color}14` }}
                  >
                    <mod.icon className="h-5 w-5" style={{ color: mod.color }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-white transition-colors group-hover:text-[#B9C7FF]">
                      {mod.title}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-white/40">
                      {mod.description}
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-white/22 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#8EA6FF]" />
                </motion.button>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default Index;