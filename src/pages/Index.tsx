// (código reduzido aqui pra caber melhor — se quiser eu te mando versão comentada depois)

import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  History,
  FileSearch,
  Fuel,
  BarChart3,
  Building2,
  Settings,
  ArrowRight,
  Sun,
  Moon,
  CloudSun,
  Sparkles,
  FileSpreadsheet,
  Hash,
  DollarSign,
  Clock,
  Activity,
  Layers,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getStats, getRecords } from "@/lib/history";
import type { LucideIcon } from "lucide-react";

const MODULE_REGISTRY = [
  { key: "dashboard", title: "Dashboard", icon: LayoutDashboard, path: "/dashboard", color: "#EF9F27" },
  { key: "historico", title: "Histórico", icon: History, path: "/historico", color: "#5B9BD5" },
  { key: "conciliacao", title: "NF-e / NFS-e", icon: FileSearch, path: "/conciliacao", color: "#4AAF60" },
  { key: "abastecimento", title: "Abastecimento", icon: Fuel, path: "/abastecimento", color: "#D4922A" },
  { key: "clientes", title: "Clientes", icon: Building2, path: "/clientes", color: "#3BBFA0" },
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canView, isMaster, loading } = useModulePermissions();

  const stats = getStats();

  const accessibleModules = useMemo(() => {
    if (loading) return [];
    return MODULE_REGISTRY.filter((m) => canView(m.key) || isMaster);
  }, [loading, canView, isMaster]);

  if (loading) {
    return <Loader2 className="animate-spin" />;
  }

  return (
    <div className="space-y-10">

      {/* HERO */}
      <div className="rounded-3xl border border-white/10 p-8 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl">
        <h1 className="text-4xl font-bold mb-2">
          Bem-vindo de volta
        </h1>
        <p className="text-white/60 mb-6">
          Aqui está um resumo do seu sistema
        </p>

        <div className="text-5xl font-bold">
          {stats.valorTotalProcessado.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </div>
      </div>

      {/* CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          <p className="text-sm text-white/60">Módulos</p>
          <p className="text-3xl font-bold">{accessibleModules.length}</p>
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          <p className="text-sm text-white/60">Documentos</p>
          <p className="text-3xl font-bold">{stats.totalDocumentos}</p>
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          <p className="text-sm text-white/60">Planilhas</p>
          <p className="text-3xl font-bold">{stats.totalPlanilhas}</p>
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          <p className="text-sm text-white/60">Processado</p>
          <p className="text-3xl font-bold">
            {stats.valorTotalProcessado.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
      </div>

      {/* ATALHOS */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Atalhos rápidos</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accessibleModules.map((mod) => (
            <button
              key={mod.key}
              onClick={() => navigate(mod.path)}
              className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              <mod.icon className="mb-3" />
              <p className="font-semibold">{mod.title}</p>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Index;