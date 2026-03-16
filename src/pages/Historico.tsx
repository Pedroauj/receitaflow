import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Zap, CalendarIcon, Eye, CheckCircle2, XCircle, FileSpreadsheet, Hash, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    try {
      return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return iso;
    }
  };

  const formatDateShort = (iso: string) => {
    try {
      return format(parseISO(iso), "dd/MM/yyyy");
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground tracking-tight">Histórico de Processamentos</h1>
            <p className="text-xs text-muted-foreground">Registros de conversões realizadas</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-secondary/50 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Planilhas processadas</p>
              <p className="text-xl font-semibold tabular-nums text-foreground">{stats.totalPlanilhas}</p>
            </div>
          </div>
          <div className="rounded-lg bg-secondary/50 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Documentos processados</p>
              <p className="text-xl font-semibold tabular-nums text-foreground">{stats.totalDocumentos}</p>
            </div>
          </div>
          <div className="rounded-lg bg-secondary/50 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor total processado</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">{formatBRL(stats.valorTotalProcessado)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <Select value={clienteFilter} onValueChange={setClienteFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">
              Processamentos ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum processamento encontrado.</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data processamento</TableHead>
                      <TableHead>Data vencimento</TableHead>
                      <TableHead className="text-right">Documentos</TableHead>
                      <TableHead className="text-right">Valor total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.cliente}</TableCell>
                        <TableCell className="tabular-nums text-sm">{formatDate(r.dataProcessamento)}</TableCell>
                        <TableCell className="tabular-nums text-sm">{formatDateShort(r.dataVencimento)}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.quantidadeDocumentos}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{formatBRL(r.valorTotal)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {r.statusConferencia === "confere" ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className={cn("text-xs font-medium capitalize", r.statusConferencia === "confere" ? "text-success" : "text-destructive")}>
                              {r.statusConferencia}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(r)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Detalhes do Processamento</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-3 text-sm">
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
                <div key={label} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium tabular-nums text-foreground">{value}</span>
                </div>
              ))}
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Status</span>
                <div className="flex items-center gap-1.5">
                  {selectedRecord.statusConferencia === "confere" ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className={cn("font-medium capitalize", selectedRecord.statusConferencia === "confere" ? "text-success" : "text-destructive")}>
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
