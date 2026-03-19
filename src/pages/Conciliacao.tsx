import { useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, ReceiptText } from "lucide-react";
import ConciliacaoNFS from "./ConciliacaoNFS";
import ConciliacaoNFE from "./ConciliacaoNFE";

type TabType = "nfs" | "nfe";

const Conciliacao = () => {
  const [activeTab, setActiveTab] = useState<TabType>("nfs");

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
            Conciliação de relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Selecione o tipo de documento para comparar relatórios do sistema com as bases externas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="flex gap-1 mb-6 p-1 rounded-lg bg-muted border border-border w-fit"
        >
          {([
            { key: "nfs" as const, icon: ReceiptText, label: "NFS" },
            { key: "nfe" as const, icon: FileSpreadsheet, label: "NFE" },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${
                activeTab === key
                  ? "bg-accent text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </motion.div>

        {activeTab === "nfs" ? <ConciliacaoNFS /> : <ConciliacaoNFE />}
      </div>
    </div>
  );
};

export default Conciliacao;
