import { motion } from "framer-motion";
import { Settings, Palette, Bell, Shield } from "lucide-react";

const sections = [
  {
    icon: Palette,
    title: "Aparência",
    description: "Personalize o tema e as preferências visuais do sistema.",
  },
  {
    icon: Bell,
    title: "Notificações",
    description: "Configure alertas e notificações de processamento.",
  },
  {
    icon: Shield,
    title: "Segurança",
    description: "Gerencie permissões e controles de acesso.",
  },
];

const Configuracoes = () => {
  return (
    <div className="p-7">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>
          Configurações
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "#888780" }}>
          Preferências e ajustes do sistema
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="space-y-3"
      >
        {sections.map((section) => (
          <div
            key={section.title}
            className="card-elevated p-5 flex items-center gap-4 cursor-pointer"
          >
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#412402" }}
            >
              <section.icon className="h-5 w-5" style={{ color: "#EF9F27" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#F5F5F0" }}>
                {section.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#888780" }}>
                {section.description}
              </p>
            </div>
            <span className="amber-badge">Em breve</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Configuracoes;
