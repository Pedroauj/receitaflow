import { motion } from "framer-motion";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import type { VehicleRecord } from "@/lib/abastecimento/types";

const fmt = (v: number) => v.toLocaleString("pt-BR");
const fmtKmL = (v: number) => v.toFixed(2);
const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

type SortKey = "motorista" | "placa" | "tipoFrota" | "km" | "litros" | "mediaKmL" | "metaKmL" | "ganhoPerda" | "eficiencia" | "custoEstimado";

interface Props {
  records: VehicleRecord[];
  pm?: boolean;
}

const DetailedTable = ({ records, pm }: Props) => {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("eficiencia");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r =>
      r.motorista.toLowerCase().includes(q) ||
      r.placa.toLowerCase().includes(q) ||
      r.tipoFrota.toLowerCase().includes(q)
    );
  }, [records, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "string") return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [filtered, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const statusLabel = (eff: number) => {
    if (eff >= 103) return { text: "Acima", cls: "text-emerald-400" };
    if (eff >= 97) return { text: "Na meta", cls: "text-primary" };
    return { text: "Abaixo", cls: "text-red-400" };
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <TableHead
      className="text-right cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => toggleSort(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </TableHead>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={`rounded-xl border border-border bg-card space-y-4 transition-all duration-500 ${pm ? "p-6 lg:p-8" : "p-5"}`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className={`font-medium text-foreground ${pm ? "text-base lg:text-lg" : "text-sm"}`}>
          Dados Detalhados
        </h3>
        {!pm && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar motorista, placa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        )}
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("motorista")}>Motorista</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Tipo</TableHead>
              <SortHeader label="KM" k="km" />
              <SortHeader label="Litros" k="litros" />
              <SortHeader label="Média" k="mediaKmL" />
              <SortHeader label="Meta" k="metaKmL" />
              <SortHeader label="Ganho/Perda" k="ganhoPerda" />
              <SortHeader label="Eficiência" k="eficiencia" />
              <SortHeader label="Custo" k="custoEstimado" />
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(r => {
              const st = statusLabel(r.eficiencia);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.motorista}</TableCell>
                  <TableCell>{r.placa}</TableCell>
                  <TableCell>{r.tipoFrota}</TableCell>
                  <TableCell className="text-right">{fmt(r.km)}</TableCell>
                  <TableCell className="text-right">{fmt(r.litros)}</TableCell>
                  <TableCell className="text-right">{fmtKmL(r.mediaKmL)}</TableCell>
                  <TableCell className="text-right">{fmtKmL(r.metaKmL)}</TableCell>
                  <TableCell className={`text-right font-medium ${r.ganhoPerda >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {r.ganhoPerda >= 0 ? "+" : ""}{r.ganhoPerda.toFixed(0)} L
                  </TableCell>
                  <TableCell className={`text-right font-medium ${r.eficiencia >= 100 ? "text-emerald-400" : "text-red-400"}`}>
                    {r.eficiencia.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">{formatBRL(r.custoEstimado)}</TableCell>
                  <TableCell className={`text-right font-medium ${st.cls}`}>{st.text}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{sorted.length} de {records.length} registros</p>
    </motion.div>
  );
};

export default DetailedTable;
