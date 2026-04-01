import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import type { TimeSeriesPoint } from "@/lib/abastecimento/types";

const tooltipStyle = {
  background: "rgba(10, 14, 25, 0.96)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  color: "hsl(var(--foreground))",
  fontSize: 12,
  boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
  backdropFilter: "blur(12px)",
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

  const chartH = pm ? 360 : 290;
  const tick = {
    fontSize: pm ? 12 : 11,
    fill: "rgba(255,255,255,0.42)",
  };

  const formatted = data.map((d) => ({
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
      className="
        rounded-[24px] border border-white/8
        bg-[linear-gradient(180deg,rgba(10,14,25,0.90),rgba(8,12,22,0.95))]
        shadow-[0_14px_34px_rgba(0,0,0,0.18)]
      "
    >
      <div className={pm ? "p-6 lg:p-8" : "p-5"}>
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h3 className={`font-semibold tracking-[-0.02em] text-foreground ${pm ? "text-lg lg:text-xl" : "text-base"}`}>
              Evolução ao longo do tempo
            </h3>
            <p className="mt-1 text-sm text-white/52">
              Acompanhe o comportamento consolidado da operação por período.
            </p>
          </div>

          <div className="inline-flex w-full flex-wrap gap-1 rounded-2xl border border-white/8 bg-white/[0.03] p-1 xl:w-auto">
            {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                  metric === m
                    ? "bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)]"
                    : "text-white/58 hover:bg-white/[0.04] hover:text-foreground"
                }`}
              >
                {METRIC_LABELS[m].label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="rounded-[20px] border border-white/6 bg-black/10 p-3 md:p-4"
          style={{ height: chartH }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formatted}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="periodo"
                tick={tick}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={tick}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: "rgba(255,255,255,0.08)" }}
                formatter={(v: number) => [formatVal(v), METRIC_LABELS[metric].label]}
                labelStyle={{ color: "rgba(255,255,255,0.58)", marginBottom: 6 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={METRIC_LABELS[metric].label}
                stroke="hsl(var(--primary))"
                strokeWidth={pm ? 3.2 : 2.4}
                dot={{
                  fill: "hsl(var(--primary))",
                  r: pm ? 4.5 : 3.5,
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: pm ? 6 : 5,
                  fill: "hsl(var(--primary))",
                  stroke: "rgba(255,255,255,0.18)",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default TimeSeriesChart;