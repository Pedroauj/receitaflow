import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, History, Hash, DollarSign, ChevronRight } from "lucide-react";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";
import { clients } from "@/lib/clients";
import { getStats } from "@/lib/history";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Index = () => {
  const navigate = useNavigate();
  const stats = getStats();

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-b border-border/40 backdrop-blur-sm bg-background/60"
      >
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ReceitaFlow" className="h-10 w-10 object-contain glow-icon" />
            <div>
              <h1 className="text-xl font-bold text-primary tracking-tight neon-text">ReceitaFlow</h1>
              <p className="text-xs text-muted-foreground font-medium">Conversor de planilhas financeiras</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => navigate("/historico")}>
              <History className="h-4 w-4 mr-1.5" />
              Histórico
            </Button>
            <span className="text-xs text-primary/80 neon-border px-2.5 py-1 rounded-full font-medium">v1.0</span>
          </div>
        </div>
        <div className="neon-line" />
      </motion.header>

      {/* Stats */}
      {stats.totalPlanilhas > 0 && (
        <div className="max-w-5xl mx-auto px-6 pt-12 pb-6">
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-5"
          >
            Estatísticas gerais
          </motion.h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: FileSpreadsheet, label: "Planilhas", value: stats.totalPlanilhas },
              { icon: Hash, label: "Documentos", value: stats.totalDocumentos },
              { icon: DollarSign, label: "Valor total", value: stats.valorTotalProcessado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="card-elevated rounded-xl p-5 flex items-center gap-4"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="stat-number">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Hero badge */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className={`max-w-5xl mx-auto px-6 ${stats.totalPlanilhas > 0 ? 'pt-8' : 'pt-16'} pb-10`}
      >
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary neon-border bg-primary/10 px-4 py-2 rounded-full mb-5">
            <span className="neon-dot" />
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Importação financeira automatizada
          </div>
          <p className="text-muted-foreground leading-relaxed text-[15px]">
            Selecione um cliente abaixo para iniciar a conversão da planilha para o formato de importação financeira.
          </p>
        </div>
      </motion.div>

      {/* Clients grid */}
      <main className="max-w-5xl mx-auto px-6 pb-24">
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-5"
        >
          Clientes disponíveis
        </motion.h3>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client, i) => (
            <motion.div
              key={client.id}
              custom={i + 3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <Card
                className="flex flex-col justify-between card-elevated rounded-xl cursor-pointer border-0 h-full"
                onClick={() => navigate(client.route)}
              >
                <CardHeader className="pb-3 pt-6 px-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/12 flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base font-bold tracking-tight text-foreground">{client.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground">{client.description}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0 px-6 pb-5">
                  <Button
                    className="w-full justify-between gradient-btn text-white font-semibold border-0 rounded-lg h-10"
                    onClick={(e) => { e.stopPropagation(); navigate(client.route); }}
                  >
                    Abrir conversor
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;