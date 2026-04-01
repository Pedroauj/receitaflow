import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FileSpreadsheet,
  Zap,
  Shield,
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
    color: "#a78bfa",
    glow: "rgba(139,92,246,0.14)",
    border: "rgba(139,92,246,0.22)",
  },
  {
    icon: Zap,
    title: "Processamento inteligente",
    desc: "Automatize validações, reduza retrabalho manual e acelere a rotina de baixas financeiras.",
    color: "#34d399",
    glow: "rgba(52,211,153,0.10)",
    border: "rgba(52,211,153,0.18)",
  },
  {
    icon: Shield,
    title: "Conferência com segurança",
    desc: "Cruze informações, valide valores e tenha mais controle antes de concluir cada processamento.",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.10)",
    border: "rgba(251,146,60,0.18)",
  },
];

const stats = [
  { label: "Layouts suportados", value: "+20" },
  { label: "Tempo operacional", value: "-80%" },
  { label: "Conferência manual", value: "0 erros" },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{ background: "#08080d" }}
    >
      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute"
          style={{
            top: "-80px",
            left: "-60px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "100px",
            right: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: "80px",
            left: "30%",
            width: "440px",
            height: "280px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(109,40,217,0.10) 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* Header */}
      <header
        className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 md:px-8"
        style={{ borderBottom: "1px solid rgba(139,92,246,0.10)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold"
            style={{
              background: "rgba(139,92,246,0.18)",
              borderColor: "rgba(139,92,246,0.35)",
              color: "#c4b5fd",
              boxShadow: "0 0 14px rgba(139,92,246,0.28)",
            }}
          >
            R
          </div>
          <div>
            <p
              className="m-0 text-[9px] uppercase tracking-[0.26em]"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              plataforma financeira
            </p>
            <h1 className="m-0 text-lg font-semibold tracking-[-0.03em] text-white">
              Receita<span style={{ color: "#a78bfa" }}>Flow</span>
            </h1>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            className="rounded-xl px-4 py-2 text-sm font-medium transition-all hover:bg-white/[0.04]"
            style={{
              border: "1px solid rgba(139,92,246,0.18)",
              background: "rgba(139,92,246,0.06)",
              color: "rgba(255,255,255,0.58)",
            }}
          >
            Ver demonstração
          </button>
          <Button
            className="h-10 rounded-xl border px-5 text-sm font-semibold"
            style={{
              borderColor: "rgba(167,139,250,0.40)",
              background: "linear-gradient(135deg, rgba(139,92,246,0.85), rgba(109,40,217,0.95))",
              color: "#ede9fe",
              boxShadow: "0 0 20px rgba(139,92,246,0.40), 0 4px 12px rgba(109,40,217,0.30)",
            }}
            onClick={() => navigate("/login")}
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] w-full max-w-7xl items-center gap-12 px-6 pb-14 pt-6 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:pb-20 md:pt-10">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          {/* Badge */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{
              border: "1px solid rgba(167,139,250,0.25)",
              background: "rgba(139,92,246,0.10)",
              boxShadow: "0 0 12px rgba(139,92,246,0.14)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: "#a78bfa",
                boxShadow: "0 0 6px rgba(167,139,250,0.90)",
              }}
            />
            <span
              className="text-xs font-medium tracking-[0.02em]"
              style={{ color: "#c4b5fd" }}
            >
              Automação financeira com o mesmo padrão visual da sua plataforma
            </span>
          </div>

          <h2
            className="text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white md:text-6xl"
          >
            Transforme planilhas operacionais em um fluxo mais{" "}
            <span
              style={{
                color: "#a78bfa",
                textShadow: "0 0 24px rgba(167,139,250,0.45)",
              }}
            >
              visual, rápido
            </span>{" "}
            e confiável.
          </h2>

          <p
            className="mt-6 max-w-xl text-base leading-7 md:text-lg"
            style={{ color: "rgba(255,255,255,0.42)" }}
          >
            Uma landing mais forte para posicionar o ReceitaFlow como uma plataforma premium:
            clareza na proposta, estética mais madura e uma vitrine visual do que o sistema
            entrega no dia a dia.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              className="h-12 rounded-2xl border px-6 text-sm font-semibold"
              style={{
                borderColor: "rgba(167,139,250,0.40)",
                background: "linear-gradient(135deg, rgba(139,92,246,0.85), rgba(109,40,217,0.95))",
                color: "#ede9fe",
                boxShadow: "0 0 26px rgba(139,92,246,0.45), 0 4px 14px rgba(109,40,217,0.35)",
              }}
              onClick={() => navigate("/login")}
            >
              Acessar plataforma
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <button
              className="h-12 rounded-2xl px-6 text-sm font-medium transition-all hover:bg-white/[0.04]"
              style={{
                border: "1px solid rgba(139,92,246,0.18)",
                background: "rgba(139,92,246,0.06)",
                color: "rgba(255,255,255,0.60)",
              }}
            >
              Conhecer módulos
            </button>
          </div>

          {/* Stats */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] p-4"
                style={{
                  border: "1px solid rgba(139,92,246,0.15)",
                  background: "rgba(139,92,246,0.05)",
                }}
              >
                <p
                  className="m-0 text-2xl font-semibold tracking-[-0.04em]"
                  style={{
                    color: "#c4b5fd",
                    textShadow: "0 0 14px rgba(167,139,250,0.40)",
                  }}
                >
                  {item.value}
                </p>
                <p
                  className="m-0 mt-1 text-xs leading-5"
                  style={{ color: "rgba(255,255,255,0.34)" }}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Preview panel */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div
            className="rounded-[30px] p-4 md:p-5"
            style={{
              border: "1px solid rgba(139,92,246,0.20)",
              background:
                "linear-gradient(180deg, rgba(14,10,24,0.96) 0%, rgba(10,8,18,0.98) 100%)",
              backdropFilter: "blur(20px)",
              boxShadow:
                "0 0 40px rgba(109,40,217,0.16), 0 30px 80px rgba(0,0,0,0.40), inset 0 1px 0 rgba(167,139,250,0.06)",
            }}
          >
            <div
              className="rounded-[24px] p-4 md:p-5"
              style={{
                border: "1px solid rgba(139,92,246,0.12)",
                background: "#07060e",
              }}
            >
              {/* Mini topbar */}
              <div
                className="mb-4 flex items-center justify-between rounded-2xl px-4 py-3"
                style={{
                  border: "1px solid rgba(139,92,246,0.14)",
                  background: "rgba(139,92,246,0.06)",
                }}
              >
                <div>
                  <p
                    className="m-0 text-xs uppercase tracking-[0.24em]"
                    style={{ color: "rgba(255,255,255,0.24)" }}
                  >
                    visão operacional
                  </p>
                  <h3 className="m-0 mt-1 text-sm font-semibold text-white">
                    Dashboard financeiro
                  </h3>
                </div>
                <div
                  className="rounded-full px-3 py-1 text-[11px] font-medium"
                  style={{
                    border: "1px solid rgba(167,139,250,0.25)",
                    background: "rgba(139,92,246,0.14)",
                    color: "#c4b5fd",
                  }}
                >
                  ReceitaFlow Core
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                {/* Chart */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    border: "1px solid rgba(139,92,246,0.12)",
                    background:
                      "linear-gradient(180deg, rgba(20,14,34,0.95) 0%, rgba(14,10,24,0.97) 100%)",
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="m-0 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
                        Processamentos do dia
                      </p>
                      <p className="m-0 text-2xl font-semibold tracking-[-0.04em] text-white">
                        128 arquivos
                      </p>
                    </div>
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        background: "rgba(139,92,246,0.16)",
                        boxShadow: "0 0 12px rgba(139,92,246,0.22)",
                      }}
                    >
                      <BarChart3 className="h-5 w-5" style={{ color: "#a78bfa" }} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[68, 86, 52, 94, 74].map((h, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-14 text-[11px]"
                          style={{ color: "rgba(255,255,255,0.26)" }}
                        >
                          P{index + 1}
                        </div>
                        <div
                          className="h-2 flex-1 rounded-full"
                          style={{ background: "rgba(139,92,246,0.10)" }}
                        >
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${h}%`,
                              background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                              boxShadow:
                                h > 80
                                  ? "0 0 8px rgba(167,139,250,0.55)"
                                  : "0 0 5px rgba(167,139,250,0.30)",
                            }}
                          />
                        </div>
                        <div
                          className="w-10 text-right text-[11px]"
                          style={{ color: "rgba(255,255,255,0.36)" }}
                        >
                          {h}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Summary */}
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      border: "1px solid rgba(139,92,246,0.12)",
                      background:
                        "linear-gradient(180deg, rgba(20,14,34,0.95) 0%, rgba(14,10,24,0.97) 100%)",
                    }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{ color: "#a78bfa" }} />
                      <p className="m-0 text-sm font-semibold text-white">Resumo rápido</p>
                    </div>
                    <div className="space-y-3 text-sm">
                      {[
                        "Layouts validados automaticamente",
                        "Conferência de valores por cliente",
                        "Fluxo preparado para módulos por permissão",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2"
                          style={{ color: "rgba(255,255,255,0.55)" }}
                        >
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              background: "#a78bfa",
                              boxShadow: "0 0 5px rgba(167,139,250,0.80)",
                            }}
                          />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA card */}
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      border: "1px solid rgba(139,92,246,0.22)",
                      background:
                        "linear-gradient(180deg, rgba(109,40,217,0.14) 0%, rgba(76,29,149,0.10) 100%)",
                    }}
                  >
                    <p
                      className="m-0 text-xs uppercase tracking-[0.22em]"
                      style={{ color: "#a78bfa" }}
                    >
                      diferencial
                    </p>
                    <p
                      className="m-0 mt-2 text-sm leading-6"
                      style={{ color: "rgba(255,255,255,0.68)" }}
                    >
                      A nova landing comunica mais valor, mais robustez e deixa o produto com cara
                      de SaaS B2B premium.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Neon divider */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8" style={{ marginBottom: "2rem" }}>
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(139,92,246,0.45), rgba(167,139,250,0.65), rgba(139,92,246,0.45), transparent)",
            boxShadow: "0 0 10px rgba(139,92,246,0.30)",
          }}
        />
      </div>

      {/* Features */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 md:px-8 md:pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 + index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[26px] p-6"
                style={{
                  border: "1px solid rgba(139,92,246,0.12)",
                  background:
                    "linear-gradient(180deg, rgba(14,10,24,0.96) 0%, rgba(10,8,18,0.98) 100%)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
                }}
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border"
                  style={{
                    borderColor: feature.border,
                    background: feature.glow,
                    boxShadow: `0 0 12px ${feature.glow}`,
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: feature.color }} />
                </div>
                <h3 className="m-0 text-base font-semibold text-white">{feature.title}</h3>
                <p
                  className="m-0 mt-2 text-sm leading-6"
                  style={{ color: "rgba(255,255,255,0.40)" }}
                >
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 px-6 py-5 text-center md:px-8">
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.20)" }}>
          © {new Date().getFullYear()} ReceitaFlow. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
};

export default Landing;