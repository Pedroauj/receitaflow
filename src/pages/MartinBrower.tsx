import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Upload, CalendarIcon, Download, AlertTriangle, CheckCircle2, XCircle, FileCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
    if (f) { setFile(f); setResult(null); toast({ title: "Planilha carregada", description: f.name }); }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && /\.xlsx?$/i.test(f.name)) { setFile(f); setResult(null); toast({ title: "Planilha carregada", description: f.name }); }
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
        addRecord({ cliente: "Martin Brower", dataProcessamento: new Date().toISOString(), dataVencimento: dataVencimento.toISOString(), dataRecebimento: dataRecebimento.toISOString(), quantidadeDocumentos: res.totalDocumentos, valorTotal: res.totalValorBruto, valorInformadoBanco: valorBancoNum, statusConferencia: statusConf, quantidadeErros: res.totalLinhasComErro });
      }
      if (res.totalLinhasValidas === 0) {
        toast({ title: "Nenhuma linha válida encontrada", description: "Nenhum documento em aberto foi encontrado para a data de vencimento informada.", variant: "destructive" });
      } else {
        const confere = Math.abs(res.totalValorBruto - valorBancoNum) < 0.01;
        if (!confere) { toast({ title: "Divergência de valor", description: `Diferença de ${(res.totalValorBruto - valorBancoNum).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, variant: "destructive" }); }
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao processar", description: "Não foi possível ler a planilha. Verifique o formato do arquivo.", variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const handleDownload = () => {
    if (!result || !dataRecebimento) return;
    const buffer = gerarPlanilhaFinal(result.documents, dataRecebimento);
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
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
  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="p-7">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: "#1E1E20", border: "0.5px solid #2C2C2A", color: "#888780" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#412402"; e.currentTarget.style.color = "#FAC775"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#1E1E20"; e.currentTarget.style.color = "#888780"; }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>Martin Brower</h1>
          <p className="text-xs mt-0.5" style={{ color: "#888780" }}>Baixa por aviso bancário</p>
        </div>
      </div>

      {/* Upload */}
      <div className="card-elevated p-5 mb-5">
        <p className="text-sm font-semibold mb-4" style={{ color: "#F5F5F0" }}>Planilha de entrada</p>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="rounded-xl p-10 text-center cursor-pointer transition-all"
          style={{ border: "1px dashed #2C2C2A" }}
          onClick={() => document.getElementById("file-input")?.click()}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#633806")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2C2C2A")}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: "#412402" }}>
                <FileCheck className="h-5 w-5" style={{ color: "#EF9F27" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium" style={{ color: "#F5F5F0" }}>{file.name}</p>
                <p className="text-xs" style={{ color: "#5F5E5A" }}>Clique para trocar o arquivo</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "#1E1E20" }}>
                <Upload className="h-6 w-6" style={{ color: "#888780" }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "#F5F5F0" }}>Arraste ou clique para selecionar</p>
              <p className="text-xs" style={{ color: "#5F5E5A" }}>Formatos aceitos: .xls, .xlsx</p>
            </>
          )}
          <input id="file-input" type="file" accept=".xls,.xlsx" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {/* Parâmetros */}
      <div className="card-elevated p-5 mb-5">
        <p className="text-sm font-semibold mb-4" style={{ color: "#F5F5F0" }}>Parâmetros</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-[11px]" style={{ color: "#5F5E5A" }}>Data de vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-[#2C2C2A] bg-[#1E1E20]", !dataVencimento && "text-muted-foreground")} style={{ color: dataVencimento ? "#B4B2A9" : undefined }}>
                  <CalendarIcon className="mr-2 h-4 w-4" />{dataVencimento ? format(dataVencimento, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1E1E20] border-[#2C2C2A]" align="start">
                <Calendar mode="single" selected={dataVencimento} onSelect={setDataVencimento} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px]" style={{ color: "#5F5E5A" }}>Data de recebimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-[#2C2C2A] bg-[#1E1E20]", !dataRecebimento && "text-muted-foreground")} style={{ color: dataRecebimento ? "#B4B2A9" : undefined }}>
                  <CalendarIcon className="mr-2 h-4 w-4" />{dataRecebimento ? format(dataRecebimento, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1E1E20] border-[#2C2C2A]" align="start">
                <Calendar mode="single" selected={dataRecebimento} onSelect={setDataRecebimento} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px]" style={{ color: "#5F5E5A" }}>Valor recebido no banco (R$)</Label>
            <Input type="text" inputMode="decimal" placeholder="0,00" value={valorBanco} onChange={(e) => setValorBanco(e.target.value)} className="tabular-nums border-[#2C2C2A] bg-[#1E1E20]" style={{ color: "#B4B2A9" }} />
          </div>
        </div>
        <Button className="mt-6 gradient-btn border-0 text-xs h-9 px-5" disabled={!canProcess || processing} onClick={handleProcess}>
          {processing ? "Processando..." : "Processar Planilha"}
        </Button>
      </div>

      {/* Resultado */}
      {result && (
        <div className="card-elevated p-5">
          <p className="text-sm font-semibold mb-5" style={{ color: "#F5F5F0" }}>Resultado do Processamento</p>

          {/* Resumo */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 mb-5">
            {[
              { label: "Linhas lidas", value: result.totalLinhasLidas },
              { label: "Filtradas por Data Vcto.", value: result.totalLinhasFiltradasData },
              { label: "Pgto vazio", value: result.totalLinhasPagamentoVazio },
              { label: "Pgto preenchido", value: result.totalLinhasPagamentoPreenchido, dim: true },
              { label: "Removidas por pagamento", value: result.totalLinhasRemovidasPagamento, dim: true },
              { label: "Válidas finais", value: result.totalLinhasValidas },
              { label: "Com erro", value: result.totalLinhasComErro, error: result.totalLinhasComErro > 0 },
            ].map((s) => (
              <div key={s.label} className="rounded-lg p-4" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
                <p className="text-[11px] mb-1" style={{ color: "#5F5E5A" }}>{s.label}</p>
                <p className="text-2xl font-semibold tabular-nums" style={{ color: s.error ? "#E74C3C" : s.dim ? "#888780" : "#F5F5F0" }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Valores */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
            <div className="rounded-lg p-4" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
              <p className="text-[11px] mb-1" style={{ color: "#5F5E5A" }}>Total processado</p>
              <p className="text-lg font-semibold tabular-nums" style={{ color: "#FAC775" }}>{formatBRL(result.totalValorBruto)}</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
              <p className="text-[11px] mb-1" style={{ color: "#5F5E5A" }}>Valor banco</p>
              <p className="text-lg font-semibold tabular-nums" style={{ color: "#F5F5F0" }}>{formatBRL(valorBancoNum)}</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
              <p className="text-[11px] mb-1" style={{ color: "#5F5E5A" }}>Diferença</p>
              <p className="text-lg font-semibold tabular-nums" style={{ color: diferenca === 0 ? "#C0DD97" : "#E74C3C" }}>{formatBRL(diferenca)}</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: confere ? "rgba(39,80,10,0.15)" : "rgba(231,76,60,0.1)", border: `0.5px solid ${confere ? "#27500A" : "#E74C3C33"}` }}>
              <p className="text-[11px] mb-1" style={{ color: "#5F5E5A" }}>Status</p>
              <div className="flex items-center gap-2">
                {confere ? <CheckCircle2 className="h-5 w-5" style={{ color: "#C0DD97" }} /> : <XCircle className="h-5 w-5" style={{ color: "#E74C3C" }} />}
                <span className="font-semibold text-sm" style={{ color: confere ? "#C0DD97" : "#E74C3C" }}>{confere ? "Confere" : "Diverge"}</span>
              </div>
            </div>
          </div>

          {result.totalLinhasValidas === 0 && (
            <div className="rounded-lg p-4 flex items-center gap-3 mb-5" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
              <Info className="h-5 w-5 shrink-0" style={{ color: "#5F5E5A" }} />
              <p className="text-sm" style={{ color: "#888780" }}>Nenhum documento em aberto foi encontrado para a data de vencimento selecionada.</p>
            </div>
          )}

          {/* Preview */}
          {result.preview.length > 0 && (
            <div className="rounded-lg p-4 mb-5" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4" style={{ color: "#5F5E5A" }} />
                <p className="text-sm font-medium" style={{ color: "#F5F5F0" }}>Preview de validação (primeiras {result.preview.length} linhas)</p>
              </div>
              <div className="max-h-72 overflow-auto rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "0.5px solid #2C2C2A" }}>
                      {["Linha", "Data Vcto.", "Data Pagamento", "Nº Fatura", "Valor Bruto", "Status"].map((h) => (
                        <th key={h} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-left" style={{ color: "#5F5E5A" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((p, i) => (
                      <tr key={i} style={{ borderBottom: "0.5px solid #2C2C2A" }}>
                        <td className="px-4 py-2 tabular-nums text-sm" style={{ color: "#B4B2A9" }}>{p.row}</td>
                        <td className="px-4 py-2 text-sm" style={{ color: "#B4B2A9" }}>{p.dataVcto || "—"}</td>
                        <td className="px-4 py-2 text-sm" style={{ color: "#B4B2A9" }}>{p.dataPagamento || "—"}</td>
                        <td className="px-4 py-2 font-mono text-sm" style={{ color: "#B4B2A9" }}>{p.faturaOriginal || "—"}</td>
                        <td className="px-4 py-2 tabular-nums text-sm" style={{ color: "#B4B2A9" }}>{p.valorBrutoOriginal || (p.valorBrutoConvertido != null ? formatBRL(p.valorBrutoConvertido) : "—")}</td>
                        <td className="px-4 py-2">
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full")}
                            style={{
                              background: p.status === "válida" ? "#27500A" : p.status === "erro" ? "rgba(231,76,60,0.15)" : "#2C2C2A",
                              color: p.status === "válida" ? "#C0DD97" : p.status === "erro" ? "#E74C3C" : "#888780",
                            }}
                          >{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Erros */}
          {result.errors.length > 0 && (
            <div className="rounded-lg p-4 mb-5" style={{ background: "rgba(231,76,60,0.05)", border: "0.5px solid rgba(231,76,60,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4" style={{ color: "#EF9F27" }} />
                <p className="text-sm font-medium" style={{ color: "#EF9F27" }}>{result.errors.length} erro(s) encontrado(s)</p>
              </div>
              <div className="max-h-64 overflow-auto rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "0.5px solid #2C2C2A" }}>
                      {["Linha", "Fatura", "Motivo"].map((h) => (
                        <th key={h} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-left" style={{ color: "#5F5E5A" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, i) => (
                      <tr key={i} style={{ borderBottom: "0.5px solid #2C2C2A" }}>
                        <td className="px-4 py-2 tabular-nums text-sm" style={{ color: "#B4B2A9" }}>{err.row}</td>
                        <td className="px-4 py-2 font-mono text-sm" style={{ color: "#B4B2A9" }}>{err.fatura || "—"}</td>
                        <td className="px-4 py-2 text-sm" style={{ color: "#B4B2A9" }}>{err.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Download */}
          <Button className="gradient-btn border-0 text-xs h-9 px-5" onClick={handleDownload} disabled={result.documents.length === 0}>
            <Download className="mr-2 h-4 w-4" />Baixar planilha final
          </Button>
        </div>
      )}
    </div>
  );
};

export default MartinBrower;
