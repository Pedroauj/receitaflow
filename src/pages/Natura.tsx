import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, FileCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { processarNatura, gerarPlanilhaNatura } from "@/lib/processors/natura";
import type { NaturaProcessingResult } from "@/lib/processors/natura";
import { addRecord } from "@/lib/history";

const Natura = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<NaturaProcessingResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      toast({ title: "PDF carregado", description: f.name });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && /\.pdf$/i.test(f.name)) {
      setFile(f);
      setResult(null);
      toast({ title: "PDF carregado", description: f.name });
    }
  }, []);

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = await processarNatura(buffer);
      setResult(res);
      if (res.totalDocumentos === 0) {
        toast({ title: "Nenhum compromisso encontrado", description: "Não foi possível localizar a seção COMPROMISSOS ou extrair documentos do PDF.", variant: "destructive" });
      } else {
        toast({ title: "PDF processado com sucesso", description: `${res.totalDocumentos} documento(s) encontrado(s).` });
        addRecord({
          cliente: "Natura",
          dataProcessamento: new Date().toISOString(),
          dataVencimento: new Date().toISOString(),
          dataRecebimento: new Date().toISOString(),
          quantidadeDocumentos: res.totalDocumentos,
          valorTotal: res.totalValor,
          valorInformadoBanco: 0,
          statusConferencia: "confere",
          quantidadeErros: 0,
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao processar", description: "Não foi possível ler o PDF. Verifique o formato do arquivo.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const buffer = gerarPlanilhaNatura(result.documents);
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `baixa_natura_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Arquivo gerado com sucesso", description: a.download });
  };

  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="p-7">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 mb-8"
      >
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
          <p className="text-xs mt-0.5" style={{ color: "#888780" }}>Baixa por aviso bancário — PDF BOR</p>
        </div>
      </motion.div>

      {/* Upload */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="card-elevated p-5 mb-5"
      >
        <p className="text-sm font-semibold mb-4" style={{ color: "#F5F5F0" }}>PDF BOR de entrada</p>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="rounded-xl p-10 text-center cursor-pointer transition-all"
          style={{ border: "1px dashed #2C2C2A" }}
          onClick={() => document.getElementById("natura-file-input")?.click()}
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
              <p className="text-xs" style={{ color: "#5F5E5A" }}>Formato aceito: .pdf</p>
            </>
          )}
          <input id="natura-file-input" type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
        </div>

        <Button
          className="mt-6 gradient-btn border-0 text-xs h-9 px-5"
          disabled={!file || processing}
          onClick={handleProcess}
        >
          {processing ? "Processando..." : "Processar PDF"}
        </Button>
      </motion.div>

      {/* Result */}
      {result && result.totalDocumentos > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card-elevated p-5"
        >
          <p className="text-sm font-semibold mb-5" style={{ color: "#F5F5F0" }}>Resultado do Processamento</p>

          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-2 mb-5">
            <div className="rounded-lg p-4" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
              <p className="text-[11px] mb-1" style={{ color: "#5F5E5A" }}>Total de documentos</p>
              <p className="text-2xl font-semibold tabular-nums" style={{ color: "#F5F5F0" }}>{result.totalDocumentos}</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
              <p className="text-[11px] mb-1" style={{ color: "#5F5E5A" }}>Valor total</p>
              <p className="text-2xl font-semibold tabular-nums" style={{ color: "#FAC775" }}>{formatBRL(result.totalValor)}</p>
            </div>
          </div>

          {/* Preview table */}
          <div className="rounded-lg p-4 mb-5" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
            <p className="text-sm font-medium mb-3" style={{ color: "#F5F5F0" }}>Prévia da planilha de baixa</p>
            <div className="max-h-80 overflow-auto rounded-lg">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "0.5px solid #2C2C2A" }}>
                    {["Filial", "Série", "Nº Documento", "Tipo", "Valor"].map((h) => (
                      <th key={h} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-left" style={{ color: "#5F5E5A" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.documents.map((doc, i) => (
                    <tr key={i} style={{ borderBottom: "0.5px solid #2C2C2A" }}>
                      <td className="px-4 py-2 text-sm" style={{ color: "#B4B2A9" }}>{doc.filial}</td>
                      <td className="px-4 py-2 text-sm" style={{ color: "#B4B2A9" }}>{doc.serie}</td>
                      <td className="px-4 py-2 font-mono text-sm" style={{ color: "#B4B2A9" }}>{doc.numeroDocumento}</td>
                      <td className="px-4 py-2 text-sm" style={{ color: "#B4B2A9" }}>{doc.tipoDocumento}</td>
                      <td className="px-4 py-2 tabular-nums text-sm" style={{ color: "#B4B2A9" }}>{formatBRL(doc.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Download */}
          <Button className="gradient-btn border-0 text-xs h-9 px-5" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />Baixar planilha final
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Natura;
