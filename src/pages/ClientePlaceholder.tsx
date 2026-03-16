import { useNavigate } from "react-router-dom";
import { Construction, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ClientePlaceholderProps {
  clientName: string;
}

const ClientePlaceholder = ({ clientName }: ClientePlaceholderProps) => {
  const navigate = useNavigate();

  return (
    <div className="p-7">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 mb-8"
      >
        <button
          onClick={() => navigate("/")}
          className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: "#1E1E20", border: "0.5px solid #2C2C2A", color: "#888780" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#412402"; e.currentTarget.style.color = "#FAC775"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#1E1E20"; e.currentTarget.style.color = "#888780"; }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>
            {clientName}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#888780" }}>
            Conversor de planilha financeira
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="card-elevated p-12 flex flex-col items-center text-center max-w-lg mx-auto"
      >
        <div
          className="h-14 w-14 rounded-xl flex items-center justify-center mb-5"
          style={{ background: "#412402" }}
        >
          <Construction className="h-7 w-7" style={{ color: "#EF9F27" }} />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "#F5F5F0" }}>
          Em desenvolvimento
        </h2>
        <p className="text-sm" style={{ color: "#888780" }}>
          Conversor em desenvolvimento. As regras deste cliente serão configuradas posteriormente.
        </p>
        <Button
          className="mt-6 gradient-btn border-0 text-xs h-9 px-5"
          onClick={() => navigate("/")}
        >
          Voltar ao dashboard
        </Button>
      </motion.div>
    </div>
  );
};

export default ClientePlaceholder;
