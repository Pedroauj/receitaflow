import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, FileCheck, FileSpreadsheet, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { processarNatura, gerarPlanilhaNatura } from "@/lib/processors/natura";
import type { NaturaProcessingResult } from "@/lib/processors/natura";
import { addRecord } from "@/lib/history";
import { Badge } from "@/components/ui/badge";

const Natura = () => {
  const navigate = useNavigate();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [planilhaFile, setPlanilhaFile] = useState<File | null>(null);
  const [result, setResult] = useState<NaturaProcessingResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const handlePdfChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setPdfFile(f); setResult(null); toast({ title: "PDF BOR carregado", description: f.name }); }
  }, []);

  const handlePlanilhaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setPlanilhaFile(f); setResult(null); toast({ title: "Planilha carregada", description: f.name }); }
  }, []);

  const handleDrop = useCallback((type: "pdf" | "planilha") => (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (type === "pdf" && /\.pdf$/i.test(f.name)) {
      setPdfFile(f); setResult(null); toast({ title: "PDF BOR carregado", description: f.name });
    } else if (type === "planilha" && /\.(xlsx?|csv)$/i.test(f.name)) {
      setPlanilhaFile(f); setResult(null); toast({ title: "Planilha carregada", description: f.name });
    }
  }, []);

  const handleProcess = async () => {
    if (!pdfFile || !planilhaFile) return;
    setProcessing(true);
    try {
      const [pdfBuffer, planilhaBuffer] = await Promise.all([
        pdfFile.arrayBuffer(),
        planilhaFile.arrayBuffer(),
      ]);
      const res = await processarNatura(pdfBuffer, planilhaBuffer);
      setResult(res);

      if (res.documentosBOR.length === 0) {
        toast({ title: "Nenhum compromisso encontrado", description: "Não foi possível localizar a seção COMPROMISSOS no PDF.", variant: "destructive" });
      } else {
        const alertas: string[] = [];
        if (res.totalNaoEncontrados > 0) alertas.push(`${res.totalNaoEncontrados} não encontrado(s)`);
        if (res.totalSemValor > 0) alertas.push(`${res.totalSemValor} sem valor`);

        toast({
          title: "Processamento concluído",
          description: `${res.totalEncontrados} encontrado(s)${alertas.length ? ` · ${alertas.join(" · ")}` : ""}`,
        });

        addRecord({
          cliente: "Natura",
          dataProcessamento: new Date().toISOString(),
          dataVencimento: new Date().toISOString(),
          dataRecebimento: new Date().toISOString(),
          quantidadeDocumentos: res.totalDocumentos,
          valorTotal: res.totalValor,
          valorInformadoBanco: 0,
          statusConferencia: res.totalNaoEncontrados > 0 ? "diverge" : "confere",
          quantidadeErros: res.totalNaoEncontrados + res.totalSemValor,
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao processar", description: "Verifique os arquivos e tente novamente.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const buffer = gerarPlanilhaNatura(result.registros);
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `importacao_natura_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Planilha gerada", description: a.download });
  };

  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusIcon = (status: string) => {
    if (status === "encontrado") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    if (status === "não encontrado") return <XCircle className="h-3.5 w-3.5 text-red-400" />;
    return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />;
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      "encontrado": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      "não encontrado": "bg-red-500/10 text-red-400 border-red-500/20",
      "sem valor": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
    return (
      <Badge variant="outline" className={`text-[10px] gap-1 ${styles[status] ?? ""}`}>
        {statusIcon(status)}
        {status}
      </Badge>
    );
  };

  const UploadArea = ({
    id, file, label, hint, accept, onChange, onDrop, icon: Icon,
  }: {
    id: string; file: File | null; label: string; hint: string; accept: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDrop: (e: React.DragEvent) => void;
    icon: any;
  }) => (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="rounded-xl p-8 text-center cursor-pointer transition-all flex-1"
      style={{ border: "1px dashed #2C2C2A" }}
      onClick={() => document.getElementById(id)?.click()}
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
            <p className="text-xs" style={{ color: "#5F5E5A" }}>Clique para trocar</p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "#1E1E20" }}>
            <Icon className="h-5 w-5" style={{ color: "#888780" }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "#F5F5F0" }}>{label}</p>
          <p className="text-xs" style={{ color: "#5F5E5A" }}>{hint}</p>
        </>
      )}
      <input id={id} type="file" accept={accept} className="hidden" onChange={onChange} />
    </div>
  );

  return (
    <div className="p-7">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center gap-3 mb-8">
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
          <h1 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>Natura</h1>
          <p className="text-xs mt-0.5" style={{ color: "#888780" }}>Cruzamento PDF BOR × Planilha do sistema</p>
        </div>
      </motion.div>

      {/* Upload Areas */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="card-elevated p-5 mb-5">
        <p className="text-sm font-semibold mb-4" style={{ color: "#F5F5F0" }}>Arquivos de entrada</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <UploadArea
            id="natura-pdf-input"
            file={pdfFile}
            label="PDF BOR"
            hint="Borderô de antecipação (.pdf)"
            accept=".pdf"
            onChange={handlePdfChange}
            onDrop={handleDrop("pdf")}
            icon={Upload}
          />
          <UploadArea
            id="natura-planilha-input"
            file={planilhaFile}
            label="Planilha do sistema"
            hint="Contas a receber (.xlsx, .xls)"
            accept=".xlsx,.xls,.csv"
            onChange={handlePlanilhaChange}
            onDrop={handleDrop("planilha")}
            icon={FileSpreadsheet}
          />
        </div>

        <Button
          className="mt-6 gradient-btn border-0 text-xs h-9 px-5"
          disabled={!pdfFile || !planilhaFile || processing}
          onClick={handleProcess}
        >
          {processing ? "Processando..." : "Processar arquivos"}
        </Button>
      </motion.div>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="card-elevated p-5">
          <p className="text-sm font-semibold mb-5" style={{ color: "#F5F5F0" }}>Resultado do Cruzamento</p>

          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-4 mb-5">
            <div className="rounded-lg p-4" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
              <p className="text-[11px] mb-1" style={{ color: "#5F5E5A" }}>Documentos no BOR</p>
              <p className="text-2xl font-semibold tabular-nums" style={{ color: "#F5F5F0" }}>{result.documentosBOR.length}</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
              <p className="text-[11px] mb-1" style={{ color: "#5F5E5A" }}>Encontrados</p>
              <p className="text-2xl font-semibold tabular-nums" style={{ color: "#34D399" }}>{result.totalEncontrados}</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
              <p className="text-[11px] mb-1" style={{ color: "#5F5E5A" }}>Não encontrados</p>
              <p className="text-2xl font-semibold tabular-nums" style={{ color: result.totalNaoEncontrados > 0 ? "#F87171" : "#F5F5F0" }}>{result.totalNaoEncontrados}</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
              <p className="text-[11px] mb-1" style={{ color: "#5F5E5A" }}>Valor total</p>
              <p className="text-2xl font-semibold tabular-nums" style={{ color: "#FAC775" }}>{formatBRL(result.totalValor)}</p>
            </div>
          </div>

          {/* Alerts */}
          {result.totalNaoEncontrados > 0 && (
            <div className="rounded-lg p-3 mb-4 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{result.totalNaoEncontrados} documento(s) do BOR não encontrado(s) na planilha do sistema.</p>
            </div>
          )}
          {result.totalSemValor > 0 && (
            <div className="rounded-lg p-3 mb-4 flex items-center gap-2" style={{ background: "rgba(245,158,11,0.08)", border: "0.5px solid rgba(245,158,11,0.2)" }}>
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300">{result.totalSemValor} documento(s) encontrado(s) sem valor na planilha.</p>
            </div>
          )}

          {/* Blocos por fatura */}
          <div className="rounded-lg p-4 mb-5" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
            <p className="text-sm font-medium mb-3" style={{ color: "#F5F5F0" }}>Detalhamento por Fatura</p>
            <div className="max-h-96 overflow-auto rounded-lg">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "0.5px solid #2C2C2A" }}>
                    {["Fatura (BOR)", "Documentos encontrados", "Valor total", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-left" style={{ color: "#5F5E5A" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.blocos.map((b, i) => (
                    <tr key={i} style={{ borderBottom: "0.5px solid #2C2C2A" }}>
                      <td className="px-4 py-2 font-mono text-sm" style={{ color: "#B4B2A9" }}>{b.fatura}</td>
                      <td className="px-4 py-2 text-sm" style={{ color: "#B4B2A9" }}>
                        {b.documentos.length > 0 ? b.documentos.join(", ") : "—"}
                      </td>
                      <td className="px-4 py-2 tabular-nums text-sm" style={{ color: b.status === "encontrado" ? "#B4B2A9" : "#5F5E5A" }}>
                        {b.status === "encontrado" ? formatBRL(b.valor) : "—"}
                      </td>
                      <td className="px-4 py-2">{statusBadge(b.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export */}
          {result.totalEncontrados > 0 && (
            <Button className="gradient-btn border-0 text-xs h-9 px-5" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />Exportar planilha de importação
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Natura;
