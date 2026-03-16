import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileSpreadsheet,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  Filter,
  Plus,
  Eye,
  ArrowRight,
  Clock,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clients } from "@/lib/clients";
import { getStats, getRecords } from "@/lib/history";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: "easeOut" as const },
  }),
};

const clientColors: Record<string, string> = {
  "martin-brower": "#BA7517",
  minerva: "#4A90D9",
  danone: "#34A853",
  platlog: "#9B59B6",
  jbs: "#E74C3C",
  natura: "#1ABC9C",
};

const clientInitials: Record<string, string> = {
  "martin-brower": "MB",
  minerva: "MI",
  danone: "DA",
  platlog: "PL",
  jbs: "JB",
  natura: "NA",
};

const recentActivities = [
  { color: "#BA7517", title: "Martin Brower — 12 documentos processados", time: "Há 2 horas" },
  { color: "#34A853", title: "Danone — Novo cliente configurado", time: "Há 5 horas" },
  { color: "#4A90D9", title: "Minerva — Aguardando configuração", time: "Há 1 dia" },
  { color: "#9B59B6", title: "Platlog — Cadastro criado", time: "Há 2 dias" },
];

const Index = () => {
  const navigate = useNavigate();
  const [showClientPicker, setShowClientPicker] = useState(false);
  const stats = getStats();
  const records = getRecords();

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activeClients = clients.filter((c) =>
    records.some((r) => r.cliente.toLowerCase().includes(c.id.replace("-", " ").split(" ")[0]))
  ).length || 1;

  const maxDocs = Math.max(...clients.map((c) => {
    const count = records.filter((r) =>
      r.cliente.toLowerCase().includes(c.id.replace("-", " ").split(" ")[0])
    ).reduce((sum, r) => sum + r.quantidadeDocumentos, 0);
    return count;
  }), 1);

  return (
    <div className="p-7">
      {/* Topbar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>
            Visão geral
          </h1>
          <p className="text-xs mt-0.5 capitalize" style={{ color: "#888780" }}>
            {today}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-medium px-2 py-1 rounded-md"
            style={{ background: "#2C2C2A", color: "#888780" }}
          >
            v1.0
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-[#444441] bg-[#1E1E20] hover:bg-[#2C2C2A]"
            style={{ color: "#B4B2A9" }}
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filtrar
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gradient-btn border-0"
            onClick={() => setShowClientPicker(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nova conversão
          </Button>
        </div>
      </motion.div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { icon: FileSpreadsheet, label: "Planilhas processadas", value: stats.totalPlanilhas, delta: "+12%", highlight: false },
          { icon: FileText, label: "Documentos gerados", value: stats.totalDocumentos, delta: "+8%", highlight: false },
          { icon: Users, label: "Clientes ativos", value: activeClients, delta: `${clients.length} total`, highlight: false },
          {
            icon: DollarSign,
            label: "Valor total processado",
            value: stats.valorTotalProcessado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            delta: "+15%",
            highlight: true,
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="card-elevated p-5"
            style={card.highlight ? { borderColor: "#633806" } : {}}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "#412402" }}>
                <card.icon className="h-4 w-4" style={{ color: "#EF9F27" }} />
              </div>
              <span className="amber-badge flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {card.delta}
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight" style={{ color: card.highlight ? "#FAC775" : "#F5F5F0" }}>
              {card.value}
            </p>
            <p className="text-[11px] mt-1" style={{ color: "#5F5E5A" }}>{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="flex gap-5">
        {/* Client table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="card-elevated flex-1 overflow-hidden"
        >
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "0.5px solid #2C2C2A" }}>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "#F5F5F0" }}>Clientes</h2>
              <p className="text-[11px] mt-0.5" style={{ color: "#5F5E5A" }}>{clients.length} clientes cadastrados</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2" style={{ color: "#888780" }} onClick={() => navigate("/clientes")}>
              Ver todos <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div>
            {clients.map((client) => {
              const docCount = records.filter((r) =>
                r.cliente.toLowerCase().includes(client.id.replace("-", " ").split(" ")[0])
              ).reduce((sum, r) => sum + r.quantidadeDocumentos, 0);
              const totalValue = records.filter((r) =>
                r.cliente.toLowerCase().includes(client.id.replace("-", " ").split(" ")[0])
              ).reduce((sum, r) => sum + r.valorTotal, 0);
              const isActive = docCount > 0;
              const color = clientColors[client.id] || "#BA7517";

              return (
                <div
                  key={client.id}
                  className="px-5 py-3 flex items-center gap-4 cursor-pointer transition-colors"
                  onClick={() => navigate(client.route)}
                  style={{ borderBottom: "0.5px solid #2C2C2A" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#242426")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: `${color}20`, color }}
                  >
                    {clientInitials[client.id] || client.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#F5F5F0" }}>{client.name}</p>
                    <p className="text-[11px]" style={{ color: "#5F5E5A" }}>{docCount} documentos</p>
                  </div>
                  <span className={isActive ? "status-active" : "status-pending"}>
                    {isActive ? "Ativo" : "Pendente"}
                  </span>
                  <p className="text-sm font-semibold tabular-nums w-28 text-right" style={{ color: "#FAC775" }}>
                    {totalValue > 0 ? totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Mini bar chart */}
          <div className="px-5 py-4" style={{ borderTop: "0.5px solid #2C2C2A" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#5F5E5A" }}>
              Volume por cliente
            </p>
            <div className="space-y-2">
              {clients.map((client) => {
                const docCount = records.filter((r) =>
                  r.cliente.toLowerCase().includes(client.id.replace("-", " ").split(" ")[0])
                ).reduce((sum, r) => sum + r.quantidadeDocumentos, 0);
                const pct = Math.max((docCount / maxDocs) * 100, 4);
                const color = clientColors[client.id] || "#BA7517";
                return (
                  <div key={client.id} className="flex items-center gap-3">
                    <span className="text-[10px] w-6 shrink-0 font-medium" style={{ color: "#888780" }}>
                      {clientInitials[client.id] || "??"}
                    </span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: "#2C2C2A" }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-[10px] w-6 text-right tabular-nums" style={{ color: "#888780" }}>{docCount}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="card-elevated w-[320px] shrink-0 flex flex-col"
        >
          <div className="px-5 py-4" style={{ borderBottom: "0.5px solid #2C2C2A" }}>
            <h2 className="text-sm font-semibold" style={{ color: "#F5F5F0" }}>Atividade recente</h2>
            <p className="text-[11px] mt-0.5" style={{ color: "#5F5E5A" }}>Últimas ações do sistema</p>
          </div>
          <div className="flex-1 px-5 py-3 space-y-4">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ background: activity.color }} />
                <div className="min-w-0">
                  <p className="text-xs leading-relaxed" style={{ color: "#B4B2A9" }}>{activity.title}</p>
                  <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "#5F5E5A" }}>
                    <Clock className="h-3 w-3" />{activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 space-y-2" style={{ borderTop: "0.5px solid #2C2C2A" }}>
            <button
              className="w-full h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              style={{ border: "0.5px solid #633806", color: "#FAC775", background: "transparent" }}
              onClick={() => navigate("/cliente/martin-brower")}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#412402")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Plus className="h-3.5 w-3.5" />Iniciar nova conversão
            </button>
            <button
              className="w-full h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              style={{ border: "0.5px solid #444441", color: "#B4B2A9", background: "#1E1E20" }}
              onClick={() => navigate("/historico")}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2C2C2A")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1E1E20")}
            >
              <Eye className="h-3.5 w-3.5" />Ver histórico completo
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
