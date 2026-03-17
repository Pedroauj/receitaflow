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

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const MotorCliente = () => {
  const navigate = useNavigate();
  const records = getRecords();
  const [search, setSearch] = useState("");

  const enrichedClients = useMemo(() => {
    return clients.map((client) => {
      const color = clientColors[client.id] || "#BA7517";
      const initials =
        clientInitials[client.id] || client.name.slice(0, 2).toUpperCase();

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

      const isActive = docCount > 0;

      return {
        ...client,
        color,
        initials,
        docCount,
        isActive,
      };
    });
  }, [records]);

  const filteredClients = useMemo(() => {
    const term = normalizeText(search.trim());

    if (!term) return enrichedClients;

    return enrichedClients.filter((client) => {
      return (
        normalizeText(client.name).includes(term) ||
        normalizeText(client.description).includes(term) ||
        normalizeText(client.id).includes(term)
      );
    });
  }, [enrichedClients, search]);

  const totalClients = enrichedClients.length;
  const activeClients = enrichedClients.filter((client) => client.isActive).length;
  const pendingClients = totalClients - activeClients;
  const totalDocs = enrichedClients.reduce((sum, client) => sum + client.docCount, 0);

  return (
    <div className="p-7">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium mb-3"
              style={{
                background: "rgba(250, 199, 117, 0.10)",
                color: "#FAC775",
                border: "1px solid rgba(250, 199, 117, 0.18)",
              }}
            >
              Motor de Clientes
            </span>

            <h1 className="text-2xl font-semibold" style={{ color: "#F5F5F0" }}>
              Central inteligente de clientes
            </h1>

            <p className="text-sm mt-1.5 max-w-2xl" style={{ color: "#888780" }}>
              Acesse rapidamente cada operação, acompanhe atividade por cliente e
              mantenha a navegação organizada em um único hub.
            </p>
          </div>

          <div className="w-full xl:w-[340px] relative">
            <Search
              className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: "#888780" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full h-11 rounded-xl pl-11 pr-4 text-sm outline-none border"
              style={{
                background: "#1E1E21",
                borderColor: "rgba(255,255,255,0.06)",
                color: "#F5F5F0",
              }}
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-7"
      >
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "#1E1E21",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs" style={{ color: "#888780" }}>
              Total de clientes
            </span>
            <Users className="h-4 w-4" style={{ color: "#FAC775" }} />
          </div>
          <p className="text-2xl font-semibold" style={{ color: "#F5F5F0" }}>
            {totalClients}
          </p>
        </div>

        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "#1E1E21",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs" style={{ color: "#888780" }}>
              Clientes ativos
            </span>
            <Activity className="h-4 w-4" style={{ color: "#34A853" }} />
          </div>
          <p className="text-2xl font-semibold" style={{ color: "#F5F5F0" }}>
            {activeClients}
          </p>
        </div>

        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "#1E1E21",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs" style={{ color: "#888780" }}>
              Clientes pendentes
            </span>
            <Activity className="h-4 w-4" style={{ color: "#E74C3C" }} />
          </div>
          <p className="text-2xl font-semibold" style={{ color: "#F5F5F0" }}>
            {pendingClients}
          </p>
        </div>

        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "#1E1E21",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs" style={{ color: "#888780" }}>
              Documentos mapeados
            </span>
            <FileText className="h-4 w-4" style={{ color: "#4A90D9" }} />
          </div>
          <p className="text-2xl font-semibold" style={{ color: "#F5F5F0" }}>
            {totalDocs}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filteredClients.map((client) => (
          <button
            key={client.id}
            type="button"
            onClick={() => navigate(client.route)}
            className="text-left rounded-2xl p-5 border transition-all duration-200 group"
            style={{
              background: "#1E1E21",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    background: `${client.color}20`,
                    color: client.color,
                  }}
                >
                  {client.initials}
                </div>

                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "#F5F5F0" }}
                  >
                    {client.name}
                  </p>
                  <p
                    className="text-[11px] mt-0.5 truncate"
                    style={{ color: "#888780" }}
                  >
                    {client.description}
                  </p>
                </div>
              </div>

              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                style={{ background: "rgba(250, 199, 117, 0.10)" }}
              >
                <ArrowRight className="h-4 w-4" style={{ color: "#FAC775" }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div
                className="rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <p className="text-[11px] mb-1" style={{ color: "#888780" }}>
                  Status
                </p>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{
                    background: client.isActive
                      ? "rgba(52, 168, 83, 0.12)"
                      : "rgba(231, 76, 60, 0.12)",
                    color: client.isActive ? "#34A853" : "#E74C3C",
                  }}
                >
                  {client.isActive ? "Ativo" : "Pendente"}
                </span>
              </div>

              <div
                className="rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <p className="text-[11px] mb-1" style={{ color: "#888780" }}>
                  Documentos
                </p>
                <p className="text-sm font-semibold" style={{ color: "#F5F5F0" }}>
                  {client.docCount}
                </p>
              </div>
            </div>

            <div
              className="rounded-xl px-3 py-2 text-[11px]"
              style={{
                background: "rgba(250, 199, 117, 0.06)",
                color: "#C9C7C1",
                border: "1px solid rgba(250, 199, 117, 0.08)",
              }}
            >
              Clique para abrir a central do cliente
            </div>
          </button>
        ))}
      </motion.div>

      {filteredClients.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 rounded-2xl p-6 border"
          style={{
            background: "#1E1E21",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-sm" style={{ color: "#F5F5F0" }}>
            Nenhum cliente encontrado para essa busca.
          </p>
          <p className="text-xs mt-1" style={{ color: "#888780" }}>
            Tente pesquisar por nome, descrição ou identificação do cliente.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default MotorCliente;