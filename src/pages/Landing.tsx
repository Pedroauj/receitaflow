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
    desc: "Centralize layouts diferentes de planilhas em um único fluxo padronizado, com mais clareza operacional.",
  },
  {
    icon: Zap,
    title: "Processamento inteligente",
    desc: "Automatize etapas repetitivas e reduza o esforço manual nas rotinas financeiras do dia a dia.",
  },
  {
    icon: Shield,
    title: "Conferência com segurança",
    desc: "Valide informações com mais controle antes de concluir cada processamento e reduzir inconsistências.",
  },
];

const stats = [
  { label: "Layouts suportados", value: "+20" },
  { label: "Tempo operacional", value: "-80%" },
  { label: "Processos mais seguros", value: "Menos erros" },
];

const highlights = [
  "Módulos organizados por permissão",
  "Visão operacional mais clara",
  "Processos financeiros padronizados",
];

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "#0F1012" }}
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at top center, rgba(250,199,117,0.08) 0%, rgba(250,199,117,0.02) 22%, rgba(15,16,18,0) 48%)",
          }}
        />
        <div
          className="absolute left-[8%] top-[140px] h-[260px] w-[260px] rounded-full blur-3xl"
          style={{ background: "rgba(186, 117, 23, 0.08)" }}
        />
        <div
          className="absolute right-[8%] bottom-[120px] h-[240px] w-[240px] rounded-full blur-3xl"
          style={{ background: "rgba(250, 199, 117, 0.05)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(250,199,117,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(250,199,117,0.028) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.45), transparent)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full px-6 md:px-8 pt-6">
        <div
          className="mx-auto flex items-center justify-between rounded-[28px] px-5 md:px-6 py-4"
          style={{
            maxWidth: 1560,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(20,21,24,0.72)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(180deg, #3B2203 0%, #2A1802 100%)",
                border: "1px solid rgba(250,199,117,0.18)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <Hexagon className="h-5 w-5" style={{ color: "#FAC775" }} />
            </div>

            <div>
              <p
                className="text-[11px] uppercase tracking-[0.24em] m-0"
                style={{ color: "#7C7A74" }}
              >
                plataforma financeira
              </p>
              <h1 className="text-lg font-semibold leading-none mt-1 m-0">
                <span style={{ color: "#F5F5F0" }}>Receita</span>
                <span style={{ color: "#FAC775" }}>Flow</span>
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              className="h-11 px-5 rounded-2xl text-sm font-medium transition-all duration-200"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                color: "#C9C7BE",
              }}
            >
              Ver demonstração
            </button>

            <Button
              className="h-11 px-5 rounded-2xl border-0 text-sm font-semibold"
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
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 w-full px-6 md:px-8 pt-8 md:pt-10 pb-10 md:pb-14">
        <div
          className="mx-auto grid items-center gap-8 xl:gap-10"
          style={{ maxWidth: 1560, gridTemplateColumns: "minmax(0,1.08fr) minmax(420px,0.92fr)" }}
        >
          {/* Left */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="min-w-0"
          >
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6"
              style={{
                border: "1px solid rgba(250,199,117,0.14)",
                background: "rgba(65,36,2,0.38)",
                color: "#FAC775",
                backdropFilter: "blur(10px)",
              }}
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-medium tracking-[0.01em]">
                Mesmo padrão visual do restante da plataforma
              </span>
            </div>

            <h2
              className="text-4xl md:text-5xl xl:text-6xl font-bold tracking-[-0.04em] leading-[1.02] max-w-4xl"
              style={{ color: "#F5F5F0" }}
            >
              Uma entrada mais sólida, elegante e coerente com o visual premium do sistema.
            </h2>

            <p
              className="mt-6 max-w-2xl text-base md:text-lg leading-7"
              style={{ color: "#A4A098" }}
            >
              O ReceitaFlow organiza rotinas financeiras, padroniza fluxos operacionais e entrega
              uma experiência mais profissional desde o primeiro contato, sem quebrar a identidade
              visual do restante do site.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                className="h-12 px-6 rounded-2xl border-0 text-sm font-semibold"
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
                className="h-12 px-6 rounded-2xl text-sm font-medium transition-all duration-200"
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
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
                  className="rounded-[24px] p-5"
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "linear-gradient(180deg, #191A1D 0%, #141518 100%)",
                    boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
                  }}
                >
                  <p className="text-2xl md:text-[28px] font-semibold m-0" style={{ color: "#F5F5F0" }}>
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 m-0" style={{ color: "#88867F" }}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Right */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5 }}
            className="min-w-0"
          >
            <div
              className="rounded-[32px] p-4 md:p-5"
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(18,19,22,0.86)",
                backdropFilter: "blur(18px)",
                boxShadow: "0 26px 70px rgba(0,0,0,0.34)",
              }}
            >
              <div
                className="rounded-[26px] p-4 md:p-5"
                style={{
                  border: "1px solid rgba(255,255,255,0.05)",
                  background: "linear-gradient(180deg, #141518 0%, #101114 100%)",
                }}
              >
                <div
                  className="rounded-[22px] p-4 mb-4"
                  style={{
                    border: "1px solid rgba(255,255,255,0.05)",
                    background: "linear-gradient(180deg, #1A1B1F 0%, #15161A 100%)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="text-[11px] uppercase tracking-[0.22em] m-0"
                        style={{ color: "#7E7B74" }}
                      >
                        visão geral
                      </p>
                      <h3
                        className="text-base md:text-lg font-semibold mt-2 m-0"
                        style={{ color: "#F5F5F0" }}
                      >
                        Plataforma operacional unificada
                      </h3>
                      <p
                        className="mt-2 text-sm leading-6 m-0 max-w-md"
                        style={{ color: "#96928A" }}
                      >
                        Uma apresentação inicial mais consistente com o dashboard, mantendo a mesma
                        linguagem visual do sistema.
                      </p>
                    </div>

                    <div
                      className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        background: "linear-gradient(180deg, #3B2203 0%, #2A1802 100%)",
                        border: "1px solid rgba(250,199,117,0.18)",
                      }}
                    >
                      <BarChart3 className="h-5 w-5" style={{ color: "#FAC775" }} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div
                    className="rounded-[22px] p-4"
                    style={{
                      border: "1px solid rgba(255,255,255,0.05)",
                      background: "linear-gradient(180deg, #1A1B1F 0%, #15161A 100%)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs m-0" style={{ color: "#827F78" }}>
                          Eficiência operacional
                        </p>
                        <p className="text-2xl font-semibold mt-1 m-0" style={{ color: "#F5F5F0" }}>
                          128 arquivos
                        </p>
                      </div>

                      <div
                        className="rounded-full px-3 py-1 text-[11px] font-medium"
                        style={{
                          border: "1px solid rgba(250,199,117,0.18)",
                          background: "rgba(65,36,2,0.35)",
                          color: "#FAC775",
                        }}
                      >
                        Processados hoje
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[72, 88, 64, 92, 79].map((value, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-8 text-[11px]" style={{ color: "#75716A" }}>
                            P{index + 1}
                          </div>

                          <div
                            className="h-2 flex-1 rounded-full overflow-hidden"
                            style={{ background: "#232428" }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${value}%`,
                                background:
                                  "linear-gradient(90deg, #BA7517 0%, #FAC775 100%)",
                              }}
                            />
                          </div>

                          <div
                            className="w-10 text-right text-[11px]"
                            style={{ color: "#A09D96" }}
                          >
                            {value}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div
                      className="rounded-[22px] p-4"
                      style={{
                        border: "1px solid rgba(255,255,255,0.05)",
                        background: "linear-gradient(180deg, #1A1B1F 0%, #15161A 100%)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-4 w-4" style={{ color: "#FAC775" }} />
                        <p className="text-sm font-semibold m-0" style={{ color: "#F5F5F0" }}>
                          Pontos fortes
                        </p>
                      </div>

                      <div className="space-y-3">
                        {highlights.map((item) => (
                          <div key={item} className="flex items-start gap-2">
                            <div
                              className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ background: "#FAC775" }}
                            />
                            <span className="text-sm leading-6" style={{ color: "#B9B6AE" }}>
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      className="rounded-[22px] p-4"
                      style={{
                        border: "1px solid rgba(250,199,117,0.12)",
                        background:
                          "linear-gradient(180deg, rgba(65,36,2,0.42) 0%, rgba(33,22,6,0.3) 100%)",
                      }}
                    >
                      <p
                        className="text-[11px] uppercase tracking-[0.22em] m-0"
                        style={{ color: "#D8A44D" }}
                      >
                        diferencial visual
                      </p>
                      <p
                        className="mt-3 text-sm leading-6 m-0"
                        style={{ color: "#F1E4CF" }}
                      >
                        A landing deixa de parecer uma página separada e passa a funcionar como uma
                        continuação natural da experiência do produto.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      {/* Features */}
      <section className="relative z-10 w-full px-6 md:px-8 pb-12 md:pb-16">
        <div
          className="mx-auto grid gap-5 md:grid-cols-3"
          style={{ maxWidth: 1560 }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + index * 0.06, duration: 0.42 }}
                className="rounded-[28px] p-6"
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "linear-gradient(180deg, #191A1D 0%, #141518 100%)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
                }}
              >
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: "linear-gradient(180deg, #3B2203 0%, #2A1802 100%)",
                    border: "1px solid rgba(250,199,117,0.16)",
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: "#FAC775" }} />
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

      {/* Mobile CTA */}
      <div className="relative z-10 md:hidden px-6 pb-8">
        <Button
          className="w-full h-12 rounded-2xl border-0 text-sm font-semibold"
          style={{
            background: "linear-gradient(135deg, #FAC775 0%, #EF9F27 100%)",
            color: "#241300",
            boxShadow: "0 12px 28px rgba(239,159,39,0.22)",
          }}
          onClick={() => navigate("/login")}
        >
          Entrar na plataforma
        </Button>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-8 pb-6">
        <div
          className="mx-auto rounded-[22px] px-5 py-4 text-center"
          style={{
            maxWidth: 1560,
            border: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.015)",
          }}
        >
          <p className="text-[11px] m-0" style={{ color: "#5F5E5A" }}>
            © {new Date().getFullYear()} ReceitaFlow. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;