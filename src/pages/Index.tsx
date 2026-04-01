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
  ShieldCheck,
} from "lucide-react";
import { getStats, getRecords } from "@/lib/history";
import type { LucideIcon } from "lucide-react";

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
    color: "#EF9F27",
  },
  {
    key: "historico",
    title: "Histórico",
    description: "Registros de processamentos realizados",
    icon: History,
    path: "/historico",
    color: "#5B9BD5",
  },
  {
    key: "conciliacao",
    title: "NF-e / NFS-e",
    description: "Conciliação fiscal de notas",
    icon: FileSearch,
    path: "/conciliacao",
    color: "#4AAF60",
  },
  {
    key: "abastecimento",
    title: "Abastecimento",
    description: "Registro e controle de abastecimentos",
    icon: Fuel,
    path: "/abastecimento",
    color: "#D4922A",
  },
  {
    key: "medias-abastecimento",
    title: "Médias de Abastecimento",
    description: "Dashboard executivo de consumo e eficiência",
    icon: BarChart3,
    path: "/medias-abastecimento",
    color: "#9B7BD4",
  },
  {
    key: "clientes",
    title: "Clientes",
    description: "Gestão e processamento por cliente",
    icon: Building2,
    path: "/clientes",
    color: "#3BBFA0",
  },
  {
    key: "configuracoes",
    title: "Configurações",
    description: "Preferências e ajustes do sistema",
    icon: Settings,
    path: "/configuracoes",
    color: "#D95F5F",
  },
];

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
      badge?: string;
    }[] = [];

    cards.push({
      icon: Layers,
      label: "Módulos liberados",
      value: accessibleModules.length,
      color: "#EF9F27",
      badge: "ativo",
    });

    if (canView("historico") || isMaster) {
      cards.push({
        icon: FileSpreadsheet,
        label: "Planilhas processadas",
        value: stats.totalPlanilhas,
        color: "#5B9BD5",
        badge: "fluxo",
      });
      cards.push({
        icon: Hash,
        label: "Documentos gerados",
        value: stats.totalDocumentos,
        color: "#4AAF60",
        badge: "volume",
      });
      cards.push({
        icon: DollarSign,
        label: "Valor total processado",
        value: formatCurrency(stats.valorTotalProcessado),
        color: "#D4922A",
        badge: "geral",
      });
    }

    return cards;
  }, [accessibleModules.length, canView, isMaster, stats]);

  if (permLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <motion.div {...fadeUp(0)}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_340px]">
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(16,21,32,0.92),rgba(11,15,23,0.92))] p-7 shadow-[0_18px_48px_rgba(0,0,0,0.26)]">
            <div className="pointer-events-none absolute inset-0">
              <div
                className="absolute left-[-30px] top-[-30px] h-[160px] w-[160px] rounded-full blur-3xl"
                style={{ background: "rgba(139,92,246,0.08)" }}
              />
              <div
                className="absolute right-[-20px] bottom-[-40px] h-[160px] w-[160px] rounded-full blur-3xl"
                style={{ background: "rgba(239,178,79,0.05)" }}
              />
            </div>

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: "rgba(239,178,79,0.12)" }}
                  >
                    <GreetingIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      Visão executiva
                    </p>
                    <p className="text-sm capitalize text-muted-foreground">{today}</p>
                  </div>
                </div>

                <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground md:text-5xl">
                  {greeting}, <span className="text-primary">{firstName}</span>
                </h1>

                <p className="mt-3 max-w-[700px] text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                  Aqui está um resumo dos módulos liberados, dos volumes processados e dos
                  atalhos principais disponíveis para sua conta.
                </p>
              </div>

              <div className="hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 lg:block">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-white/60">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Sistema operacional
                </div>
                <p className="mt-2 text-[18px] font-bold tracking-[-0.03em] text-foreground">
                  Ambiente estável
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-8">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/38">
                Valor total processado
              </p>
              <p className="mt-2 text-[34px] font-black leading-none tracking-[-0.06em] text-foreground sm:text-[48px] lg:text-[58px]">
                {formatCurrency(stats.valorTotalProcessado)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(16,21,32,0.92),rgba(11,15,23,0.92))] p-5 shadow-[0_16px_38px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white/50">Resumo do dia</p>
                  <h2 className="text-[18px] font-bold tracking-[-0.03em] text-foreground">
                    Operação ativa
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 py-3">
                  <span className="text-[13px] text-muted-foreground">Planilhas</span>
                  <span className="text-[14px] font-bold text-foreground">
                    {stats.totalPlanilhas}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 py-3">
                  <span className="text-[13px] text-muted-foreground">Documentos</span>
                  <span className="text-[14px] font-bold text-foreground">
                    {stats.totalDocumentos}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(16,21,32,0.92),rgba(11,15,23,0.92))] p-5 shadow-[0_16px_38px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white/50">Acesso atual</p>
                  <h2 className="text-[18px] font-bold tracking-[-0.03em] text-foreground">
                    {accessibleModules.length} módulo{accessibleModules.length !== 1 ? "s" : ""}
                  </h2>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Os atalhos e volumes abaixo respeitam exatamente as permissões da sua conta.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {summaryCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              {...fadeUp(0.06 + i * 0.05)}
              className="group relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(16,21,32,0.92),rgba(11,15,23,0.92))] p-5 shadow-[0_16px_38px_rgba(0,0,0,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.10]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_35%)]" />

              <div className="relative z-10">
                <div className="mb-5 flex items-center justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
                    style={{ background: `${card.color}18` }}
                  >
                    <card.icon className="h-[18px] w-[18px]" style={{ color: card.color }} />
                  </div>

                  {card.badge && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/56">
                      {card.badge}
                    </span>
                  )}
                </div>

                <p className="text-[12px] font-medium text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-[30px] font-black leading-none tracking-[-0.05em] text-foreground">
                  {card.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {accessibleModules.length > 0 && (
        <motion.section {...fadeUp(0.24)}>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
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
                transition={{
                  delay: 0.28 + i * 0.04,
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group/link relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(16,21,32,0.92),rgba(11,15,23,0.92))] p-5 text-left shadow-[0_16px_38px_rgba(0,0,0,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.10]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_35%)]" />

                <div className="relative z-10">
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 group-hover/link:scale-105"
                      style={{ background: `${mod.color}15` }}
                    >
                      <mod.icon className="h-5 w-5" style={{ color: mod.color }} />
                    </div>

                    <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground/35 transition-all duration-200 group-hover/link:translate-x-0.5 group-hover/link:text-primary" />
                  </div>

                  <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover/link:text-primary">
                    {mod.title}
                  </h3>

                  <p className="mt-2 max-w-[92%] text-[13px] leading-relaxed text-muted-foreground">
                    {mod.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <motion.div
          {...fadeUp(0.35)}
          className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(16,21,32,0.92),rgba(11,15,23,0.92))] shadow-[0_16px_38px_rgba(0,0,0,0.22)]"
        >
          <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Seus módulos</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {accessibleModules.length} módulo
                  {accessibleModules.length !== 1 ? "s" : ""} disponível
                  {accessibleModules.length !== 1 ? "is" : ""}
                </p>
              </div>
            </div>
          </div>

          {accessibleModules.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nenhum módulo disponível para sua conta.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Entre em contato com o administrador.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {accessibleModules.map((mod, i) => (
                <motion.button
                  key={mod.key}
                  type="button"
                  onClick={() => navigate(mod.path)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.04, duration: 0.4 }}
                  className="group/mod flex w-full items-center gap-4 px-6 py-4 text-left transition-all duration-150 hover:bg-white/[0.03]"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover/mod:scale-105"
                    style={{ background: `${mod.color}15` }}
                  >
                    <mod.icon className="h-5 w-5" style={{ color: mod.color }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-foreground transition-colors group-hover/mod:text-primary">
                      {mod.title}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground/75">
                      {mod.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Disponível
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/35 transition-all duration-200 group-hover/mod:translate-x-0.5 group-hover/mod:text-primary" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          {...fadeUp(0.4)}
          className="flex flex-col overflow-hidden rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(16,21,32,0.92),rgba(11,15,23,0.92))] shadow-[0_16px_38px_rgba(0,0,0,0.22)]"
        >
          <div className="border-b border-white/[0.05] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Atividade recente</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Últimos processamentos</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
            {recentRecords.length === 0 ? (
              <div className="py-10 text-center">
                <Clock className="mx-auto mb-3 h-7 w-7 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade registrada ainda.
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
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
                  className="rounded-[18px] border border-white/[0.05] bg-white/[0.03] p-3.5 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background:
                          record.statusConferencia === "confere"
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
                      <p className="text-[13px] font-medium leading-relaxed text-foreground/90">
                        {record.cliente} — {record.quantidadeDocumentos} documento
                        {record.quantidadeDocumentos !== 1 ? "s" : ""}
                      </p>

                      <div className="mt-1.5 flex items-center gap-3">
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                          <Clock className="h-3 w-3" />
                          {formatDate(record.dataProcessamento)}
                        </p>
                        <p className="tabular-nums text-[11px] font-semibold text-primary">
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
            <div className="border-t border-white/[0.05] px-5 py-4">
              <button
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] text-[13px] font-medium text-muted-foreground transition-all duration-150 hover:border-white/[0.1] hover:text-foreground active:scale-[0.97]"
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