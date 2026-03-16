import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Upload, CalendarIcon, Download, AlertTriangle, CheckCircle2, XCircle, FileCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { processarMartinBrower, gerarPlanilhaFinal } from "@/lib/processors/martin-brower";
import type { ProcessingResult } from "@/lib/processors/types";

const MartinBrower = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dataVencimento, setDataVencimento] = useState<Date>();
  const [dataRecebimento, setDataRecebimento] = useState<Date>();
  const [valorBanco, setValorBanco] = useState("");
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const valorBancoNum = parseFloat(valorBanco.replace(",", ".")) || 0;
  const canProcess = file && dataVencimento && dataRecebimento && valorBancoNum > 0;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      toast({ title: "Planilha carregada", description: f.name });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && /\.xlsx?$/i.test(f.name)) {
      setFile(f);
      setResult(null);
      toast({ title: "Planilha carregada", description: f.name });
    }
  }, []);

  const handleProcess = async () => {
    if (!file || !dataVencimento) return;
    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = processarMartinBrower(buffer, dataVencimento);
      setResult(res);

      if (res.totalLinhasFiltradas === 0) {
        toast({
          title: "Nenhuma linha encontrada",
          description: "Não há registros com a data de vencimento informada.",
          variant: "destructive",
        });
      } else {
        const confere = Math.abs(res.totalValorBruto - valorBancoNum) < 0.01;
        if (!confere) {
          toast({
            title: "Divergência de valor",
            description: `Diferença de ${(res.totalValorBruto - valorBancoNum).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao processar",
        description: "Não foi possível ler a planilha. Verifique o formato do arquivo.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !dataRecebimento) return;
    const buffer = gerarPlanilhaFinal(result.documents, dataRecebimento);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `baixa_aviso_bancario_${format(dataRecebimento, "yyyy-MM-dd")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Arquivo gerado com sucesso", description: a.download });
  };

  const confere = result ? Math.abs(result.totalValorBruto - valorBancoNum) < 0.01 : false;
  const diferenca = result ? Math.round((result.totalValorBruto - valorBancoNum) * 100) / 100 : 0;

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Martin Brower</h1>
            <p className="text-sm text-muted-foreground">Baixa por aviso bancário</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Planilha de entrada</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileCheck className="h-6 w-6 text-primary" />
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Arraste um arquivo .xls ou .xlsx ou clique para selecionar
                  </p>
                </>
              )}
              <input
                id="file-input"
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Parâmetros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parâmetros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Data Vencimento */}
              <div className="space-y-2">
                <Label>Data de vencimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataVencimento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataVencimento
                        ? format(dataVencimento, "dd/MM/yyyy")
                        : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataVencimento}
                      onSelect={setDataVencimento}
                      locale={ptBR}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data Recebimento */}
              <div className="space-y-2">
                <Label>Data de recebimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataRecebimento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataRecebimento
                        ? format(dataRecebimento, "dd/MM/yyyy")
                        : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataRecebimento}
                      onSelect={setDataRecebimento}
                      locale={ptBR}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Valor Banco */}
              <div className="space-y-2">
                <Label>Valor recebido no banco (R$)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={valorBanco}
                  onChange={(e) => setValorBanco(e.target.value)}
                  className="tabular-nums"
                />
              </div>
            </div>

            <Button
              className="mt-6"
              disabled={!canProcess || processing}
              onClick={handleProcess}
            >
              {processing ? "Processando..." : "Processar Planilha"}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultado do Processamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resumo detalhado */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Linhas lidas</p>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {result.totalLinhasLidas}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Filtradas pela data</p>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {result.totalLinhasFiltradas}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Válidas</p>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {result.totalLinhasValidas}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Com erro</p>
                  <p className={cn(
                    "text-2xl font-semibold tabular-nums",
                    result.totalLinhasComErro > 0 ? "text-destructive" : "text-foreground"
                  )}>
                    {result.totalLinhasComErro}
                  </p>
                </div>
              </div>

              {/* Valores e status */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total processado</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {formatBRL(result.totalValorBruto)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Valor banco</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {formatBRL(valorBancoNum)}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-lg border p-4",
                    confere
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  )}
                >
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    {confere ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span
                      className={cn(
                        "font-semibold text-sm",
                        confere ? "text-green-700" : "text-red-700"
                      )}
                    >
                      {confere ? "Confere" : `Diverge (${formatBRL(diferenca)})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nenhuma linha encontrada */}
              {result.totalLinhasFiltradas === 0 && (
                <div className="rounded-lg border border-border bg-muted/50 p-4 flex items-center gap-3">
                  <Info className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma linha encontrada para a data de vencimento informada.
                  </p>
                </div>
              )}

              {/* Erros */}
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-800">
                      {result.errors.length} erro(s) encontrado(s)
                    </p>
                  </div>
                  <div className="max-h-64 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-amber-800">Linha</TableHead>
                          <TableHead className="text-amber-800">Fatura</TableHead>
                          <TableHead className="text-amber-800">Motivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.errors.map((err, i) => (
                          <TableRow key={i}>
                            <TableCell className="tabular-nums">{err.row}</TableCell>
                            <TableCell className="font-mono text-sm">{err.fatura || "—"}</TableCell>
                            <TableCell className="text-sm">{err.motivo}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Download */}
              <Button onClick={handleDownload} disabled={result.documents.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Baixar planilha final
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MartinBrower;
