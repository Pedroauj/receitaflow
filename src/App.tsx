import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import EsqueciSenha from "./pages/EsqueciSenha";
import ResetPassword from "./pages/ResetPassword";
import Index from "./pages/Index";
import MartinBrower from "./pages/MartinBrower";
import Historico from "./pages/Historico";
import EmAndamento from "./pages/EmAndamento";
import Clientes from "./pages/Clientes";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import ClientePlaceholder from "./pages/ClientePlaceholder";
import Natura from "./pages/Natura";
import Danone from "@/pages/Danone";
import Platlog from "@/pages/Platlog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Index />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/em-andamento" element={<EmAndamento />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/cliente/martin-brower" element={<MartinBrower />} />
              <Route path="/cliente/minerva" element={<ClientePlaceholder clientName="Minerva" />} />
              <Route path="/cliente/danone" element={<Danone />} />
              <Route path="/cliente/platlog" element={<Platlog />} />
              <Route path="/cliente/jbs" element={<ClientePlaceholder clientName="JBS" />} />
              <Route path="/cliente/natura" element={<Natura />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
