import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import type { FleetSummary } from "@/lib/abastecimento/types";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(210 70% 55%)",
  "hsl(280 60% 55%)",
  "hsl(160 50% 45%)",
  "hsl(340 60% 55%)",
];

interface Props {
  summaries: FleetSummary[];
  pm?: boolean;
}

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
  fontSize: 12,
};

const fmt = (v: number) => v.toLocaleString("pt-BR");
const fmtKmL = (v: number) => v.toFixed(2);

const FleetComparison = ({ summaries, pm }: Props) => {
  const chartH = pm ? 320 : 260;
  const tick = { fontSize: pm ? 13 : 11, fill: "hsl(var(--muted-foreground))" };

  const barData = summaries.map(s => ({
    name: s.tipo,
    consumo: s.litrosTotal,
    media: Number(s.mediaKmL.toFixed(2)),
    meta: Number(s.metaKmL.toFixed(2)),
  }));

  const pieData = summaries.map(s => ({
    name: s.tipo,
    value: Number(s.participacao.toFixed(1)),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Summary table */}
      <div className={`rounded-xl border border-border bg-card transition-all duration-500 ${pm ? "p-6 lg:p-8" : "p-5"}`}>
        <h3 className={`font-medium text-foreground mb-4 ${pm ? "text-base lg:text-lg" : "text-sm"}`}>
          Comparação entre Tipos de Frota
        </h3>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Veículos</TableHead>
                <TableHead className="text-right">KM Total</TableHead>
                <TableHead className="text-right">Litros</TableHead>
                <TableHead className="text-right">Média KM/L</TableHead>
                <TableHead className="text-right">Meta</TableHead>
                <TableHead className="text-right">Eficiência</TableHead>
                <TableHead className="text-right">Participação</TableHead>
                <TableHead className="text-right">Ganho/Perda (L)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map(s => (
                <TableRow key={s.tipo}>
                  <TableCell className="font-medium">{s.tipo}</TableCell>
                  <TableCell className="text-right">{s.veiculos}</TableCell>
                  <TableCell className="text-right">{fmt(s.kmTotal)}</TableCell>
                  <TableCell className="text-right">{fmt(s.litrosTotal)}</TableCell>
                  <TableCell className="text-right">{fmtKmL(s.mediaKmL)}</TableCell>
                  <TableCell className="text-right">{fmtKmL(s.metaKmL)}</TableCell>
                  <TableCell className={`text-right font-medium ${s.eficiencia >= 100 ? "text-emerald-400" : "text-red-400"}`}>
                    {s.eficiencia.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">{s.participacao.toFixed(1)}%</TableCell>
                  <TableCell className={`text-right font-medium ${s.ganhoPerda >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {s.ganhoPerda >= 0 ? "+" : ""}{s.ganhoPerda.toFixed(0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Charts grid */}
      <div className={`grid gap-4 ${pm ? "grid-cols-1 lg:grid-cols-3 gap-6" : "grid-cols-1 lg:grid-cols-3"}`}>
        {/* Consumo por tipo */}
        <div className={`rounded-xl border border-border bg-card ${pm ? "p-6" : "p-5"}`}>
          <h3 className={`font-medium text-foreground mb-4 ${pm ? "text-base" : "text-sm"}`}>
            Consumo por Tipo (L)
          </h3>
          <div style={{ height: chartH }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={tick} />
                <YAxis tick={tick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="consumo" name="Litros" radius={[4, 4, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Média KM/L por tipo */}
        <div className={`rounded-xl border border-border bg-card ${pm ? "p-6" : "p-5"}`}>
          <h3 className={`font-medium text-foreground mb-4 ${pm ? "text-base" : "text-sm"}`}>
            Média KM/L vs Meta
          </h3>
          <div style={{ height: chartH }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={tick} />
                <YAxis tick={tick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="media" name="Média" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                <Bar dataKey="meta" name="Meta" radius={[4, 4, 0, 0]} fill="hsl(var(--muted-foreground))" opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut participação */}
        <div className={`rounded-xl border border-border bg-card ${pm ? "p-6" : "p-5"}`}>
          <h3 className={`font-medium text-foreground mb-4 ${pm ? "text-base" : "text-sm"}`}>
            Participação no Consumo
          </h3>
          <div style={{ height: chartH }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={pm ? 65 : 50}
                  outerRadius={pm ? 100 : 80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FleetComparison;
