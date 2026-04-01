import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Fuel, Truck, Star } from "lucide-react";
import type { Insight } from "@/lib/abastecimento/types";

const iconMap = {
  trend: TrendingUp,
  alert: AlertTriangle,
  fuel: Fuel,
  truck: Truck,
  star: Star,
};

const severityStyles = {
  info: "border-blue-500/18 bg-blue-500/[0.06] text-blue-200",
  warning: "border-yellow-500/18 bg-yellow-500/[0.06] text-yellow-200",
  critical: "border-red-500/18 bg-red-500/[0.06] text-red-200",
  success: "border-emerald-500/18 bg-emerald-500/[0.06] text-emerald-200",
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
      className={`
        rounded-[24px] border border-white/8
        bg-[linear-gradient(180deg,rgba(10,14,25,0.90),rgba(8,12,22,0.95))]
        shadow-[0_14px_34px_rgba(0,0,0,0.18)]
        transition-all duration-500
        ${pm ? "p-6 lg:p-8" : "p-5"}
      `}
    >
      <div className="mb-5 flex flex-col gap-1">
        <h3
          className={`font-semibold tracking-[-0.02em] text-foreground ${
            pm ? "text-lg lg:text-xl" : "text-base"
          }`}
        >
          Insights da operação
        </h3>
        <p className="text-sm text-white/52">
          Principais pontos de atenção e oportunidade identificados na leitura consolidada da frota.
        </p>
      </div>

      <div
        className={`grid gap-3 ${
          pm ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        {insights.map((insight, i) => {
          const Icon = iconMap[insight.icon] || TrendingUp;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className={`
                rounded-[18px] border p-4 transition-all duration-300
                ${severityStyles[insight.severity]}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/10">
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className={`${pm ? "text-sm" : "text-[13px]"} leading-relaxed font-medium`}>
                    {insight.text}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default InsightsPanel;