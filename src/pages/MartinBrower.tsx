import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Upload, CalendarIcon, Download, AlertTriangle, CheckCircle2, XCircle, FileCheck, Info, Zap } from "lucide-react";
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
import { addRecord } from "@/lib/history";

const MartinBrower = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dataRecebimento, setDataRecebimento] = useState<Date>();
  const [dataVencimento, setDataVencimento] = useState<Date>();
  const [valorBanco, setValorBanco] = useState("");
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const valorBancoNum = parseFloat(valorBanco.replace(",", ".")) || 0;
  const canProcess = file && dataRecebimento && dataVencimento && valorBancoNum > 0;

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
    if (!file || !dataRecebimento || !dataVencimento) return;
    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = processarMartinBrower(buffer, dataVencimento);
      setResult(res);

      if (res.totalLinhasLidas > 0) {
        const statusConf = Math.abs(res.totalValorBruto - valorBancoNum) < 0.01 ? "confere" : "diverge";
        addRecord({
          cliente: "Martin Brower",
          dataProcessamento: new Date().toISOString(),
          dataVencimento: dataVencimento.toISOString(),
          dataRecebimento: dataRecebimento.toISOString(),
          quantidadeDocumentos: res.totalDocumentos,
          valorTotal: res.totalValorBruto,
          valorInformadoBanco: valorBancoNum,
          statusConferencia: statusConf,
          quantidadeErros: res.totalLinhasComErro,
        });
      }

      if (res.totalLinhasValidas === 0) {
        toast({
          title: "Nenhuma linha válida encontrada",
          description: "Nenhum documento encontrado para a data de vencimento informada.",
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
      <header className="border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground tracking-tight">Martin Brower</h1>
            <p className="text-xs text-muted-foreground">Baixa por aviso bancário</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">Planilha de entrada</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">Clique para trocar o arquivo</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-foreground font-medium mb-1">
                    Arraste ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: .xls, .xlsx
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
            <CardTitle className="text-sm font-semibold tracking-tight">Parâmetros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data de vencimento</Label>
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
                      {dataVencimento ? format(dataVencimento, "dd/MM/yyyy") : "Selecionar"}
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

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data de recebimento</Label>
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
                      {dataRecebimento ? format(dataRecebimento, "dd/MM/yyyy") : "Selecionar"}
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

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Valor recebido no banco (R$)</Label>
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
              <CardTitle className="text-sm font-semibold tracking-tight">Resultado do Processamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resumo detalhado */}
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Linhas lidas</p>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {result.totalLinhasLidas}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Filtradas pela data</p>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {result.totalLinhasLidas - result.totalLinhasFiltradasData - result.totalLinhasIgnoradas}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Já pagas</p>
                  <p className="text-2xl font-semibold tabular-nums text-muted-foreground">
                    {result.totalLinhasRemovidasPagamento}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Válidas</p>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {result.totalLinhasValidas}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Ignoradas</p>
                  <p className="text-2xl font-semibold tabular-nums text-muted-foreground">
                    {result.totalLinhasIgnoradas}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
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
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total processado</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {formatBRL(result.totalValorBruto)}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Valor banco</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {formatBRL(valorBancoNum)}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-lg p-4",
                    confere
                      ? "bg-success/10 border border-success/20"
                      : "bg-destructive/10 border border-destructive/20"
                  )}
                >
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    {confere ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span
                      className={cn(
                        "font-semibold text-sm",
                        confere ? "text-success" : "text-destructive"
                      )}
                    >
                      {confere ? "Confere" : `Diverge (${formatBRL(diferenca)})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nenhuma linha encontrada */}
              {result.totalLinhasValidas === 0 && (
                <div className="rounded-lg border border-border bg-secondary/30 p-4 flex items-center gap-3">
                  <Info className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum documento válido encontrado para a data de vencimento selecionada.
                  </p>
                </div>
              )}

              {/* Preview de validação */}
              {result.preview.length > 0 && (
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      Preview de validação (primeiras {result.preview.length} linhas filtradas)
                    </p>
                  </div>
                  <div className="max-h-72 overflow-auto rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Linha</TableHead>
                          <TableHead>Data Vcto.</TableHead>
                          <TableHead>Nº Fatura</TableHead>
                          <TableHead>Série</TableHead>
                          <TableHead>Nº Documento</TableHead>
                          <TableHead>Valor Bruto</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.preview.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="tabular-nums">{p.row}</TableCell>
                            <TableCell className="text-sm">{p.dataVcto || "—"}</TableCell>
                            <TableCell className="font-mono text-sm">{p.faturaOriginal || "—"}</TableCell>
                            <TableCell className="text-sm">{p.serie || "—"}</TableCell>
                            <TableCell className="font-mono text-sm">{p.numeroDocumento || "—"}</TableCell>
                            <TableCell className="tabular-nums text-sm">
                              {p.valorBrutoConvertido != null ? formatBRL(p.valorBrutoConvertido) : p.valorBrutoOriginal || "—"}
                            </TableCell>
                            <TableCell>
                              <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                p.status === "válida" && "bg-success/10 text-success",
                                p.status === "erro" && "bg-destructive/10 text-destructive",
                                p.status === "ignorada" && "bg-secondary text-muted-foreground",
                              )}>
                                {p.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Erros */}
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <p className="text-sm font-medium text-warning">
                      {result.errors.length} erro(s) encontrado(s)
                    </p>
                  </div>
                  <div className="max-h-64 overflow-auto rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Linha</TableHead>
                          <TableHead>Fatura</TableHead>
                          <TableHead>Motivo</TableHead>
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
