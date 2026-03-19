import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileSpreadsheet,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
  ArrowRight,
  Clock,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clients } from "@/lib/clients";
import { getStats, getRecords } from "@/lib/history";

const clientColors: Record<string, string> = {
  "martin-brower": "#D4922A",
  minerva: "#5B9BD5",
  danone: "#4AAF60",
  platlog: "#9B7BD4",
  jbs: "#D95F5F",
  natura: "#3BBFA0",
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
  { color: "#D4922A", title: "Martin Brower — 12 documentos processados", time: "Há 2 horas" },
  { color: "#4AAF60", title: "Danone — Novo cliente configurado", time: "Há 5 horas" },
  { color: "#5B9BD5", title: "Minerva — Aguardando configuração", time: "Há 1 dia" },
  { color: "#9B7BD4", title: "Platlog — Cadastro criado", time: "Há 2 dias" },
];

const normalizeClientKey = (value: string) =>
  value.toLowerCase().replace("-", " ").split(" ")[0];

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

  const enrichedClients = useMemo(() => {
    return clients.map((client) => {
      const clientKey = normalizeClientKey(client.id);
      const clientRecords = records.filter((record) =>
        record.cliente.toLowerCase().includes(clientKey)
      );
      const docCount = clientRecords.reduce((sum, record) => sum + record.quantidadeDocumentos, 0);
      const totalValue = clientRecords.reduce((sum, record) => sum + record.valorTotal, 0);
      return {
        ...client,
        color: clientColors[client.id] || "#D4922A",
        initials: clientInitials[client.id] || client.name.slice(0, 2).toUpperCase(),
        docCount,
        totalValue,
        isActive: docCount > 0,
      };
    });
  }, [records]);

  const activeClients = enrichedClients.filter((c) => c.isActive).length || 1;
  const maxDocs = Math.max(...enrichedClients.map((c) => c.docCount), 1);

  const metricCards = [
    { icon: FileSpreadsheet, label: "Planilhas processadas", value: stats.totalPlanilhas, delta: "+12%" },
    { icon: FileText, label: "Documentos gerados", value: stats.totalDocumentos, delta: "+8%" },
    { icon: Users, label: "Clientes ativos", value: activeClients, delta: `${clients.length} total` },
    { icon: DollarSign, label: "Valor total processado", value: formatCurrency(stats.valorTotalProcessado), delta: "+15%", highlight: true },
  ];

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-8"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Visão geral</h1>
            <p className="text-sm text-muted-foreground mt-1 capitalize">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClientPicker(true)}
              className="h-9 px-4 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground transition-all duration-150 hover:opacity-90 inline-flex items-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova conversão
            </button>
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4 mb-8">
        {metricCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className={`rounded-xl border p-5 transition-colors ${
              card.highlight ? "border-primary/20 bg-primary/[0.04]" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                card.highlight ? "bg-primary/15" : "bg-muted"
              }`}>
                <card.icon className={`h-4 w-4 ${card.highlight ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary/80">
                <TrendingUp className="h-3 w-3" />
                {card.delta}
              </span>
            </div>
            <p className={`text-2xl font-semibold tracking-tight ${card.highlight ? "text-primary" : "text-foreground"}`}>
              {card.value}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_340px]">
        {/* Clients Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="px-5 py-4 flex items-center justify-between border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Clientes</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Resumo operacional por cliente</p>
            </div>
            <button
              onClick={() => navigate("/clientes")}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[minmax(0,1fr)_100px_100px_140px] px-5 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium border-b border-border/50">
            <span>Cliente</span>
            <span>Status</span>
            <span>Docs</span>
            <span className="text-right">Valor</span>
          </div>

          {/* Client Rows */}
          <div>
            {enrichedClients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => navigate(client.route)}
                className="w-full px-5 py-3 text-left transition-colors duration-150 hover:bg-accent/50 border-b border-border/30 last:border-b-0"
              >
                <div className="flex flex-col gap-2 md:grid md:grid-cols-[minmax(0,1fr)_100px_100px_140px] md:items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{ background: `${client.color}18`, color: client.color }}
                    >
                      {client.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{client.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {client.docCount > 0 ? `${client.docCount} docs` : "Nenhum doc"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      client.isActive
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {client.isActive ? "Ativo" : "Pendente"}
                    </span>
                  </div>
                  <div className="text-[13px] font-medium text-foreground/80">{client.docCount}</div>
                  <div className={`text-[13px] font-semibold tabular-nums md:text-right ${
                    client.totalValue > 0 ? "text-primary" : "text-muted-foreground/50"
                  }`}>
                    {client.totalValue > 0 ? formatCurrency(client.totalValue) : "—"}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Volume Chart */}
          <div className="px-5 py-4 border-t border-border">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-3">
              Volume por cliente
            </p>
            <div className="space-y-2.5">
              {enrichedClients.map((client) => {
                const pct = client.docCount > 0 ? Math.max((client.docCount / maxDocs) * 100, 4) : 0;
                return (
                  <div key={client.id} className="grid grid-cols-[28px_minmax(0,1fr)_40px] items-center gap-2.5">
                    <span className="text-[11px] font-medium text-muted-foreground">{client.initials}</span>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, background: client.docCount > 0 ? client.color : "hsl(var(--muted))" }}
                      />
                    </div>
                    <span className="text-[11px] text-right tabular-nums text-muted-foreground">{client.docCount}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="rounded-xl border border-border bg-card flex flex-col overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Atividade recente</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Últimas ações registradas</p>
          </div>

          <div className="flex-1 px-4 py-3 space-y-2">
            {recentActivities.map((activity, i) => (
              <div key={i} className="rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/30">
                <div className="flex items-start gap-2.5">
                  <div className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ background: activity.color }} />
                  <div className="min-w-0">
                    <p className="text-[13px] text-foreground/80 leading-relaxed">{activity.title}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 space-y-2 border-t border-border">
            <button
              className="w-full h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
              onClick={() => setShowClientPicker(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Iniciar nova conversão
            </button>
            <button
              className="w-full h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors bg-accent text-muted-foreground border border-border hover:text-foreground"
              onClick={() => navigate("/historico")}
            >
              <Eye className="h-3.5 w-3.5" />
              Ver histórico completo
            </button>
          </div>
        </motion.div>
      </div>

      {/* Client Picker Modal */}
      <AnimatePresence>
        {showClientPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowClientPicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md mx-4 rounded-xl border border-border bg-card overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 flex items-center justify-between border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Nova conversão</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Selecione o cliente</p>
                </div>
                <button
                  onClick={() => setShowClientPicker(false)}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-2 max-h-[400px] overflow-y-auto">
                {enrichedClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-accent"
                    onClick={() => { setShowClientPicker(false); navigate(client.route); }}
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{ background: `${client.color}18`, color: client.color }}
                    >
                      {client.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{client.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {client.docCount > 0 ? `${client.docCount} documentos` : "Aguardando movimentação"}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
