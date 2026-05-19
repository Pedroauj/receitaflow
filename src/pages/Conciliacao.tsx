import { useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, ReceiptText, Sparkles } from "lucide-react";
import ConciliacaoNFS from "./ConciliacaoNFS";
import ConciliacaoNFE from "./ConciliacaoNFE";
import PageHeader from "@/components/dashboard/PageHeader";

type TabType = "nfs" | "nfe";

const Conciliacao = () => {
  const [activeTab, setActiveTab] = useState<TabType>("nfs");

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1560px]">
        <PageHeader
          badgeIcon={Sparkles}
          badgeLabel="Central de conciliação"
          title="Conciliação de relatórios"
          description="Selecione o tipo de documento para comparar relatórios do sistema com as bases externas em uma interface unificada."
        />

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(16,20,32,0.98),rgba(10,13,22,0.98))] p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
        >
          {([
            { key: "nfs" as const, icon: ReceiptText, label: "NFS" },
            { key: "nfe" as const, icon: FileSpreadsheet, label: "NFE" },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`inline-flex min-w-[110px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
                activeTab === key
                  ? "bg-violet-500/15 text-white shadow-[inset_0_0_0_1px_rgba(139,92,246,0.3)]"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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