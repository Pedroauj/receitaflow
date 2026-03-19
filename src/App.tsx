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
import Conciliacao from "./pages/Conciliacao";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/esqueci-senha" element={<EsqueciSenha />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Layout protegido */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute requiredPermission="dashboard.view">
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/historico"
                  element={
                    <ProtectedRoute requiredPermission="historico.view">
                      <Historico />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/em-andamento"
                  element={
                    <ProtectedRoute requiredPermission="andamento.view">
                      <EmAndamento />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clientes"
                  element={
                    <ProtectedRoute requiredPermission="clientes.view">
                      <Clientes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/conciliacao"
                  element={
                    <ProtectedRoute requiredPermission="conciliacao.view">
                      <Conciliacao />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/configuracoes"
                  element={
                    <ProtectedRoute requiredPermission="configuracoes.view">
                      <Configuracoes />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/cliente/martin-brower"
                  element={
                    <ProtectedRoute requiredPermission="cliente.martin-brower.view">
                      <MartinBrower />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cliente/minerva"
                  element={
                    <ProtectedRoute requiredPermission="cliente.minerva.view">
                      <ClientePlaceholder clientName="Minerva" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cliente/danone"
                  element={
                    <ProtectedRoute requiredPermission="cliente.danone.view">
                      <Danone />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cliente/platlog"
                  element={
                    <ProtectedRoute requiredPermission="cliente.platlog.view">
                      <Platlog />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cliente/jbs"
                  element={
                    <ProtectedRoute requiredPermission="cliente.jbs.view">
                      <ClientePlaceholder clientName="JBS" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cliente/natura"
                  element={
                    <ProtectedRoute requiredPermission="cliente.natura.view">
                      <Natura />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;