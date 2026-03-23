import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Sun, Moon, CloudSun } from "lucide-react";

const Inicio = () => {
  const { user } = useAuth();

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Usuário";

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const GreetingIcon = hour < 12 ? Sun : hour < 18 ? CloudSun : Moon;

  const today = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center"
        >
          <GreetingIcon className="h-7 w-7 text-primary" />
        </motion.div>

        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">
            {greeting},{" "}
            <span className="text-primary">{firstName}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 capitalize">{today}</p>
        </div>

        <p className="text-xs text-muted-foreground/50 pt-4">
          Pressione <kbd className="px-1.5 py-0.5 rounded bg-accent border border-border text-[11px] font-mono text-muted-foreground">ESC</kbd> a qualquer momento para voltar aqui
        </p>
      </motion.div>
    </div>
  );
};

export default Inicio;
