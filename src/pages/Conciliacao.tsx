import { useState } from "react";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";
import ReceiptText from "lucide-react/dist/esm/icons/receipt-text";
import ConciliacaoNFS from "./ConciliacaoNFS";
import ConciliacaoNFE from "./ConciliacaoNFE";

type TabType = "nfs" | "nfe";

const tabBaseStyle: React.CSSProperties = {
  height: 46,
  padding: "0 18px",
  borderRadius: 12,
  border: "1px solid #2A2C33",
  background: "#17181C",
  color: "#8E8E97",
  fontSize: 14,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  cursor: "pointer",
  transition: "all .15s ease",
};

const activeTabStyle: React.CSSProperties = {
  background: "#22190F",
  border: "1px solid #7A4A12",
  color: "#FFD089",
  boxShadow: "0 8px 18px rgba(215,146,43,.10)",
};

const Conciliacao = () => {
  const [activeTab, setActiveTab] = useState<TabType>("nfs");

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#111113",
        padding: "24px 24px 40px",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 1560 }}>
        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#D7922B",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Auditoria e conferência
          </p>

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
              <h1
                style={{
                  fontSize: 32,
                  lineHeight: 1.05,
                  fontWeight: 700,
                  color: "#F5F5F0",
                  margin: 0,
                }}
              >
                Conciliação de relatórios
              </h1>

              <p
                style={{
                  fontSize: 14,
                  color: "#8D8D96",
                  margin: "8px 0 0",
                }}
              >
                Selecione o tipo de documento para realizar a comparação entre sistema e governo.
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 18,
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
          >
            <FileSpreadsheet style={{ width: 16, height: 16 }} />
            NFe
          </button>
        </div>

        {activeTab === "nfs" ? <ConciliacaoNFS /> : <ConciliacaoNFE />}
      </div>
    </div>
  );
};

export default Conciliacao;