import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { clients } from "@/lib/clients";
import { getRecords } from "@/lib/history";
import {
  ArrowRight,
  Search,
  Users,
  FileText,
  Activity,
} from "lucide-react";

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

const normalizeText = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const formatDocsLabel = (count: number) =>
  `${count} ${count === 1 ? "documento" : "documentos"}`;

const MotorCliente = () => {
  const navigate = useNavigate();
  const records = getRecords();
  const [search, setSearch] = useState("");

  const enrichedClients = useMemo(() => {
    return clients.map((client) => {
      const color = clientColors[client.id] || "#D4922A";
      const initials =
        clientInitials[client.id] ||
        client.name.slice(0, 2).toUpperCase();

      const normalizedClientId = normalizeText(client.id.replace(/-/g, " "));
      const normalizedClientName = normalizeText(client.name);

      const clientRecords = records.filter((record) => {
        const recordClient = normalizeText(record.cliente);
        return (
          recordClient.includes(normalizedClientId) ||
          recordClient.includes(normalizedClientName)
        );
      });

      const docCount = clientRecords.reduce(
        (sum, record) => sum + record.quantidadeDocumentos,
        0
      );

      return {
        ...client,
        color,
        initials,
        docCount,
        isActive: docCount > 0,
      };
    });
  }, [records]);

  const filteredClients = useMemo(() => {
    const term = normalizeText(search.trim());
    if (!term) return enrichedClients;

    return enrichedClients.filter(
      (c) =>
        normalizeText(c.name).includes(term) ||
        normalizeText(c.id).includes(term)
    );
  }, [enrichedClients, search]);

  const totalClients = enrichedClients.length;
  const activeClients = enrichedClients.filter((c) => c.isActive).length;
  const pendingClients = totalClients - activeClients;
  const totalDocs = enrichedClients.reduce((sum, c) => sum + c.docCount, 0);

  const statCards = [
    { icon: Users, label: "Total de clientes", value: totalClients },
    { icon: Activity, label: "Clientes ativos", value: activeClients },
    { icon: Activity, label: "Clientes pendentes", value: pendingClients },
    { icon: FileText, label: "Documentos mapeados", value: totalDocs },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 py-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-8"
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Central de clientes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Acompanhe os clientes e acesse rapidamente cada operação disponível.
            </p>
          </div>

          <div className="w-full xl:w-[320px] relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="h-10 w-full rounded-xl pl-9 pr-3 text-[13px] outline-none bg-muted/50 border border-border text-foreground transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>
      </motion.div>

      {/* STATS */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5 transition-all hover:bg-accent/40"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                {stat.label}
              </span>
              <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-primary/10">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* CLIENTES */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filteredClients.map((client) => (
          <button
            key={client.id}
            onClick={() => navigate(client.route)}
            className="group text-left rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md hover:border-primary/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-xs font-bold"
                  style={{
                    background: `${client.color}15`,
                    color: client.color,
                  }}
                >
                  {client.initials}
                </div>

                <div>
                  <p className="text-[15px] font-medium text-foreground">
                    {client.name}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                        client.isActive
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {client.isActive ? "Ativo" : "Pendente"}
                    </span>

                    <span className="text-[11px] text-muted-foreground">
                      {formatDocsLabel(client.docCount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent transition-all group-hover:bg-primary/10">
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-1" />
              </div>
            </div>
          </button>
        ))}
      </motion.div>

      {/* EMPTY */}
      {filteredClients.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 rounded-xl border border-border bg-card p-8 text-center"
        >
          <p className="text-sm font-medium text-foreground">
            Nenhum cliente encontrado
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tente pesquisar por nome ou identificação.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default MotorCliente;