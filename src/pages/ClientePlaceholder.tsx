import { useNavigate } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

interface ClientePlaceholderProps {
  clientName: string;
}

const ClientePlaceholder = ({ clientName }: ClientePlaceholderProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-bg">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-b border-border/40 backdrop-blur-sm bg-background/60"
      >
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ReceitaFlow" className="h-10 w-10 object-contain glow-icon" />
            <div>
              <h1 className="text-xl font-bold text-primary tracking-tight neon-text">ReceitaFlow</h1>
              <p className="text-xs text-muted-foreground font-medium">Conversor de planilhas financeiras</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Voltar
          </Button>
        </div>
        <div className="neon-line" />
      </motion.header>

      <main className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="card-elevated rounded-xl p-10 max-w-lg w-full"
        >
          <div className="h-16 w-16 rounded-2xl bg-primary/12 flex items-center justify-center mx-auto mb-6">
            <Construction className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">{clientName}</h2>
          <p className="text-muted-foreground leading-relaxed">
            Conversor em desenvolvimento. As regras deste cliente serão configuradas posteriormente.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default ClientePlaceholder;
