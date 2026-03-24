import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  highlight?: boolean;
  pm?: boolean;
  index?: number;
  subValue?: string;
}

const KpiCard = ({ label, value, icon: Icon, color, highlight, pm, index = 0, subValue }: KpiCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: index * 0.04 }}
    className={`
      rounded-xl border bg-card transition-all duration-500
      ${pm
        ? `p-5 lg:p-6 ${highlight ? "border-primary/20 shadow-[0_0_30px_-8px_hsl(var(--primary)/0.15)]" : "border-border"}`
        : "p-4 border-border"
      }
    `}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`${pm ? "h-5 w-5" : "h-4 w-4"} ${color} transition-all duration-300`} />
      <span className={`text-muted-foreground transition-all duration-300 ${pm ? "text-xs lg:text-sm" : "text-xs"}`}>
        {label}
      </span>
    </div>
    <p className={`font-bold text-foreground transition-all duration-300 ${
      pm
        ? highlight ? "text-2xl lg:text-3xl" : "text-xl lg:text-2xl"
        : "text-lg"
    }`}>
      {value}
    </p>
    {subValue && (
      <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
    )}
  </motion.div>
);

export default KpiCard;
