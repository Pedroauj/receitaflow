import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Hexagon, ArrowRight, FileSpreadsheet, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#18181A" }}>
      {/* Header */}
      <header className="px-8 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "#412402" }}>
            <Hexagon className="h-5 w-5" style={{ color: "#BA7517" }} />
          </div>
          <h1 className="text-lg font-semibold" style={{ color: "#F5F5F0" }}>
            Receita<span style={{ color: "#FAC775" }}>Flow</span>
          </h1>
        </div>
        <Button
          className="gradient-btn border-0 text-sm h-9 px-5"
          onClick={() => navigate("/login")}
        >
          Entrar
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: "#412402", border: "0.5px solid #633806" }}>
              <Zap className="h-3.5 w-3.5" style={{ color: "#FAC775" }} />
              <span className="text-xs font-medium" style={{ color: "#FAC775" }}>Conversor inteligente de planilhas</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-5" style={{ color: "#F5F5F0" }}>
              Converta planilhas financeiras com{" "}
              <span style={{ color: "#FAC775" }}>precisão e agilidade</span>
            </h2>

            <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: "#888780" }}>
              Automatize a conversão de planilhas de recebimentos para baixa por aviso bancário. Simples, rápido e confiável.
            </p>

            <div className="flex items-center justify-center gap-3">
              <Button
                className="gradient-btn border-0 h-11 px-7 text-sm font-medium"
                onClick={() => navigate("/cadastro")}
              >
                Começar agora
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="h-11 px-7 text-sm border-[#444441] bg-[#1E1E20] hover:bg-[#2C2C2A]"
                style={{ color: "#B4B2A9" }}
                onClick={() => navigate("/login")}
              >
                Já tenho conta
              </Button>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-3 gap-5 mt-16"
          >
            {[
              { icon: FileSpreadsheet, title: "Multi-clientes", desc: "Suporte para diferentes formatos de planilha por cliente" },
              { icon: Zap, title: "Processamento rápido", desc: "Conversão instantânea com validação automática" },
              { icon: Shield, title: "Conferência segura", desc: "Verificação de valores com o extrato bancário" },
            ].map((f) => (
              <div key={f.title} className="card-elevated p-5 text-left">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3" style={{ background: "#412402" }}>
                  <f.icon className="h-4 w-4" style={{ color: "#EF9F27" }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#F5F5F0" }}>{f.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#5F5E5A" }}>{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-5 text-center">
        <p className="text-[11px]" style={{ color: "#5F5E5A" }}>
          © {new Date().getFullYear()} ReceitaFlow. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
