import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, History, Hash, DollarSign, ChevronRight } from "lucide-react";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";
import { clients } from "@/lib/clients";
import { getStats } from "@/lib/history";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

const Index = () => {
  const navigate = useNavigate();
  const stats = getStats();

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="max-w-[1200px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ReceitaFlow" className="h-8 w-8 object-contain" />
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                Receita<span className="text-primary">Flow</span>
              </h1>
              <p className="text-[11px] text-muted-foreground">Conversor de planilhas financeiras</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-xs h-8 px-3"
              onClick={() => navigate("/historico")}
            >
              <History className="h-3.5 w-3.5 mr-1.5" />
              Histórico
            </Button>
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium">
              v1.0
            </span>
          </div>
        </div>
        <div className="neon-line" />
      </motion.header>

      <div className="max-w-[1200px] mx-auto px-8">
        {/* Stats */}
        {stats.totalPlanilhas > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="pt-10 pb-2"
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-4">
              Resumo
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: FileSpreadsheet, label: "Planilhas", value: stats.totalPlanilhas },
                { icon: Hash, label: "Documentos", value: stats.totalDocumentos },
                {
                  icon: DollarSign,
                  label: "Valor total",
                  value: stats.valorTotalProcessado.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className="rounded-lg bg-secondary/50 border border-border/50 px-5 py-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                  <p className="stat-number">{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Section title */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className={`${stats.totalPlanilhas > 0 ? "pt-10" : "pt-14"} pb-6`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="neon-dot" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
              Clientes disponíveis
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg">
            Selecione um cliente para iniciar a conversão da planilha para o formato de importação financeira.
          </p>
        </motion.section>

        {/* Clients grid */}
        <section className="pb-24">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client, i) => (
              <motion.div
                key={client.id}
                custom={i + 2}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <div
                  className="card-elevated rounded-lg px-5 py-4 cursor-pointer group flex items-center gap-4"
                  onClick={() => navigate(client.route)}
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground flex-1">{client.name}</h3>
                  <Button
                    size="sm"
                    className="gradient-btn text-white text-xs font-medium border-0 rounded-md h-8 px-4 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(client.route);
                    }}
                  >
                    Abrir conversor
                    <ChevronRight className="h-3.5 w-3.5 ml-1 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
