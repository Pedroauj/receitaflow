import { motion } from "framer-motion";
import { Loader2, Clock } from "lucide-react";
import SectionContainer from "@/components/dashboard/SectionContainer";

const EmAndamento = () => {
  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Em andamento</h1>
        <p className="text-sm text-muted-foreground mt-1">Conversões em processamento</p>
      </motion.div>

      <SectionContainer delay={0.05}>
        <div className="flex flex-col items-center text-center py-8">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 bg-primary/10">
            <Loader2 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1.5">
            Nenhuma conversão em andamento
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            As conversões que estiverem sendo processadas aparecerão aqui em tempo real.
          </p>
          <div className="flex items-center gap-2 mt-5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              Atualizações automáticas quando houver processamentos ativos
            </span>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};

export default EmAndamento;
