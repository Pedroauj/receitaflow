import { motion } from "framer-motion";
import { UploadCloud, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

const sectionCardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #18191D 0%, #15161A 100%)",
  border: "1px solid #22242A",
  borderRadius: 16,
  boxShadow: "0 8px 24px rgba(0,0,0,.16)",
};

const Minerva = () => {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{ marginBottom: 18 }}
      >
        <p
          style={{
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#5B9BD5",
            fontWeight: 700,
            margin: 0,
          }}
        >
          MINERVA · Recebimentos
        </p>

        <p
          style={{
            fontSize: 14,
            color: "#8D8D96",
            marginTop: 4,
          }}
        >
          Importe a planilha da Minerva para processar os recebimentos automaticamente.
        </p>
      </motion.div>

      {/* Upload */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={sectionCardStyle}
      >
        <div style={{ padding: 20 }}>
          <div
            style={{
              border: "1px dashed #2A2D35",
              borderRadius: 12,
              padding: 30,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <UploadCloud size={28} color="#5B9BD5" />

            <p style={{ marginTop: 10, fontSize: 14, color: "#E4E4E7" }}>
              Clique ou arraste a planilha
            </p>

            <p style={{ fontSize: 12, color: "#8D8D96" }}>
              Formatos aceitos: .xlsx, .xls
            </p>

            <input
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                }
              }}
            />
          </div>

          {file && (
            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#1E2026",
                padding: 12,
                borderRadius: 10,
              }}
            >
              <FileSpreadsheet size={18} color="#5B9BD5" />
              <span style={{ fontSize: 13, color: "#E4E4E7" }}>
                {file.name}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Minerva;