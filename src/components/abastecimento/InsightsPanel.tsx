import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, Fuel, Truck, Star } from "lucide-react";
import type { Insight } from "@/lib/abastecimento/types";

const iconMap = {
  trend: TrendingUp,
  alert: AlertTriangle,
  fuel: Fuel,
  truck: Truck,
  star: Star,
};

const severityStyles = {
  info: "border-blue-500/20 bg-blue-500/5 text-blue-300",
  warning: "border-yellow-500/20 bg-yellow-500/5 text-yellow-300",
  critical: "border-red-500/20 bg-red-500/5 text-red-300",
  success: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
};

interface Props {
  insights: Insight[];
  pm?: boolean;
}

const InsightsPanel = ({ insights, pm }: Props) => {
  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`rounded-xl border border-border bg-card transition-all duration-500 ${pm ? "p-6 lg:p-8" : "p-5"}`}
    >
      <h3 className={`font-medium text-foreground mb-4 ${pm ? "text-base lg:text-lg" : "text-sm"}`}>
        Insights da Operação
      </h3>
      <div className={`grid gap-3 ${pm ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
        {insights.map((insight, i) => {
          const Icon = iconMap[insight.icon] || TrendingUp;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className={`flex items-start gap-3 rounded-lg border p-4 ${severityStyles[insight.severity]}`}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <p className={`${pm ? "text-sm" : "text-xs"} leading-relaxed`}>
                {insight.text}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default InsightsPanel;
