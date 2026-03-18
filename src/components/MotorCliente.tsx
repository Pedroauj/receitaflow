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
  Building2,
} from "lucide-react";

const clientColors: Record<string, string> = {
  "martin-brower": "#F59E0B",
  minerva: "#60A5FA",
  danone: "#4ADE80",
  platlog: "#A78BFA",
  jbs: "#F87171",
  natura: "#2DD4BF",
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

const formatDocsLabel = (count: number) => {
  return `${count} ${count === 1 ? "documento" : "documentos"}`;
};

const MotorCliente = () => {
  const navigate = useNavigate();
  const records = getRecords();
  const [search, setSearch] = useState("");

  const enrichedClients = useMemo(() => {
    return clients.map((client) => {
      const color = clientColors[client.id] || "#5B8DEF";
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
        normalizeText(client.id).includes(term)
      );
    });
  }, [enrichedClients, search]);

  const totalClients = enrichedClients.length;
  const activeClients = enrichedClients.filter((client) => client.isActive).length;
  const pendingClients = totalClients - activeClients;
  const totalDocs = enrichedClients.reduce((sum, client) => sum + client.docCount, 0);

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-7"
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span
              className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium"
              style={{
                background: "rgba(91, 141, 239, 0.12)",
                color: "#A9C3FF",
                border: "1px solid rgba(91, 141, 239, 0.18)",
              }}
            >
              <Building2 className="h-3.5 w-3.5" />
              Central operacional
            </span>

            <h1
              className="text-[30px] leading-tight font-semibold tracking-tight"
              style={{ color: "#F3F6FB" }}
            >
              Central de clientes
            </h1>

            <p
              className="mt-2 max-w-2xl text-sm leading-relaxed"
              style={{ color: "#8A96A8" }}
            >
              Acompanhe os clientes, visualize atividade consolidada e acesse
              rapidamente cada operação disponível no sistema.
            </p>
          </div>

          <div className="w-full xl:w-[360px] relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "#6F7C8F" }}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente por nome ou identificação..."
              className="h-11 w-full rounded-2xl pl-11 pr-4 text-sm outline-none transition-all"
              style={{
                background: "rgba(18, 24, 33, 0.92)",
                border: "1px solid rgba(49, 62, 84, 0.9)",
                color: "#F3F6FB",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.16)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(91, 141, 239, 0.38)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 4px rgba(91, 141, 239, 0.10)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(49, 62, 84, 0.9)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(0, 0, 0, 0.16)";
              }}
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div
          className="rounded-3xl p-5 transition-all"
          style={{
            background:
              "linear-gradient(180deg, rgba(20, 27, 37, 0.96) 0%, rgba(16, 22, 31, 0.96) 100%)",
            border: "1px solid rgba(44, 56, 76, 0.95)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "#7E8A9D" }}>
              Total de clientes
            </span>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(91, 141, 239, 0.12)",
                border: "1px solid rgba(91, 141, 239, 0.16)",
              }}
            >
              <Users className="h-4 w-4" style={{ color: "#8FB3FF" }} />
            </div>
          </div>

          <p className="text-[30px] font-semibold leading-none" style={{ color: "#F3F6FB" }}>
            {totalClients}
          </p>
        </div>

        <div
          className="rounded-3xl p-5 transition-all"
          style={{
            background:
              "linear-gradient(180deg, rgba(20, 27, 37, 0.96) 0%, rgba(16, 22, 31, 0.96) 100%)",
            border: "1px solid rgba(44, 56, 76, 0.95)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "#7E8A9D" }}>
              Clientes ativos
            </span>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(34, 197, 94, 0.12)",
                border: "1px solid rgba(34, 197, 94, 0.16)",
              }}
            >
              <Activity className="h-4 w-4" style={{ color: "#86EFAC" }} />
            </div>
          </div>

          <p className="text-[30px] font-semibold leading-none" style={{ color: "#F3F6FB" }}>
            {activeClients}
          </p>
        </div>

        <div
          className="rounded-3xl p-5 transition-all"
          style={{
            background:
              "linear-gradient(180deg, rgba(20, 27, 37, 0.96) 0%, rgba(16, 22, 31, 0.96) 100%)",
            border: "1px solid rgba(44, 56, 76, 0.95)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "#7E8A9D" }}>
              Clientes pendentes
            </span>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.16)",
              }}
            >
              <Activity className="h-4 w-4" style={{ color: "#FCA5A5" }} />
            </div>
          </div>

          <p className="text-[30px] font-semibold leading-none" style={{ color: "#F3F6FB" }}>
            {pendingClients}
          </p>
        </div>

        <div
          className="rounded-3xl p-5 transition-all"
          style={{
            background:
              "linear-gradient(180deg, rgba(20, 27, 37, 0.96) 0%, rgba(16, 22, 31, 0.96) 100%)",
            border: "1px solid rgba(44, 56, 76, 0.95)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "#7E8A9D" }}>
              Documentos mapeados
            </span>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(56, 189, 248, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.16)",
              }}
            >
              <FileText className="h-4 w-4" style={{ color: "#8FDCFF" }} />
            </div>
          </div>

          <p className="text-[30px] font-semibold leading-none" style={{ color: "#F3F6FB" }}>
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
            className="group text-left rounded-3xl p-5 transition-all duration-200 hover:-translate-y-[2px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(20, 27, 37, 0.96) 0%, rgba(16, 22, 31, 0.96) 100%)",
              border: "1px solid rgba(44, 56, 76, 0.95)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(91, 141, 239, 0.28)";
              e.currentTarget.style.boxShadow = "0 14px 32px rgba(0, 0, 0, 0.24)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(44, 56, 76, 0.95)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.18)";
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3.5">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
                  style={{
                    background: `${client.color}20`,
                    color: client.color,
                    border: `1px solid ${client.color}22`,
                    boxShadow: `inset 0 1px 0 ${client.color}10`,
                  }}
                >
                  {client.initials}
                </div>

                <div className="min-w-0">
                  <p
                    className="truncate text-[15px] font-semibold"
                    style={{ color: "#F3F6FB" }}
                  >
                    {client.name}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium"
                      style={{
                        background: client.isActive
                          ? "rgba(34, 197, 94, 0.12)"
                          : "rgba(239, 68, 68, 0.12)",
                        color: client.isActive ? "#86EFAC" : "#FCA5A5",
                        border: client.isActive
                          ? "1px solid rgba(34, 197, 94, 0.16)"
                          : "1px solid rgba(239, 68, 68, 0.16)",
                      }}
                    >
                      {client.isActive ? "Ativo" : "Pendente"}
                    </span>

                    <span
                      className="text-[11px]"
                      style={{ color: "#7E8A9D" }}
                    >
                      {formatDocsLabel(client.docCount)}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200"
                style={{
                  background: "rgba(91, 141, 239, 0.10)",
                  border: "1px solid rgba(91, 141, 239, 0.14)",
                }}
              >
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{ color: "#A9C3FF" }}
                />
              </div>
            </div>
          </button>
        ))}
      </motion.div>

      {filteredClients.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 rounded-3xl p-6"
          style={{
            background:
              "linear-gradient(180deg, rgba(20, 27, 37, 0.96) 0%, rgba(16, 22, 31, 0.96) 100%)",
            border: "1px solid rgba(44, 56, 76, 0.95)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "#F3F6FB" }}>
            Nenhum cliente encontrado.
          </p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "#8A96A8" }}>
            Tente pesquisar por nome ou identificação do cliente para localizar o
            módulo desejado.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default MotorCliente;