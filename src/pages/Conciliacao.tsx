import { useState } from "react";
import { motion } from "framer-motion";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";
import ReceiptText from "lucide-react/dist/esm/icons/receipt-text";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import ConciliacaoNFS from "./ConciliacaoNFS";
import ConciliacaoNFE from "./ConciliacaoNFE";

type TabType = "nfs" | "nfe";

const tabBaseStyle: React.CSSProperties = {
  height: 48,
  padding: "0 18px",
  borderRadius: 16,
  border: "1px solid rgba(44, 56, 76, 0.95)",
  background: "linear-gradient(180deg, rgba(20, 27, 37, 0.96) 0%, rgba(16, 22, 31, 0.96) 100%)",
  color: "#93A1B5",
  fontSize: 14,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  cursor: "pointer",
  transition: "all .18s ease",
  boxShadow: "0 8px 22px rgba(0,0,0,0.14)",
};

const activeTabStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(31, 44, 64, 0.96) 0%, rgba(23, 34, 50, 0.96) 100%)",
  border: "1px solid rgba(91, 141, 239, 0.32)",
  color: "#F3F6FB",
  boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
};

const Conciliacao = () => {
  const [activeTab, setActiveTab] = useState<TabType>("nfs");

  return (
    <div className="w-full">
      <div className="mx-auto" style={{ maxWidth: 1560 }}>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: 22 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                  padding: "7px 12px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#A9C3FF",
                  background: "rgba(91, 141, 239, 0.12)",
                  border: "1px solid rgba(91, 141, 239, 0.18)",
                }}
              >
                <ShieldCheck style={{ width: 14, height: 14 }} />
                Auditoria e conferência
              </span>

              <h1
                style={{
                  fontSize: 32,
                  lineHeight: 1.05,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "#F3F6FB",
                  margin: 0,
                }}
              >
                Conciliação de relatórios
              </h1>

              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#8A96A8",
                  margin: "10px 0 0",
                  maxWidth: 760,
                }}
              >
                Selecione o tipo de documento para comparar relatórios do sistema com as bases externas,
                identificando lançamentos, pendências e divergências operacionais.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("nfs")}
            style={{
              ...tabBaseStyle,
              ...(activeTab === "nfs" ? activeTabStyle : {}),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "nfs") {
                e.currentTarget.style.borderColor = "rgba(72, 93, 124, 0.95)";
                e.currentTarget.style.color = "#DCE6F5";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "nfs") {
                e.currentTarget.style.borderColor = "rgba(44, 56, 76, 0.95)";
                e.currentTarget.style.color = "#93A1B5";
              }
            }}
          >
            <ReceiptText style={{ width: 16, height: 16 }} />
            NFS
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("nfe")}
            style={{
              ...tabBaseStyle,
              ...(activeTab === "nfe" ? activeTabStyle : {}),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "nfe") {
                e.currentTarget.style.borderColor = "rgba(72, 93, 124, 0.95)";
                e.currentTarget.style.color = "#DCE6F5";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "nfe") {
                e.currentTarget.style.borderColor = "rgba(44, 56, 76, 0.95)";
                e.currentTarget.style.color = "#93A1B5";
              }
            }}
          >
            <FileSpreadsheet style={{ width: 16, height: 16 }} />
            NFE
          </button>
        </motion.div>

        {activeTab === "nfs" ? <ConciliacaoNFS /> : <ConciliacaoNFE />}
      </div>
    </div>
  );
};

export default Conciliacao;