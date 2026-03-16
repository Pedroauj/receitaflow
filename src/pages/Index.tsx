import { useNavigate } from "react-router-dom";
import { FileSpreadsheet } from "lucide-react";
import { clients } from "@/lib/clients";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Conversor de Planilhas</h1>
              <p className="text-sm text-muted-foreground">Importação financeira</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-6">
          Clientes disponíveis
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-lg">{client.name}</CardTitle>
                <CardDescription>{client.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate(client.route)} className="w-full">
                  Abrir
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
