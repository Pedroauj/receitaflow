import { motion } from "framer-motion";
import { Settings, Palette, Bell, Shield } from "lucide-react";

const sections = [
  { icon: Palette, title: "Aparência", description: "Personalize o tema e as preferências visuais do sistema." },
  { icon: Bell, title: "Notificações", description: "Configure alertas e notificações de processamento." },
  { icon: Shield, title: "Segurança", description: "Gerencie permissões e controles de acesso." },
];

const Configuracoes = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Configurações</h1>
        <p className="text-xs text-muted-foreground mt-1">Preferências e ajustes do sistema</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="space-y-2"
      >
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 cursor-pointer transition-colors hover:bg-accent/30"
          >
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
              <section.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{section.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded-md bg-muted border border-border">
              Em breve
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Configuracoes;
