import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { EfficiencyDistribution } from "@/lib/abastecimento/types";

const COLORS = {
  above: "hsl(142 50% 45%)",
  within: "hsl(var(--primary))",
  below: "hsl(0 60% 50%)",
};

const LABELS = {
  above: "Acima da meta",
  within: "Dentro da meta",
  below: "Abaixo da meta",
};

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
  fontSize: 12,
};

interface Props {
  dist: EfficiencyDistribution;
  pm?: boolean;
}

const EfficiencyDonut = ({ dist, pm }: Props) => {
  const data = [
    { name: LABELS.above, value: dist.above, key: "above" as const },
    { name: LABELS.within, value: dist.within, key: "within" as const },
    { name: LABELS.below, value: dist.below, key: "below" as const },
  ].filter(d => d.value > 0);

  const pctAbove = dist.total > 0 ? ((dist.above / dist.total) * 100).toFixed(0) : "0";
  const pctBelow = dist.total > 0 ? ((dist.below / dist.total) * 100).toFixed(0) : "0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border border-border bg-card ${pm ? "p-6" : "p-5"}`}
    >
      <h3 className={`font-medium text-foreground mb-4 ${pm ? "text-base" : "text-sm"}`}>
        Distribuição de Eficiência
      </h3>
      <div style={{ height: pm ? 280 : 220 }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={pm ? 55 : 42}
              outerRadius={pm ? 90 : 72}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map(d => (
                <Cell key={d.key} fill={COLORS[d.key]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} veículos`, ""]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        {data.map(d => (
          <div key={d.key} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[d.key] }} />
            {d.name} ({d.value})
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <p className="text-xs text-muted-foreground">Acima da meta</p>
          <p className="text-lg font-bold text-emerald-400">{pctAbove}%</p>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center">
          <p className="text-xs text-muted-foreground">Abaixo da meta</p>
          <p className="text-lg font-bold text-red-400">{pctBelow}%</p>
        </div>
      </div>
    </motion.div>
  );
};

export default EfficiencyDonut;
