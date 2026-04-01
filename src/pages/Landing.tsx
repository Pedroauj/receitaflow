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
    desc: "Automatize validações, reduza retrabalho manual e acelere a rotina de baixas financeiras.",
  },
  {
    icon: Shield,
    title: "Conferência com segurança",
    desc: "Cruze informações, valide valores e tenha mais controle antes de concluir cada processamento.",
  },
];

const stats = [
  { label: "Layouts suportados", value: "+20" },
  { label: "Tempo operacional", value: "-80%" },
  { label: "Conferência manual", value: "Menos erros" },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen overflow-hidden relative" style={{ background: "#18181A" }}>
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-[-120px] h-[320px] w-[320px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "rgba(186, 117, 23, 0.10)" }}
        />
        <div
          className="absolute left-[12%] top-[180px] h-[180px] w-[180px] rounded-full blur-3xl"
          style={{ background: "rgba(250, 199, 117, 0.06)" }}
        />
        <div
          className="absolute bottom-[80px] right-[10%] h-[220px] w-[220px] rounded-full blur-3xl"
          style={{ background: "rgba(239, 159, 39, 0.06)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(250,199,117,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(250,199,117,0.03) 1px, transparent 1px)",
            backgroundSize: "38px 38px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 md:px-8 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-2xl flex items-center justify-center border"
            style={{
              background: "#412402",
              borderColor: "#633806",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            <Hexagon className="h-5 w-5" style={{ color: "#BA7517" }} />
          </div>

          <div>
            <p
              className="text-[11px] uppercase tracking-[0.28em] m-0"
              style={{ color: "#888780" }}
            >
              plataforma financeira
            </p>
            <h1 className="text-lg font-semibold m-0" style={{ color: "#F5F5F0" }}>
              Receita<span style={{ color: "#FAC775" }}>Flow</span>
            </h1>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            className="rounded-xl px-4 py-2 text-sm transition"
            style={{
              border: "1px solid #2A2A2D",
              background: "#1C1C1F",
              color: "#C9C7BE",
            }}
          >
            Ver demonstração
          </button>

          <Button
            className="border-0 text-sm h-10 px-5 font-semibold"
            style={{
              background: "linear-gradient(135deg, #FAC775 0%, #EF9F27 100%)",
              color: "#241300",
              boxShadow: "0 10px 24px rgba(239,159,39,0.22)",
            }}
            onClick={() => navigate("/login")}
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-8 pt-6 md:pt-10 pb-14 md:pb-20 grid md:grid-cols-[1.1fr_0.9fr] gap-12 items-center min-h-[calc(100vh-84px)]">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6"
            style={{
              background: "rgba(65,36,2,0.8)",
              border: "1px solid #633806",
              backdropFilter: "blur(8px)",
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: "#FAC775" }} />
            <span
              className="text-xs font-medium"
              style={{ color: "#FAC775", letterSpacing: "0.02em" }}
            >
              Automação financeira com o mesmo padrão visual da sua plataforma
            </span>
          </div>

          <h2
            className="text-4xl md:text-6xl font-bold leading-[1.02] tracking-[-0.04em]"
            style={{ color: "#F5F5F0" }}
          >
            Transforme planilhas operacionais em um fluxo mais visual, rápido e confiável.
          </h2>

          <p
            className="mt-6 text-base md:text-lg leading-7 max-w-xl"
            style={{ color: "#A3A19A" }}
          >
            Uma landing mais forte para posicionar o ReceitaFlow como uma plataforma premium:
            clareza na proposta, estética mais madura e uma vitrine visual do que o sistema
            entrega no dia a dia.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              className="border-0 h-12 px-6 text-sm font-semibold rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #FAC775 0%, #EF9F27 100%)",
                color: "#241300",
                boxShadow: "0 12px 28px rgba(239,159,39,0.22)",
              }}
              onClick={() => navigate("/login")}
            >
              Acessar plataforma
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <button
              className="h-12 px-6 text-sm font-medium rounded-2xl transition"
              style={{
                border: "1px solid #2A2A2D",
                background: "rgba(27,27,30,0.8)",
                color: "#D6D3CB",
              }}
            >
              Conhecer módulos
            </button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl p-4"
                style={{
                  border: "1px solid #26262A",
                  background: "linear-gradient(180deg, #1D1D20 0%, #17171A 100%)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                }}
              >
                <p className="text-2xl font-semibold m-0" style={{ color: "#F5F5F0" }}>
                  {item.value}
                </p>
                <p className="mt-1 text-xs leading-5 m-0" style={{ color: "#8F8C84" }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Visual mockup */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55 }}
          className="relative"
        >
          <div
            className="rounded-[28px] p-4 md:p-5"
            style={{
              border: "1px solid #2B2B30",
              background:
                "linear-gradient(180deg, rgba(29,29,32,0.95) 0%, rgba(20,20,22,0.96) 100%)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.34)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              className="rounded-[24px] p-4 md:p-5"
              style={{
                border: "1px solid #2F2F34",
                background: "#121214",
              }}
            >
              <div
                className="mb-4 flex items-center justify-between rounded-2xl px-4 py-3"
                style={{
                  border: "1px solid #26262A",
                  background: "#18181B",
                }}
              >
                <div>
                  <p
                    className="text-xs uppercase tracking-[0.24em] m-0"
                    style={{ color: "#7F7C75" }}
                  >
                    visão operacional
                  </p>
                  <h3 className="mt-1 text-sm font-semibold m-0" style={{ color: "#F5F5F0" }}>
                    Dashboard financeiro
                  </h3>
                </div>

                <div
                  className="rounded-full px-3 py-1 text-[11px] font-medium"
                  style={{
                    border: "1px solid #633806",
                    background: "#412402",
                    color: "#FAC775",
                  }}
                >
                  ReceitaFlow Core
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                <div
                  className="rounded-2xl p-4"
                  style={{
                    border: "1px solid #26262A",
                    background: "linear-gradient(180deg, #1B1B1E 0%, #151518 100%)",
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs m-0" style={{ color: "#86837C" }}>
                        Processamentos do dia
                      </p>
                      <p className="text-2xl font-semibold m-0" style={{ color: "#F5F5F0" }}>
                        128 arquivos
                      </p>
                    </div>

                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center"
                      style={{ background: "#412402" }}
                    >
                      <BarChart3 className="h-5 w-5" style={{ color: "#FAC775" }} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[68, 86, 52, 94, 74].map((h, index) => (
                      <div key={index} className="flex items-end gap-2">
                        <div className="w-14 text-[11px]" style={{ color: "#75726B" }}>
                          P{index + 1}
                        </div>
                        <div
                          className="h-2 flex-1 rounded-full"
                          style={{ background: "#232327" }}
                        >
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${h}%`,
                              background: "linear-gradient(90deg, #BA7517 0%, #FAC775 100%)",
                            }}
                          />
                        </div>
                        <div
                          className="w-10 text-right text-[11px]"
                          style={{ color: "#A09D95" }}
                        >
                          {h}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      border: "1px solid #26262A",
                      background: "linear-gradient(180deg, #1B1B1E 0%, #151518 100%)",
                    }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{ color: "#FAC775" }} />
                      <p className="text-sm font-semibold m-0" style={{ color: "#F5F5F0" }}>
                        Resumo rápido
                      </p>
                    </div>

                    <div className="space-y-3 text-sm">
                      {[
                        "Layouts validados automaticamente",
                        "Conferência de valores por cliente",
                        "Fluxo preparado para módulos por permissão",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2" style={{ color: "#B8B5AD" }}>
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: "#FAC775" }}
                          />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="rounded-2xl p-4"
                    style={{
                      border: "1px solid rgba(99,56,6,0.5)",
                      background:
                        "linear-gradient(180deg, rgba(65,36,2,0.55) 0%, rgba(32,20,4,0.5) 100%)",
                    }}
                  >
                    <p
                      className="text-xs uppercase tracking-[0.22em] m-0"
                      style={{ color: "#D4A14E" }}
                    >
                      diferencial
                    </p>
                    <p className="mt-2 text-sm leading-6 m-0" style={{ color: "#F0E4CF" }}>
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

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-8 pb-16 md:pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 + index * 0.06, duration: 0.45 }}
                className="rounded-[24px] p-6"
                style={{
                  border: "1px solid #29292D",
                  background: "linear-gradient(180deg, #1C1C20 0%, #161619 100%)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
                }}
              >
                <div
                  className="h-11 w-11 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    border: "1px solid #633806",
                    background: "#412402",
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: "#EF9F27" }} />
                </div>

                <h3 className="text-base font-semibold m-0" style={{ color: "#F5F5F0" }}>
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 m-0" style={{ color: "#8E8B84" }}>
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-8 py-5 text-center">
        <p className="text-[11px]" style={{ color: "#5F5E5A" }}>
          © {new Date().getFullYear()} ReceitaFlow. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
};

export default Landing;