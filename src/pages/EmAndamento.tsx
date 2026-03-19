import { motion } from "framer-motion";
import { Loader2, Clock } from "lucide-react";

const EmAndamento = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Em andamento</h1>
        <p className="text-xs text-muted-foreground mt-1">Conversões em processamento</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="rounded-xl border border-border bg-card p-12 flex flex-col items-center text-center"
      >
        <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 bg-primary/10">
          <Loader2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-1.5">
          Nenhuma conversão em andamento
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          As conversões que estiverem sendo processadas aparecerão aqui em tempo real.
        </p>
        <div className="flex items-center gap-2 mt-5 px-3 py-1.5 rounded-lg bg-muted border border-border">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            Atualizações automáticas quando houver processamentos ativos
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default EmAndamento;
