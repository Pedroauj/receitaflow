import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Eye, CheckCircle2, XCircle, FileSpreadsheet, Hash, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getRecords, getStats, type HistoryRecord } from "@/lib/history";
import { clients } from "@/lib/clients";
import { usePagination } from "@/hooks/usePagination";
import TablePagination from "@/components/TablePagination";
import { motion } from "framer-motion";
import SectionContainer from "@/components/dashboard/SectionContainer";

const Historico = () => {
  const navigate = useNavigate();
  const records = getRecords();
  const stats = getStats();

  const [clienteFilter, setClienteFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (clienteFilter !== "all" && r.cliente !== clienteFilter) return false;
      if (dateFrom || dateTo) {
        const d = parseISO(r.dataProcessamento);
        if (dateFrom && dateTo) {
          if (!isWithinInterval(d, { start: startOfDay(dateFrom), end: endOfDay(dateTo) })) return false;
        } else if (dateFrom) {
          if (d < startOfDay(dateFrom)) return false;
        } else if (dateTo) {
          if (d > endOfDay(dateTo)) return false;
        }
      }
      return true;
    });
  }, [records, clienteFilter, dateFrom, dateTo]);

  const { page, setPage, totalPages, paginatedItems, from, to, totalItems } = usePagination(filtered, 20);

  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatDate = (iso: string) => { try { return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: ptBR }); } catch { return iso; } };
  const formatDateShort = (iso: string) => { try { return format(parseISO(iso), "dd/MM/yyyy"); } catch { return iso; } };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Histórico de Processamentos</h1>
        <p className="text-sm text-muted-foreground mt-1">Registros de conversões realizadas</p>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: FileSpreadsheet, label: "Planilhas processadas", value: stats.totalPlanilhas },
          { icon: Hash, label: "Documentos processados", value: stats.totalDocumentos },
          { icon: DollarSign, label: "Valor total processado", value: formatBRL(stats.valorTotalProcessado) },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03 }}
            className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <SectionContainer delay={0.06}>
        <p className="text-sm font-medium text-foreground mb-3">Filtros</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Cliente</Label>
            <Select value={clienteFilter} onValueChange={setClienteFilter}>
              <SelectTrigger className="border-border bg-muted text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todos</SelectItem>
                {clients.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Data inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-border bg-muted", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />{dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Data final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-border bg-muted", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />{dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {(dateFrom || dateTo || clienteFilter !== "all") && (
          <Button variant="ghost" size="sm" className="mt-3 text-xs text-muted-foreground" onClick={() => { setClienteFilter("all"); setDateFrom(undefined); setDateTo(undefined); }}>
            Limpar filtros
          </Button>
        )}
      </SectionContainer>

      {/* Table */}
      <SectionContainer noPadding delay={0.1}>
        <div className="border-b border-white/10 px-5 py-3.5 sm:px-6">
          <p className="text-sm font-semibold text-foreground">Processamentos ({filtered.length})</p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 px-5">
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum processamento encontrado.</p>
          </div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Cliente", "Data processamento", "Data vencimento", "Documentos", "Valor total", "Status", ""].map((h, i) => (
                      <th key={h || 'actions'} className={cn("px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-left text-muted-foreground bg-white/[0.03]", (i === 3 || i === 4) && "text-right", i === 6 && "text-right w-12")}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((r, idx) => (
                    <tr key={r.id} className={cn(
                      "border-t border-white/5 transition-colors hover:bg-white/[0.035]",
                      idx % 2 !== 0 && "bg-white/[0.015]"
                    )}>
                      <td className="px-5 py-3 text-sm font-medium text-foreground">{r.cliente}</td>
                      <td className="px-5 py-3 text-sm tabular-nums text-foreground/70">{formatDate(r.dataProcessamento)}</td>
                      <td className="px-5 py-3 text-sm tabular-nums text-foreground/70">{formatDateShort(r.dataVencimento)}</td>
                      <td className="px-5 py-3 text-sm tabular-nums text-right text-foreground/70">{r.quantidadeDocumentos}</td>
                      <td className="px-5 py-3 text-sm tabular-nums text-right font-medium text-primary">{formatBRL(r.valorTotal)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {r.statusConferencia === "confere" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success-foreground" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                          )}
                          <span className={cn("text-xs font-medium capitalize", r.statusConferencia === "confere" ? "text-success-foreground" : "text-destructive")}>
                            {r.statusConferencia}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="h-7 w-7 rounded-md inline-flex items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination page={page} totalPages={totalPages} from={from} to={to} totalItems={totalItems} onPageChange={setPage} />
          </>
        )}
      </SectionContainer>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-foreground">Detalhes do Processamento</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-0">
              {[
                ["Cliente", selectedRecord.cliente],
                ["Data processamento", formatDate(selectedRecord.dataProcessamento)],
                ["Data vencimento", formatDateShort(selectedRecord.dataVencimento)],
                ["Data recebimento", formatDateShort(selectedRecord.dataRecebimento)],
                ["Documentos", String(selectedRecord.quantidadeDocumentos)],
                ["Valor total", formatBRL(selectedRecord.valorTotal)],
                ["Valor banco", formatBRL(selectedRecord.valorInformadoBanco)],
                ["Erros", String(selectedRecord.quantidadeErros)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2.5 border-b border-border/50">
                  <span className="text-[13px] text-muted-foreground">{label}</span>
                  <span className="text-[13px] font-medium tabular-nums text-foreground">{value}</span>
                </div>
              ))}
              <div className="flex justify-between py-2.5">
                <span className="text-[13px] text-muted-foreground">Status</span>
                <div className="flex items-center gap-1.5">
                  {selectedRecord.statusConferencia === "confere" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success-foreground" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                  )}
                  <span className={cn("text-[13px] font-medium capitalize", selectedRecord.statusConferencia === "confere" ? "text-success-foreground" : "text-destructive")}>
                    {selectedRecord.statusConferencia}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Historico;
