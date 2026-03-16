import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import Index from "./pages/Index";
import MartinBrower from "./pages/MartinBrower";
import Historico from "./pages/Historico";
import EmAndamento from "./pages/EmAndamento";
import Clientes from "./pages/Clientes";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import ClientePlaceholder from "./pages/ClientePlaceholder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/em-andamento" element={<EmAndamento />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/cliente/martin-brower" element={<MartinBrower />} />
            <Route path="/cliente/minerva" element={<ClientePlaceholder clientName="Minerva" />} />
            <Route path="/cliente/danone" element={<ClientePlaceholder clientName="Danone" />} />
            <Route path="/cliente/platlog" element={<ClientePlaceholder clientName="Platlog" />} />
            <Route path="/cliente/jbs" element={<ClientePlaceholder clientName="JBS" />} />
            <Route path="/cliente/natura" element={<ClientePlaceholder clientName="Natura" />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
