import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, ArrowRight, Zap, History, Hash, DollarSign, ChevronRight } from "lucide-react";
import { clients } from "@/lib/clients";
import { getStats } from "@/lib/history";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const stats = getStats();

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/60">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center glow-icon">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">ReceitaFlow</h1>
              <p className="text-xs text-muted-foreground font-medium">Conversor de planilhas financeiras</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => navigate("/historico")}>
              <History className="h-4 w-4 mr-1.5" />
              Histórico
            </Button>
            <span className="text-xs text-muted-foreground bg-secondary/80 border border-border/50 px-2.5 py-1 rounded-full font-medium">v1.0</span>
          </div>
        </div>
      </header>

      {/* Stats */}
      {stats.totalPlanilhas > 0 && (
        <div className="max-w-5xl mx-auto px-6 pt-12 pb-6">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-5">
            Estatísticas gerais
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-elevated rounded-xl p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Planilhas</p>
                <p className="stat-number">{stats.totalPlanilhas}</p>
              </div>
            </div>
            <div className="card-elevated rounded-xl p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Documentos</p>
                <p className="stat-number">{stats.totalDocumentos}</p>
              </div>
            </div>
            <div className="card-elevated rounded-xl p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Valor total</p>
                <p className="stat-number">
                  {stats.valorTotalProcessado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero badge */}
      <div className={`max-w-5xl mx-auto px-6 ${stats.totalPlanilhas > 0 ? 'pt-8' : 'pt-16'} pb-10`}>
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-5">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Importação financeira automatizada
          </div>
          <p className="text-muted-foreground leading-relaxed text-[15px]">
            Selecione um cliente abaixo para iniciar a conversão da planilha para o formato de importação financeira.
          </p>
        </div>
      </div>

      {/* Clients grid */}
      <main className="max-w-5xl mx-auto px-6 pb-24">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-5">
          Clientes disponíveis
        </h3>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="flex flex-col justify-between card-elevated rounded-xl cursor-pointer border-0"
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
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;