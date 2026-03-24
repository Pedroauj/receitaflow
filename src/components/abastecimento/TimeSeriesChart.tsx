import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import type { TimeSeriesPoint } from "@/lib/abastecimento/types";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
  fontSize: 12,
};

type Metric = "litros" | "kmL" | "custoEstimado";

const METRIC_LABELS: Record<Metric, { label: string; unit: string }> = {
  litros: { label: "Litros", unit: "L" },
  kmL: { label: "KM/L", unit: "km/l" },
  custoEstimado: { label: "Custo (R$)", unit: "R$" },
};

interface Props {
  data: TimeSeriesPoint[];
  pm?: boolean;
}

const TimeSeriesChart = ({ data, pm }: Props) => {
  const [metric, setMetric] = useState<Metric>("kmL");
  const chartH = pm ? 340 : 260;
  const tick = { fontSize: pm ? 13 : 11, fill: "hsl(var(--muted-foreground))" };

  const formatted = data.map(d => ({
    periodo: d.periodo,
    value: metric === "kmL" ? Number(d[metric].toFixed(2)) : d[metric],
  }));

  const formatVal = (v: number) => {
    if (metric === "custoEstimado") return `R$ ${v.toLocaleString("pt-BR")}`;
    if (metric === "kmL") return `${v.toFixed(2)} km/l`;
    return `${v.toLocaleString("pt-BR")} L`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className={`rounded-xl border border-border bg-card ${pm ? "p-6 lg:p-8" : "p-5"}`}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className={`font-medium text-foreground ${pm ? "text-base lg:text-lg" : "text-sm"}`}>
          Evolução ao Longo do Tempo
        </h3>
        <div className="flex gap-1 rounded-lg border border-border bg-background p-0.5">
          {(Object.keys(METRIC_LABELS) as Metric[]).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                metric === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {METRIC_LABELS[m].label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: chartH }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="periodo" tick={tick} />
            <YAxis tick={tick} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatVal(v), METRIC_LABELS[metric].label]} />
            <Line
              type="monotone"
              dataKey="value"
              name={METRIC_LABELS[metric].label}
              stroke="hsl(var(--primary))"
              strokeWidth={pm ? 3 : 2}
              dot={{ fill: "hsl(var(--primary))", r: pm ? 5 : 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default TimeSeriesChart;
