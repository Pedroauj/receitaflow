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

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (iso: string) => {
    try { return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: ptBR }); } catch { return iso; }
  };

  const formatDateShort = (iso: string) => {
    try { return format(parseISO(iso), "dd/MM/yyyy"); } catch { return iso; }
  };

  return (
    <div className="p-7">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>
          Histórico de Processamentos
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "#888780" }}>
          Registros de conversões realizadas
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        {[
          { icon: FileSpreadsheet, label: "Planilhas processadas", value: stats.totalPlanilhas },
          { icon: Hash, label: "Documentos processados", value: stats.totalDocumentos },
          { icon: DollarSign, label: "Valor total processado", value: formatBRL(stats.valorTotalProcessado) },
        ].map((stat) => (
          <div key={stat.label} className="card-elevated p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#412402" }}>
              <stat.icon className="h-5 w-5" style={{ color: "#EF9F27" }} />
            </div>
            <div>
              <p className="text-[11px]" style={{ color: "#5F5E5A" }}>{stat.label}</p>
              <p className="text-xl font-semibold tabular-nums" style={{ color: "#F5F5F0" }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-elevated p-5 mb-6">
        <p className="text-sm font-semibold mb-4" style={{ color: "#F5F5F0" }}>Filtros</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-[11px]" style={{ color: "#5F5E5A" }}>Cliente</Label>
            <Select value={clienteFilter} onValueChange={setClienteFilter}>
              <SelectTrigger className="border-[#2C2C2A] bg-[#1E1E20]" style={{ color: "#B4B2A9" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1E1E20] border-[#2C2C2A]">
                <SelectItem value="all">Todos</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px]" style={{ color: "#5F5E5A" }}>Data inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-[#2C2C2A] bg-[#1E1E20]", !dateFrom && "text-muted-foreground")} style={{ color: dateFrom ? "#B4B2A9" : undefined }}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1E1E20] border-[#2C2C2A]" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px]" style={{ color: "#5F5E5A" }}>Data final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-[#2C2C2A] bg-[#1E1E20]", !dateTo && "text-muted-foreground")} style={{ color: dateTo ? "#B4B2A9" : undefined }}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1E1E20] border-[#2C2C2A]" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {(dateFrom || dateTo || clienteFilter !== "all") && (
          <Button variant="ghost" size="sm" className="mt-3 text-xs" style={{ color: "#888780" }} onClick={() => { setClienteFilter("all"); setDateFrom(undefined); setDateTo(undefined); }}>
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: "0.5px solid #2C2C2A" }}>
          <p className="text-sm font-semibold" style={{ color: "#F5F5F0" }}>
            Processamentos ({filtered.length})
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3" style={{ color: "#5F5E5A" }} />
            <p className="text-sm" style={{ color: "#888780" }}>Nenhum processamento encontrado.</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "0.5px solid #2C2C2A" }}>
                  {["Cliente", "Data processamento", "Data vencimento", "Documentos", "Valor total", "Status", "Ações"].map((h, i) => (
                    <th key={h} className={cn("px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-left", (i === 3 || i === 4) && "text-right", i === 6 && "text-right")} style={{ color: "#5F5E5A" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="transition-colors" style={{ borderBottom: "0.5px solid #2C2C2A" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#242426")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "#F5F5F0" }}>{r.cliente}</td>
                    <td className="px-5 py-3 text-sm tabular-nums" style={{ color: "#B4B2A9" }}>{formatDate(r.dataProcessamento)}</td>
                    <td className="px-5 py-3 text-sm tabular-nums" style={{ color: "#B4B2A9" }}>{formatDateShort(r.dataVencimento)}</td>
                    <td className="px-5 py-3 text-sm tabular-nums text-right" style={{ color: "#B4B2A9" }}>{r.quantidadeDocumentos}</td>
                    <td className="px-5 py-3 text-sm tabular-nums text-right font-medium" style={{ color: "#FAC775" }}>{formatBRL(r.valorTotal)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {r.statusConferencia === "confere" ? (
                          <CheckCircle2 className="h-4 w-4" style={{ color: "#C0DD97" }} />
                        ) : (
                          <XCircle className="h-4 w-4" style={{ color: "#E74C3C" }} />
                        )}
                        <span className={cn("text-xs font-medium capitalize")} style={{ color: r.statusConferencia === "confere" ? "#C0DD97" : "#E74C3C" }}>
                          {r.statusConferencia}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setSelectedRecord(r)} className="h-7 w-7 rounded-md inline-flex items-center justify-center transition-colors" style={{ color: "#888780" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#412402"; e.currentTarget.style.color = "#FAC775"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888780"; }}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="sm:max-w-md" style={{ background: "#1E1E20", border: "0.5px solid #2C2C2A" }}>
          <DialogHeader>
            <DialogTitle className="text-base" style={{ color: "#F5F5F0" }}>Detalhes do Processamento</DialogTitle>
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
                <div key={label} className="flex justify-between py-3" style={{ borderBottom: "0.5px solid #2C2C2A" }}>
                  <span className="text-sm" style={{ color: "#888780" }}>{label}</span>
                  <span className="text-sm font-medium tabular-nums" style={{ color: "#F5F5F0" }}>{value}</span>
                </div>
              ))}
              <div className="flex justify-between py-3">
                <span className="text-sm" style={{ color: "#888780" }}>Status</span>
                <div className="flex items-center gap-1.5">
                  {selectedRecord.statusConferencia === "confere" ? (
                    <CheckCircle2 className="h-4 w-4" style={{ color: "#C0DD97" }} />
                  ) : (
                    <XCircle className="h-4 w-4" style={{ color: "#E74C3C" }} />
                  )}
                  <span className="text-sm font-medium capitalize" style={{ color: selectedRecord.statusConferencia === "confere" ? "#C0DD97" : "#E74C3C" }}>
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
