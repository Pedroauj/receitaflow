import { motion } from "framer-motion";
import ConciliacaoAbastecimento from "./ConciliacaoAbastecimento";

const Abastecimento = () => {
  return (
    <div className="w-full">
      <div className="mx-auto" style={{ maxWidth: 1560 }}>
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-6"
        >
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Abastecimento
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Conciliação de notas de abastecimento — combustível externo e interno.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <ConciliacaoAbastecimento />
        </motion.div>
      </div>
    </div>
  );
};

export default Abastecimento;
