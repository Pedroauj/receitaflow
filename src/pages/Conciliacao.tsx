import { useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, ReceiptText, Sparkles } from "lucide-react";
import ConciliacaoNFS from "./ConciliacaoNFS";
import ConciliacaoNFE from "./ConciliacaoNFE";

type TabType = "nfs" | "nfe";

const Conciliacao = () => {
  const [activeTab, setActiveTab] = useState<TabType>("nfs");

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1560px]">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-5"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Central de conciliação
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
            Conciliação de relatórios
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Selecione o tipo de documento para comparar relatórios do sistema com
            as bases externas em uma interface unificada e mais consistente com o
            novo padrão visual.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.92)_0%,rgba(10,15,27,0.96)_100%)] p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.20)] backdrop-blur-xl"
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
                  ? "bg-[linear-gradient(135deg,rgba(99,102,241,0.18)_0%,rgba(59,130,246,0.18)_100%)] text-foreground shadow-[inset_0_0_0_1px_rgba(99,102,241,0.22)]"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
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