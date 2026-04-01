import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Hexagon,
  ArrowRight,
  FileSpreadsheet,
  Zap,
  Shield,
  Sparkles,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const features = [
  {
    icon: FileSpreadsheet,
    title: "Operação multi-clientes",
    desc: "Centralize layouts diferentes de planilhas em um fluxo único, padronizado e confiável.",
  },
  {
    icon: Zap,
    title: "Processamento inteligente",
    desc: "Automatize validações, reduza retrabalho manual e acelere a rotina operacional.",
  },
  {
    icon: Shield,
    title: "Conferência com segurança",
    desc: "Cruze informações, valide valores e tenha mais controle antes de concluir cada processamento.",
  },
];

const stats = [
  { label: "Layouts suportados", value: "+20" },
  { label: "Eficiência operacional", value: "-80%" },
  { label: "Conferência manual", value: "Menos erros" },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0C0F] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 18% 12%, rgba(255,255,255,0.04), transparent 22%),
            radial-gradient(circle at 82% 78%, rgba(120,146,255,0.10), transparent 28%),
            radial-gradient(circle at 50% 0%, rgba(255,255,255,0.025), transparent 28%),
            linear-gradient(180deg, #0B0C0F 0%, #0A0B0E 100%)
          `,
        }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl border"
            style={{
              borderColor: "rgba(95, 135, 255, 0.20)",
              background:
                "linear-gradient(180deg, rgba(70,95,180,0.22) 0%, rgba(45,58,108,0.18) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <Hexagon className="h-5 w-5 text-[#9CB2FF]" />
          </div>

          <div>
            <p className="m-0 text-[10px] uppercase tracking-[0.26em] text-white/30">
              plataforma operacional
            </p>
            <h1 className="m-0 text-lg font-semibold tracking-[-0.03em] text-white">
              Receita<span className="text-[#8EA6FF]">Flow</span>
            </h1>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            className="rounded-2xl border px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/[0.04]"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
              color: "rgba(255,255,255,0.72)",
            }}
          >
            Ver demonstração
          </button>

          <Button
            className="h-10 rounded-2xl border-0 px-5 text-sm font-semibold"
            style={{
              background: "linear-gradient(135deg, #9CB2FF 0%, #6E8CFF 100%)",
              color: "#0E1324",
              boxShadow: "0 12px 28px rgba(110,140,255,0.22)",
            }}
            onClick={() => navigate("/login")}
          >
            Entrar
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] w-full max-w-7xl items-center gap-12 px-6 pb-14 pt-6 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:pb-20 md:pt-10">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2"
            style={{
              borderColor: "rgba(142,166,255,0.16)",
              background: "rgba(142,166,255,0.08)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Sparkles className="h-4 w-4 text-[#B9C7FF]" />
            <span className="text-xs font-medium tracking-[0.02em] text-[#B9C7FF]">
              Automação financeira com interface premium e fluxo operacional inteligente
            </span>
          </div>

          <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white md:text-6xl">
            Transforme processos operacionais em um fluxo mais rápido, visual e confiável.
          </h2>

          <p className="mt-6 max-w-xl text-base leading-7 text-white/52 md:text-lg">
            O ReceitaFlow centraliza operações financeiras, conferências e módulos por cliente
            em uma experiência robusta, moderna e preparada para escala.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              className="h-12 rounded-2xl border-0 px-6 text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #9CB2FF 0%, #6E8CFF 100%)",
                color: "#0E1324",
                boxShadow: "0 12px 28px rgba(110,140,255,0.22)",
              }}
              onClick={() => navigate("/login")}
            >
              Acessar plataforma
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <button
              className="h-12 rounded-2xl border px-6 text-sm font-medium transition-all duration-200 hover:bg-white/[0.04]"
              style={{
                borderColor: "rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.02)",
                color: "rgba(255,255,255,0.72)",
              }}
            >
              Conhecer módulos
            </button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  background:
                    "linear-gradient(180deg, rgba(19,21,27,0.95) 0%, rgba(14,16,21,0.97) 100%)",
                }}
              >
                <p className="m-0 text-2xl font-semibold tracking-[-0.04em] text-white">
                  {item.value}
                </p>
                <p className="m-0 mt-1 text-xs leading-5 text-white/42">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55 }}
          className="relative"
        >
          <div
            className="rounded-[30px] border p-4 shadow-[0_30px_80px_rgba(0,0,0,0.34)] md:p-5"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              background:
                "linear-gradient(180deg, rgba(18,20,26,0.95) 0%, rgba(14,16,21,0.98) 100%)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div
              className="rounded-[24px] border p-4 md:p-5"
              style={{
                borderColor: "rgba(255,255,255,0.06)",
                background: "#101217",
              }}
            >
              <div
                className="mb-4 flex items-center justify-between rounded-2xl border px-4 py-3"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.025)",
                }}
              >
                <div>
                  <p className="m-0 text-xs uppercase tracking-[0.24em] text-white/28">
                    visão operacional
                  </p>
                  <h3 className="m-0 mt-1 text-sm font-semibold text-white">
                    Dashboard financeiro
                  </h3>
                </div>

                <div
                  className="rounded-full border px-3 py-1 text-[11px] font-medium"
                  style={{
                    borderColor: "rgba(142,166,255,0.18)",
                    background: "rgba(142,166,255,0.08)",
                    color: "#B9C7FF",
                  }}
                >
                  ReceitaFlow Core
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: "rgba(255,255,255,0.06)",
                    background:
                      "linear-gradient(180deg, rgba(22,24,30,0.95) 0%, rgba(16,18,23,0.97) 100%)",
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="m-0 text-xs text-white/38">Processamentos do dia</p>
                      <p className="m-0 text-2xl font-semibold tracking-[-0.04em] text-white">
                        128 arquivos
                      </p>
                    </div>

                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: "rgba(142,166,255,0.12)" }}
                    >
                      <BarChart3 className="h-5 w-5 text-[#8EA6FF]" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[68, 86, 52, 94, 74].map((h, index) => (
                      <div key={index} className="flex items-end gap-2">
                        <div className="w-14 text-[11px] text-white/34">P{index + 1}</div>
                        <div className="h-2 flex-1 rounded-full bg-white/[0.06]">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${h}%`,
                              background: "linear-gradient(90deg, #6E8CFF 0%, #9CB2FF 100%)",
                            }}
                          />
                        </div>
                        <div className="w-10 text-right text-[11px] text-white/46">{h}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: "rgba(255,255,255,0.06)",
                      background:
                        "linear-gradient(180deg, rgba(22,24,30,0.95) 0%, rgba(16,18,23,0.97) 100%)",
                    }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#8EA6FF]" />
                      <p className="m-0 text-sm font-semibold text-white">Resumo rápido</p>
                    </div>

                    <div className="space-y-3 text-sm">
                      {[
                        "Layouts validados automaticamente",
                        "Conferência de valores por cliente",
                        "Fluxo preparado para módulos por permissão",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-white/68">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#8EA6FF]" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: "rgba(142,166,255,0.12)",
                      background:
                        "linear-gradient(180deg, rgba(35,45,86,0.34) 0%, rgba(17,21,35,0.46) 100%)",
                    }}
                  >
                    <p className="m-0 text-xs uppercase tracking-[0.22em] text-[#B9C7FF]">
                      diferencial
                    </p>
                    <p className="m-0 mt-2 text-sm leading-6 text-white/78">
                      Uma experiência visual mais forte, corporativa e coerente com um SaaS B2B premium.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 md:px-8 md:pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 + index * 0.06, duration: 0.45 }}
                className="rounded-[26px] border p-6 shadow-[0_16px_40px_rgba(0,0,0,0.2)]"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  background:
                    "linear-gradient(180deg, rgba(19,21,27,0.96) 0%, rgba(14,16,21,0.98) 100%)",
                }}
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border"
                  style={{
                    borderColor: "rgba(142,166,255,0.14)",
                    background: "rgba(142,166,255,0.10)",
                  }}
                >
                  <Icon className="h-5 w-5 text-[#8EA6FF]" />
                </div>

                <h3 className="m-0 text-base font-semibold text-white">{feature.title}</h3>
                <p className="m-0 mt-2 text-sm leading-6 text-white/46">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 px-6 py-5 text-center md:px-8">
        <p className="text-[11px] text-white/28">
          © {new Date().getFullYear()} ReceitaFlow. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
};

export default Landing;