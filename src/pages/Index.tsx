import { useMemo, useState } from "react";
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

      const docCount = clientRecords.reduce(
        (sum, record) => sum + record.quantidadeDocumentos,
        0
      );

      const totalValue = clientRecords.reduce(
        (sum, record) => sum + record.valorTotal,
        0
      );

      return {
        ...client,
        color: clientColors[client.id] || "#BA7517",
        initials: clientInitials[client.id] || client.name.slice(0, 2).toUpperCase(),
        docCount,
        totalValue,
        isActive: docCount > 0,
      };
    });
  }, [records]);

  const activeClients =
    enrichedClients.filter((client) => client.isActive).length || 1;

  const maxDocs = Math.max(
    ...enrichedClients.map((client) => client.docCount),
    1
  );

  const metricCards = [
    {
      icon: FileSpreadsheet,
      label: "Planilhas processadas",
      value: stats.totalPlanilhas,
      delta: "+12%",
      highlight: false,
    },
    {
      icon: FileText,
      label: "Documentos gerados",
      value: stats.totalDocumentos,
      delta: "+8%",
      highlight: false,
    },
    {
      icon: Users,
      label: "Clientes ativos",
      value: activeClients,
      delta: `${clients.length} no total`,
      highlight: false,
    },
    {
      icon: DollarSign,
      label: "Valor total processado",
      value: formatCurrency(stats.valorTotalProcessado),
      delta: "+15%",
      highlight: true,
    },
  ];

  return (
    <div className="p-5 sm:p-6 xl:p-7">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-7"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium mb-3"
              style={{
                background: "rgba(250, 199, 117, 0.08)",
                color: "#FAC775",
                border: "1px solid rgba(250, 199, 117, 0.14)",
              }}
            >
              Dashboard operacional
            </span>

            <h1
              className="text-[30px] leading-tight font-semibold"
              style={{ color: "#F5F5F0" }}
            >
              Visão geral
            </h1>

            <p
              className="text-sm mt-1 capitalize"
              style={{ color: "#888780" }}
            >
              {today}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="h-9 px-3 inline-flex items-center rounded-xl text-[11px] font-medium"
              style={{
                background: "#1E1E21",
                color: "#888780",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              v1.0
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl px-3 text-xs border-0"
              style={{
                background: "#1E1E21",
                color: "#B4B2A9",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
              }}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Filtrar
            </Button>

            <Button
              size="sm"
              className="h-9 rounded-xl px-4 text-xs border-0"
              style={{
                background: "#C8841C",
                color: "#FFF7E8",
              }}
              onClick={() => setShowClientPicker(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nova conversão
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4 mb-7">
        {metricCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="rounded-3xl border p-5"
            style={{
              background: card.highlight
                ? "linear-gradient(180deg, rgba(30,30,33,1) 0%, rgba(37,27,14,1) 100%)"
                : "#1E1E21",
              borderColor: card.highlight
                ? "rgba(200, 132, 28, 0.45)"
                : "rgba(255,255,255,0.06)",
              boxShadow: card.highlight
                ? "0 0 0 1px rgba(200,132,28,0.08) inset"
                : "none",
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-6">
              <div
                className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: card.highlight
                    ? "rgba(250, 199, 117, 0.14)"
                    : "rgba(250, 199, 117, 0.08)",
                }}
              >
                <card.icon
                  className="h-4.5 w-4.5"
                  style={{ color: "#EF9F27" }}
                />
              </div>

              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: "rgba(250, 199, 117, 0.08)",
                  color: "#FAC775",
                  border: "1px solid rgba(250, 199, 117, 0.10)",
                }}
              >
                <TrendingUp className="h-3 w-3" />
                {card.delta}
              </span>
            </div>

            <p
              className="text-[30px] leading-none font-semibold tracking-tight break-words"
              style={{ color: card.highlight ? "#FAC775" : "#F5F5F0" }}
            >
              {card.value}
            </p>

            <p
              className="text-[12px] mt-2"
              style={{ color: "#6E6C66" }}
            >
              {card.label}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="rounded-3xl border overflow-hidden"
          style={{
            background: "#1E1E21",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="px-5 sm:px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div>
              <h2
                className="text-base font-semibold"
                style={{ color: "#F5F5F0" }}
              >
                Clientes
              </h2>
              <p
                className="text-xs mt-1"
                style={{ color: "#6E6C66" }}
              >
                Resumo operacional por cliente
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl px-3 text-xs self-start sm:self-auto"
              style={{
                color: "#B4B2A9",
                background: "rgba(255,255,255,0.02)",
              }}
              onClick={() => navigate("/clientes")}
            >
              Ver todos
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>

          <div className="px-3 sm:px-4 py-3">
            <div className="hidden md:grid grid-cols-[minmax(0,1fr)_110px_120px_150px] px-3 py-2 text-[11px] uppercase tracking-[0.12em]">
              <span style={{ color: "#66645E" }}>Cliente</span>
              <span style={{ color: "#66645E" }}>Status</span>
              <span style={{ color: "#66645E" }}>Documentos</span>
              <span className="text-right" style={{ color: "#66645E" }}>
                Valor processado
              </span>
            </div>

            <div className="space-y-2">
              {enrichedClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => navigate(client.route)}
                  className="w-full rounded-2xl border px-3 sm:px-4 py-3 text-left transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderColor: "rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_110px_120px_150px] md:items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-10 w-10 rounded-2xl flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{
                          background: `${client.color}20`,
                          color: client.color,
                        }}
                      >
                        {client.initials}
                      </div>

                      <div className="min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: "#F5F5F0" }}
                        >
                          {client.name}
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: "#6E6C66" }}
                        >
                          {client.docCount > 0
                            ? `${client.docCount} documentos processados`
                            : "Nenhum documento processado"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          background: client.isActive
                            ? "rgba(52, 168, 83, 0.14)"
                            : "rgba(231, 76, 60, 0.14)",
                          color: client.isActive ? "#6AD488" : "#FF8A7A",
                        }}
                      >
                        {client.isActive ? "Ativo" : "Pendente"}
                      </span>
                    </div>

                    <div
                      className="text-sm font-medium"
                      style={{ color: "#E2E0D8" }}
                    >
                      {client.docCount}
                    </div>

                    <div
                      className="text-sm font-semibold tabular-nums md:text-right"
                      style={{ color: client.totalValue > 0 ? "#FAC775" : "#8A877F" }}
                    >
                      {client.totalValue > 0 ? formatCurrency(client.totalValue) : "—"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div
            className="px-5 sm:px-6 py-5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "#66645E" }}
                >
                  Volume por cliente
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "#888780" }}
                >
                  Distribuição de documentos processados
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {enrichedClients.map((client) => {
                const pct = client.docCount > 0 ? Math.max((client.docCount / maxDocs) * 100, 4) : 0;

                return (
                  <div key={client.id} className="grid grid-cols-[32px_minmax(0,1fr)_52px] items-center gap-3">
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: "#A9A69C" }}
                    >
                      {client.initials}
                    </span>

                    <div
                      className="h-2.5 rounded-full overflow-hidden"
                      style={{ background: "#2A2A2D" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          background: client.docCount > 0 ? client.color : "#3A393D",
                        }}
                      />
                    </div>

                    <span
                      className="text-[11px] text-right tabular-nums"
                      style={{ color: "#A9A69C" }}
                    >
                      {client.docCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-3xl border flex flex-col overflow-hidden"
          style={{
            background: "#1E1E21",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="px-5 py-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <h2
              className="text-base font-semibold"
              style={{ color: "#F5F5F0" }}
            >
              Atividade recente
            </h2>
            <p
              className="text-xs mt-1"
              style={{ color: "#6E6C66" }}
            >
              Últimas ações registradas no sistema
            </p>
          </div>

          <div className="flex-1 px-5 py-4 space-y-3">
            {recentActivities.map((activity, i) => (
              <div
                key={i}
                className="rounded-2xl border p-3"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderColor: "rgba(255,255,255,0.04)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: activity.color }}
                  />
                  <div className="min-w-0">
                    <p
                      className="text-[13px] leading-relaxed"
                      style={{ color: "#D1CEC4" }}
                    >
                      {activity.title}
                    </p>
                    <p
                      className="text-[11px] flex items-center gap-1.5 mt-1"
                      style={{ color: "#6E6C66" }}
                    >
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="px-5 py-4 space-y-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <button
              className="w-full h-10 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              style={{
                background: "rgba(250, 199, 117, 0.08)",
                color: "#FAC775",
                border: "1px solid rgba(250, 199, 117, 0.18)",
              }}
              onClick={() => setShowClientPicker(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Iniciar nova conversão
            </button>

            <button
              className="w-full h-10 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              style={{
                background: "#232326",
                color: "#C0BDB3",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
              onClick={() => navigate("/historico")}
            >
              <Eye className="h-3.5 w-3.5" />
              Ver histórico completo
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showClientPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.62)",
              marginLeft: "-220px",
              paddingLeft: "220px",
            }}
            onClick={() => setShowClientPicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md mx-4 rounded-3xl border overflow-hidden"
              style={{
                background: "#1E1E21",
                borderColor: "rgba(255,255,255,0.06)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div>
                  <h2
                    className="text-base font-semibold"
                    style={{ color: "#F5F5F0" }}
                  >
                    Nova conversão
                  </h2>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "#6E6C66" }}
                  >
                    Selecione o cliente para iniciar
                  </p>
                </div>

                <button
                  onClick={() => setShowClientPicker(false)}
                  className="h-9 w-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    color: "#888780",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 max-h-[420px] overflow-y-auto">
                {enrichedClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors"
                    style={{ background: "transparent" }}
                    onClick={() => {
                      setShowClientPicker(false);
                      navigate(client.route);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#242426";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div
                      className="h-10 w-10 rounded-2xl flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{
                        background: `${client.color}20`,
                        color: client.color,
                      }}
                    >
                      {client.initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "#F5F5F0" }}
                      >
                        {client.name}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: "#6E6C66" }}
                      >
                        {client.docCount > 0
                          ? `${client.docCount} documentos disponíveis`
                          : "Cliente aguardando movimentação"}
                      </p>
                    </div>

                    <ArrowRight
                      className="h-4 w-4 shrink-0"
                      style={{ color: "#888780" }}
                    />
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