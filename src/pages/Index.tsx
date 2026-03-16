import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, ArrowRight, Zap } from "lucide-react";
import { clients } from "@/lib/clients";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">SheetFlow</h1>
              <p className="text-xs text-muted-foreground">Conversor de planilhas financeiras</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full font-medium">v1.0</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-6">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Importação financeira automatizada
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight mb-3">
            Converta planilhas de clientes em segundos
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Selecione um cliente abaixo para iniciar a conversão da planilha para o formato de importação financeira.
          </p>
        </div>
      </div>

      {/* Clients grid */}
      <main className="max-w-5xl mx-auto px-6 pb-20">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Clientes disponíveis
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="flex flex-col justify-between group hover:border-primary/30 transition-colors cursor-pointer bg-card"
              onClick={() => navigate(client.route)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold tracking-tight">{client.name}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">{client.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-0">
                <Button
                  variant="ghost"
                  className="w-full justify-between text-muted-foreground group-hover:text-primary transition-colors"
                  onClick={(e) => { e.stopPropagation(); navigate(client.route); }}
                >
                  Abrir conversor
                  <ArrowRight className="h-4 w-4" />
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
