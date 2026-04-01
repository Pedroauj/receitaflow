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
  Sun,
  Moon,
  CloudSun,
  Sparkles,
  FileSpreadsheet,
  Hash,
  DollarSign,
  Clock,
  Loader2,
  ArrowUpRight,
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
    duration: 0.45,
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

  if (permLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <motion.section {...fadeUp(0)}>
        <div className="grid gap-5 xl:grid-cols-[1.02fr_1.48fr]">
          <div className="rounded-[28px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(15,19,29,0.94),rgba(10,13,21,0.94))] p-7 shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <GreetingIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Executive view
                </p>
                <p className="text-sm text-muted-foreground">{greeting}, {firstName}</p>
              </div>
            </div>

            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.05em] text-foreground md:text-[46px]">
              Bem-vindo de volta,
              <br />
              <span className="bg-gradient-to-r from-violet-300 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>

            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              Total processado
            </p>

            <div className="mt-3 flex items-end gap-3">
              <p className="text-[34px] font-black leading-none tracking-[-0.06em] text-foreground md:text-[56px]">
                {formatCurrency(stats.valorTotalProcessado)}
              </p>
              <span className="mb-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[12px] font-bold text-emerald-400">
                +12,67%
              </span>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              Disponível para análise:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(stats.valorTotalProcessado)}
              </span>
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/historico")}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-bold text-[#111318] transition hover:opacity-95"
              >
                Histórico
                <ArrowUpRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/clientes")}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 text-[13px] font-bold text-foreground transition hover:bg-white/[0.06]"
              >
                Clientes
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(15,19,29,0.94),rgba(10,13,21,0.94))] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex items-center justify-end gap-2">
              <button className="h-8 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 text-[12px] font-bold text-white/70">
                Semana
              </button>
              <button className="h-8 rounded-full bg-white px-3 text-[12px] font-bold text-[#111318]">
                Mês
              </button>
              <button className="h-8 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 text-[12px] font-bold text-white/70">
                Ano
              </button>
            </div>

            <div className="grid h-[250px] grid-cols-[1fr_1fr_1.15fr_120px] overflow-hidden rounded-[22px] border border-white/[0.06]">
              <div className="border-r border-white/[0.05] p-4">
                <p className="text-[26px] font-black tracking-[-0.05em] text-foreground">
                  {formatCurrency(Math.round(stats.valorTotalProcessado * 0.28))}
                </p>
                <p className="mt-6 text-[13px] text-white/70">+23% Invest</p>
                <div className="mt-4 h-8 rounded-md bg-gradient-to-r from-primary to-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.26)]" />
              </div>

              <div className="border-r border-white/[0.05] p-4">
                <p className="text-[26px] font-black tracking-[-0.05em] text-foreground">
                  {formatCurrency(Math.round(stats.valorTotalProcessado * 0.53))}
                </p>
                <p className="mt-6 text-[13px] text-white/70">+12% Produtos</p>
              </div>

              <div className="relative border-r border-white/[0.05] p-4">
                <div className="absolute left-1/2 top-7 -translate-x-1/2 rounded-full border border-white/[0.08] bg-[#272b35] px-3 py-1 text-[12px] font-bold text-white/80">
                  Average
                </div>

                <div className="absolute bottom-5 left-4 right-4 flex h-[88px] items-end gap-2">
                  {[22, 38, 54, 62, 68, 48, 74, 42, 57, 45, 61, 35].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-md bg-gradient-to-b from-violet-400 to-primary"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              </div>

              <div className="relative p-4">
                <p className="mt-8 text-[13px] text-white/70">124 Other</p>
                <div className="absolute bottom-5 left-4 right-4 flex h-[72px] items-end gap-2">
                  {[42, 56, 34, 64].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-sm bg-white/70"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[13px] text-white/42">
              <span>Janeiro 26</span>
              <span>Fevereiro 26</span>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...fadeUp(0.08)}>
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(15,19,29,0.94),rgba(10,13,21,0.94))] p-5 shadow-[0_16px_38px_rgba(0,0,0,0.22)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[18px] font-bold tracking-[-0.03em] text-foreground">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-white/[0.12] text-[10px] text-white/70">
                  ◌
                </span>
                Analytics
              </div>
              <div className="grid h-7 w-7 place-items-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/55">
                ⋮
              </div>
            </div>

            <div className="border-t border-white/[0.05] pt-4">
              <div className="mb-3 flex gap-4 text-[12px] text-white/70">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-300" />
                  Income
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white/45" />
                  Expenses
                </span>
              </div>

              <div className="relative h-[220px] overflow-hidden rounded-[18px]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_40px,68px_100%]" />
                <svg viewBox="0 0 480 180" width="100%" height="180" className="relative z-10 mt-4">
                  <path
                    d="M10 130 C45 120, 70 145, 100 118 S160 70, 195 100 S250 155, 287 112 S350 95, 385 118 S430 148, 470 132"
                    fill="none"
                    stroke="#d7ec55"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 95 C45 80, 78 88, 110 106 S170 120, 208 126 S280 136, 320 112 S370 88, 408 116 S438 148, 470 138"
                    fill="none"
                    stroke="rgba(255,255,255,.45)"
                    strokeWidth="2.1"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(15,19,29,0.94),rgba(10,13,21,0.94))] p-5 shadow-[0_16px_38px_rgba(0,0,0,0.22)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[18px] font-bold tracking-[-0.03em] text-foreground">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-white/[0.12] text-[10px] text-white/70">
                  ◌
                </span>
                Activity by time
              </div>
              <div className="grid h-7 w-7 place-items-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/55">
                ↗
              </div>
            </div>

            <div className="grid gap-3 border-t border-white/[0.05] pt-4">
              <div className="grid grid-cols-[42px_repeat(7,1fr)] gap-2 text-[11px] text-white/46">
                <span />
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              <div className="grid grid-cols-[42px_1fr] gap-2">
                <div className="grid grid-rows-6 gap-2 text-[11px] text-white/46">
                  {["1 pm", "2 pm", "3 pm", "4 pm", "5 pm", "6 pm"].map((t) => (
                    <div key={t} className="flex items-center">
                      {t}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 grid-rows-6 gap-2">
                  {[
                    "bg-violet-950", "bg-violet-900", "bg-violet-900", "bg-violet-700", "bg-violet-900", "bg-violet-950", "bg-violet-950",
                    "bg-violet-950", "bg-violet-700", "bg-violet-500", "bg-violet-400", "bg-violet-500", "bg-violet-800", "bg-violet-950",
                    "bg-violet-900", "bg-violet-700", "bg-violet-400", "bg-violet-500", "bg-violet-400", "bg-violet-700", "bg-violet-900",
                    "bg-violet-950", "bg-violet-900", "bg-violet-700", "bg-violet-500", "bg-violet-500", "bg-violet-800", "bg-violet-950",
                    "bg-violet-950", "bg-violet-900", "bg-violet-900", "bg-violet-700", "bg-violet-400", "bg-violet-700", "bg-violet-950",
                    "bg-violet-950", "bg-violet-950", "bg-violet-900", "bg-violet-900", "bg-violet-700", "bg-violet-950", "bg-violet-950",
                  ].map((c, i) => (
                    <div key={i} className={`rounded-[8px] ${c} border border-white/[0.02]`} />
                  ))}
                </div>
              </div>

              <div className="mt-1 flex items-center justify-end gap-2 text-[11px] text-white/46">
                <span>Less</span>
                <div className="flex gap-1">
                  <span className="h-2 w-3 rounded-sm bg-violet-950" />
                  <span className="h-2 w-3 rounded-sm bg-violet-900" />
                  <span className="h-2 w-3 rounded-sm bg-violet-700" />
                  <span className="h-2 w-3 rounded-sm bg-violet-500" />
                  <span className="h-2 w-3 rounded-sm bg-violet-400" />
                </div>
                <span>More</span>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(15,19,29,0.94),rgba(10,13,21,0.94))] p-5 shadow-[0_16px_38px_rgba(0,0,0,0.22)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[18px] font-bold tracking-[-0.03em] text-foreground">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-white/[0.12] text-[10px] text-white/70">
                  ◌
                </span>
                Recent transactions
              </div>
              <div className="grid h-7 w-7 place-items-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/55">
                ⌕
              </div>
            </div>

            <div className="space-y-2 border-t border-white/[0.05] pt-3">
              {recentRecords.length === 0 ? (
                <div className="py-10 text-center">
                  <Clock className="mx-auto mb-3 h-7 w-7 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma atividade registrada ainda.
                  </p>
                </div>
              ) : (
                recentRecords.map((record, i) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.25 + i * 0.05,
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="grid h-[46px] grid-cols-[1fr_auto_auto_auto] items-center gap-3 text-[14px]"
                  >
                    <div className="truncate text-foreground">{record.cliente}</div>

                    <div className="inline-flex h-7 items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.03] px-3 text-[12px] font-semibold text-white/76">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background:
                            record.statusConferencia === "confere" ? "#d7ec55" : "#8b5cf6",
                        }}
                      />
                      {record.statusConferencia === "confere" ? "Confere" : "Revisar"}
                    </div>

                    <div className="font-bold tracking-[-0.02em] text-foreground">
                      {formatCurrency(record.valorTotal)}
                    </div>

                    <div className="text-white/42">⋮</div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {accessibleModules.length > 0 && (
        <motion.section {...fadeUp(0.12)}>
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
                  delay: 0.18 + i * 0.04,
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(15,19,29,0.94),rgba(10,13,21,0.94))] p-5 text-left shadow-[0_16px_38px_rgba(0,0,0,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.10]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_35%)]" />
                <div className="relative z-10">
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ background: `${mod.color}15` }}
                    >
                      <mod.icon className="h-5 w-5" style={{ color: mod.color }} />
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-white/35 transition-all duration-200 group-hover:text-primary" />
                  </div>

                  <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-foreground">
                    {mod.title}
                  </h3>

                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {mod.description}
                  </p>
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