import { motion } from "framer-motion";
import type { VehicleRecord } from "@/lib/abastecimento/types";
import { DIESEL_PRICE_REF } from "@/lib/abastecimento/mockData";

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  records: VehicleRecord[];
  pm?: boolean;
}

const GainLossBlock = ({ records, pm }: Props) => {
  const ganho = records.filter(r => r.ganhoPerda > 0).reduce((s, r) => s + r.ganhoPerda, 0);
  const perda = records.filter(r => r.ganhoPerda < 0).reduce((s, r) => s + Math.abs(r.ganhoPerda), 0);
  const saldo = ganho - perda;
  const valorGanho = ganho * DIESEL_PRICE_REF;
  const valorPerda = perda * DIESEL_PRICE_REF;

  const topWaste = [...records]
    .filter(r => r.ganhoPerda < 0)
    .sort((a, b) => a.ganhoPerda - b.ganhoPerda)
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className={`rounded-xl border border-border bg-card ${pm ? "p-6 lg:p-8" : "p-5"}`}
    >
      <h3 className={`font-medium text-foreground mb-4 ${pm ? "text-base lg:text-lg" : "text-sm"}`}>
        Análise de Ganho / Perda
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Ganho Total</p>
          <p className="text-lg font-bold text-emerald-400">+{ganho.toFixed(0)} L</p>
          <p className="text-xs text-emerald-400/70 mt-0.5">{formatBRL(valorGanho)}</p>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Perda Total</p>
          <p className="text-lg font-bold text-red-400">-{perda.toFixed(0)} L</p>
          <p className="text-xs text-red-400/70 mt-0.5">{formatBRL(valorPerda)}</p>
        </div>
        <div className={`rounded-lg border p-4 text-center ${saldo >= 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
          <p className="text-xs text-muted-foreground mb-1">Saldo</p>
          <p className={`text-lg font-bold ${saldo >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {saldo >= 0 ? "+" : ""}{saldo.toFixed(0)} L
          </p>
        </div>
        <div className="rounded-lg border border-border bg-accent/30 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Impacto Financeiro</p>
          <p className={`text-lg font-bold ${saldo >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatBRL(saldo * DIESEL_PRICE_REF)}
          </p>
        </div>
      </div>

      {topWaste.length > 0 && (
        <>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Maiores Perdas</h4>
          <div className="space-y-2">
            {topWaste.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-red-500/10 bg-red-500/5 px-4 py-2.5">
                <div>
                  <span className="text-sm font-medium text-foreground">{r.motorista}</span>
                  <span className="text-xs text-muted-foreground ml-2">{r.placa} · {r.tipoFrota}</span>
                </div>
                <span className="text-sm font-bold text-red-400">{r.ganhoPerda.toFixed(0)} L</span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default GainLossBlock;
