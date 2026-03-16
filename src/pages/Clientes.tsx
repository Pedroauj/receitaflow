import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { clients } from "@/lib/clients";
import { getRecords } from "@/lib/history";
import { ArrowRight } from "lucide-react";

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

const Clientes = () => {
  const navigate = useNavigate();
  const records = getRecords();

  return (
    <div className="p-7">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>
          Clientes
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "#888780" }}>
          Gerenciamento de clientes cadastrados
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {clients.map((client) => {
          const color = clientColors[client.id] || "#BA7517";
          const initials = clientInitials[client.id] || client.name.slice(0, 2).toUpperCase();
          const docCount = records.filter((r) =>
            r.cliente.toLowerCase().includes(client.id.replace("-", " ").split(" ")[0])
          ).reduce((sum, r) => sum + r.quantidadeDocumentos, 0);
          const isActive = docCount > 0;

          return (
            <div
              key={client.id}
              className="card-elevated p-5 cursor-pointer group"
              onClick={() => navigate(client.route)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: `${color}20`, color }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#F5F5F0" }}>
                    {client.name}
                  </p>
                  <p className="text-[11px]" style={{ color: "#5F5E5A" }}>
                    {client.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={isActive ? "status-active" : "status-pending"}>
                    {isActive ? "Ativo" : "Pendente"}
                  </span>
                  <span className="text-[11px]" style={{ color: "#5F5E5A" }}>
                    {docCount} docs
                  </span>
                </div>
                <div
                  className="h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "#412402" }}
                >
                  <ArrowRight className="h-3.5 w-3.5" style={{ color: "#FAC775" }} />
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Clientes;
