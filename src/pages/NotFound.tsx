import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-7">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center"
      >
        <div className="h-14 w-14 rounded-xl flex items-center justify-center mx-auto mb-5 bg-primary/10">
          <AlertTriangle className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2 text-foreground">404</h1>
        <p className="text-sm mb-6 text-muted-foreground">Página não encontrada</p>
        <a
          href="/"
          className="text-sm font-medium px-5 py-2.5 rounded-xl inline-block bg-primary text-primary-foreground transition-opacity hover:opacity-90"
        >
          Voltar ao dashboard
        </a>
      </motion.div>
    </div>
  );
};

export default NotFound;
