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
  Activity,
  BarChart3,
  Zap,
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
    { icon: FileSpreadsheet, label: "Planilhas processadas", value: stats.totalPlanilhas, delta: "+12%", color: "hsl(var(--primary))" },
    { icon: FileText, label: "Documentos gerados", value: stats.totalDocumentos, delta: "+8%", color: "#5B9BD5" },
    { icon: Users, label: "Clientes ativos", value: activeClients, delta: `${clients.length} total`, color: "#4AAF60" },
    { icon: DollarSign, label: "Valor total processado", value: formatCurrency(stats.valorTotalProcessado), delta: "+15%", color: "#D4922A", highlight: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Visão geral</h1>
            </div>
            <p className="text-sm text-muted-foreground capitalize pl-11">{today}</p>
          </div>
          <button
            onClick={() => setShowClientPicker(true)}
            className="h-10 px-5 rounded-xl text-[13px] font-medium bg-primary text-primary-foreground transition-all duration-150 hover:brightness-110 active:scale-[0.97] inline-flex items-center gap-2 shadow-[0_1px_12px_hsl(var(--primary)/0.25)]"
          >
            <Plus className="h-4 w-4" />
            Nova conversão
          </button>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {metricCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.08 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`group relative rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/10 cursor-default ${
              card.highlight
                ? "border-primary/25 bg-gradient-to-br from-primary/[0.06] to-primary/[0.02]"
                : "border-border bg-card hover:border-border/80"
            }`}
          >
            <div className="flex items-center justify-between mb-5">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{ background: `${card.color}18` }}
              >
                <card.icon className="h-[18px] w-[18px]" style={{ color: card.color }} />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 bg-primary/10 text-primary">
                <TrendingUp className="h-3 w-3" />
                {card.delta}
              </span>
            </div>
            <p className={`text-[26px] font-bold tracking-tight leading-none ${card.highlight ? "text-primary" : "text-foreground"}`}>
              {card.value}
            </p>
            <p className="text-[12px] text-muted-foreground mt-2 font-medium">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        {/* Clients Card */}
        <motion.div
          initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="px-6 py-5 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Clientes</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Resumo operacional por cliente</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/clientes")}
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 hover:bg-accent"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[minmax(0,1fr)_100px_80px_140px] px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground/60 font-semibold border-b border-border/40 bg-accent/30">
            <span>Cliente</span>
            <span>Status</span>
            <span>Docs</span>
            <span className="text-right">Valor</span>
          </div>

          {/* Client Rows */}
          <div className="divide-y divide-border/30">
            {enrichedClients.map((client, i) => (
              <motion.button
                key={client.id}
                type="button"
                onClick={() => navigate(client.route)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.04, duration: 0.4 }}
                className="w-full px-6 py-3.5 text-left transition-all duration-150 hover:bg-accent/50 active:scale-[0.995] group/row"
              >
                <div className="flex flex-col gap-2 md:grid md:grid-cols-[minmax(0,1fr)_100px_80px_140px] md:items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 transition-transform duration-200 group-hover/row:scale-105"
                      style={{ background: `${client.color}15`, color: client.color }}
                    >
                      {client.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate group-hover/row:text-primary transition-colors">{client.name}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        {client.description.length > 40 ? client.description.slice(0, 40) + "…" : client.description}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      client.isActive
                        ? "bg-[hsl(142,40%,40%)]/10 text-[hsl(142,50%,60%)]"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${client.isActive ? "bg-[hsl(142,50%,60%)]" : "bg-muted-foreground/40"}`} />
                      {client.isActive ? "Ativo" : "Pendente"}
                    </span>
                  </div>
                  <div className="text-[13px] font-semibold text-foreground/80 tabular-nums">{client.docCount}</div>
                  <div className={`text-[13px] font-bold tabular-nums md:text-right ${
                    client.totalValue > 0 ? "text-primary" : "text-muted-foreground/40"
                  }`}>
                    {client.totalValue > 0 ? formatCurrency(client.totalValue) : "—"}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Volume Chart */}
          <div className="px-6 py-5 border-t border-border bg-accent/20">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-4">
              Volume por cliente
            </p>
            <div className="space-y-3">
              {enrichedClients.map((client) => {
                const pct = client.docCount > 0 ? Math.max((client.docCount / maxDocs) * 100, 4) : 0;
                return (
                  <div key={client.id} className="grid grid-cols-[32px_minmax(0,1fr)_44px] items-center gap-3">
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: client.color }}
                    >
                      {client.initials}
                    </span>
                    <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        style={{ background: client.docCount > 0 ? client.color : "hsl(var(--muted))" }}
                      />
                    </div>
                    <span className="text-[11px] text-right tabular-nums font-semibold text-muted-foreground">{client.docCount}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center">
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Atividade recente</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Últimas ações registradas</p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-5 py-4 space-y-2.5">
            {recentActivities.map((activity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl border border-border/40 p-3.5 transition-all duration-200 hover:bg-accent/40 hover:border-border/70 cursor-default"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${activity.color}15` }}
                  >
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: activity.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-foreground/90 leading-relaxed font-medium">{activity.title}</p>
                    <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1 mt-1.5">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="px-5 py-4 space-y-2.5 border-t border-border">
            <button
              className="w-full h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.97] shadow-[0_1px_8px_hsl(var(--primary)/0.2)]"
              onClick={() => setShowClientPicker(true)}
            >
              <Plus className="h-4 w-4" />
              Iniciar nova conversão
            </button>
            <button
              className="w-full h-10 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-all duration-150 bg-accent text-muted-foreground border border-border hover:text-foreground hover:border-border/80 active:scale-[0.97]"
              onClick={() => navigate("/historico")}
            >
              <Eye className="h-4 w-4" />
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowClientPicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md mx-4 rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-black/40"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 flex items-center justify-between border-b border-border">
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">Nova conversão</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Selecione o cliente para iniciar</p>
                </div>
                <button
                  onClick={() => setShowClientPicker(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150 active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3 max-h-[400px] overflow-y-auto space-y-1">
                {enrichedClients.map((client, i) => (
                  <motion.button
                    key={client.id}
                    type="button"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 hover:bg-accent active:scale-[0.98] group/pick"
                    onClick={() => { setShowClientPicker(false); navigate(client.route); }}
                  >
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0 transition-transform duration-200 group-hover/pick:scale-105"
                      style={{ background: `${client.color}15`, color: client.color }}
                    >
                      {client.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate group-hover/pick:text-primary transition-colors">{client.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {client.docCount > 0 ? `${client.docCount} documentos processados` : "Aguardando movimentação"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover/pick:text-primary group-hover/pick:translate-x-0.5 transition-all duration-200" />
                  </motion.button>
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
