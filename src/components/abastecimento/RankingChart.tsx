import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import type { RankedItem } from "@/lib/abastecimento/types";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
  fontSize: 12,
};

interface Props {
  title: string;
  items: RankedItem[];
  unit: string;
  color?: string;
  invertColors?: boolean;
  pm?: boolean;
}

const RankingChart = ({ title, items, unit, color = "hsl(var(--primary))", invertColors, pm }: Props) => {
  const chartH = pm ? 320 : 250;
  const tick = { fontSize: pm ? 12 : 11, fill: "hsl(var(--muted-foreground))" };

  const data = items.map(item => ({
    name: item.label.split(" ")[0],
    value: Number(item.value.toFixed(2)),
    placa: item.placa,
    tipo: item.tipoFrota,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border border-border bg-card ${pm ? "p-6" : "p-5"}`}
    >
      <h3 className={`font-medium text-foreground mb-4 ${pm ? "text-base" : "text-sm"}`}>{title}</h3>
      <div style={{ height: chartH }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={tick} unit={` ${unit}`} />
            <YAxis dataKey="name" type="category" tick={tick} width={70} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [`${value} ${unit}`, title]}
              labelFormatter={(label) => {
                const item = data.find(d => d.name === label);
                return item ? `${label} · ${item.placa} · ${item.tipo}` : label;
              }}
            />
            <Bar dataKey="value" name={title} radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={invertColors
                    ? `hsl(0 60% ${55 - i * 3}%)`
                    : i === 0 ? color : `hsl(var(--primary) / ${Math.max(0.3, 0.8 - i * 0.06)})`
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default RankingChart;
