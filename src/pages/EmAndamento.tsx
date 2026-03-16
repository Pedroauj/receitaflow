import { motion } from "framer-motion";
import { Loader2, Clock } from "lucide-react";

const EmAndamento = () => {
  return (
    <div className="p-7">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>
          Em andamento
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "#888780" }}>
          Conversões em processamento
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="card-elevated p-12 flex flex-col items-center text-center"
      >
        <div
          className="h-14 w-14 rounded-xl flex items-center justify-center mb-5"
          style={{ background: "#412402" }}
        >
          <Loader2 className="h-7 w-7" style={{ color: "#EF9F27" }} />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "#F5F5F0" }}>
          Nenhuma conversão em andamento
        </h2>
        <p className="text-sm max-w-md" style={{ color: "#888780" }}>
          As conversões que estiverem sendo processadas aparecerão aqui em tempo real.
        </p>
        <div className="flex items-center gap-2 mt-6 px-4 py-2 rounded-lg" style={{ background: "#1E1E20", border: "0.5px solid #2C2C2A" }}>
          <Clock className="h-3.5 w-3.5" style={{ color: "#5F5E5A" }} />
          <span className="text-[11px]" style={{ color: "#5F5E5A" }}>
            Atualizações automáticas quando houver processamentos ativos
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default EmAndamento;
