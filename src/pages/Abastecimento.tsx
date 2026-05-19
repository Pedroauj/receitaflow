import { motion } from "framer-motion";
import { Fuel } from "lucide-react";
import ConciliacaoAbastecimento from "./ConciliacaoAbastecimento";
import PageHeader from "@/components/dashboard/PageHeader";

const Abastecimento = () => {
  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1560px]">
        <PageHeader
          badgeIcon={Fuel}
          badgeLabel="Abastecimento"
          title="Conciliação de Abastecimento"
          description="Conciliação de notas de abastecimento — combustível externo e interno."
        />

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
