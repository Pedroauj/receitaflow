import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, FileCheck, Files } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  processarDanone,
  gerarPlanilhaDanone,
  type DanoneInputFile,
  type DanoneProcessingResult,
} from "@/lib/processors/danone";
import { addRecord } from "@/lib/history";
import { SummaryCard, SectionContainer, DataTable } from "@/components/dashboard";
import type { DataTableColumn } from "@/components/dashboard";

const Danone = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<DanoneProcessingResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const mergeFiles = useCallback((incoming: File[]) => {
    const pdfs = incoming.filter((file) => /\.pdf$/i.test(file.name));

    setFiles((prev) => {
      const map = new Map<string, File>();

      [...prev, ...pdfs].forEach((file) => {
        map.set(`${file.name}_${file.size}_${file.lastModified}`, file);
      });

      return Array.from(map.values());
    });

    setResult(null);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const incoming = Array.from(e.target.files ?? []);
      if (incoming.length === 0) return;

      mergeFiles(incoming);

      toast({
        title: "PDFs carregados",
        description: `${incoming.length} arquivo(s) adicionado(s).`,
      });

      e.target.value = "";
    },
    [mergeFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const incoming = Array.from(e.dataTransfer.files ?? []);
      if (incoming.length === 0) return;

      mergeFiles(incoming);

      toast({
        title: "PDFs carregados",
        description: `${incoming.length} arquivo(s) adicionado(s).`,
      });
    },
    [mergeFiles]
  );

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);

    try {
      const inputFiles: DanoneInputFile[] = await Promise.all(
        files.map(async (file) => ({
          fileName: file.name,
          buffer: await file.arrayBuffer(),
        }))
      );

      const res = await processarDanone(inputFiles);
      setResult(res);

      if (res.totalDocumentos === 0) {
        toast({
          title: "Nenhum documento encontrado",
          description: "Não foi possível extrair dados válidos dos PDFs da Danone.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "PDFs processados com sucesso",
          description: `${res.totalDocumentos} documento(s) gerado(s) em ${res.arquivosProcessados} arquivo(s).`,
        });

        addRecord({
          cliente: "Danone",
          dataProcessamento: new Date().toISOString(),
          dataVencimento: new Date().toISOString(),
          dataRecebimento: new Date().toISOString(),
          quantidadeDocumentos: res.totalDocumentos,
          valorTotal: res.totalValorFinal,
          valorInformadoBanco: 0,
          statusConferencia: "confere",
          quantidadeErros: 0,
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao processar",
        description: "Não foi possível ler os PDFs da Danone. Verifique os arquivos enviados.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const buffer = gerarPlanilhaDanone(result);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `baixa_danone_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();

    URL.revokeObjectURL(url);

    toast({
      title: "Arquivo gerado com sucesso",
      description: a.download,
    });
  };

  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <div className="p-7">
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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#412402";
            e.currentTarget.style.color = "#FAC775";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1E1E20";
            e.currentTarget.style.color = "#888780";
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>
            Danone
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#888780" }}>
            Baixa por aviso de pagamento — múltiplos PDFs
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="card-elevated p-5 mb-5"
      >
        <p className="text-sm font-semibold mb-4" style={{ color: "#F5F5F0" }}>
          PDFs de entrada
        </p>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="rounded-xl p-10 text-center cursor-pointer transition-all"
          style={{ border: "1px dashed #2C2C2A" }}
          onClick={() => document.getElementById("danone-file-input")?.click()}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#633806")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2C2C2A")}
        >
          {files.length > 0 ? (
            <div className="flex items-center justify-center gap-3">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ background: "#412402" }}
              >
                <Files className="h-5 w-5" style={{ color: "#EF9F27" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium" style={{ color: "#F5F5F0" }}>
                  {files.length} arquivo(s) selecionado(s)
                </p>
                <p className="text-xs" style={{ color: "#5F5E5A" }}>
                  Clique para adicionar mais PDFs
                </p>
              </div>
            </div>
          ) : (
            <>
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "#1E1E20" }}
              >
                <Upload className="h-6 w-6" style={{ color: "#888780" }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "#F5F5F0" }}>
                Arraste ou clique para selecionar vários PDFs
              </p>
              <p className="text-xs" style={{ color: "#5F5E5A" }}>
                Formato aceito: .pdf
              </p>
            </>
          )}

          <input
            id="danone-file-input"
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-5 rounded-lg p-4" style={{ background: "#18181A", border: "0.5px solid #2C2C2A" }}>
            <p className="text-sm font-medium mb-3" style={{ color: "#F5F5F0" }}>
              Arquivos carregados
            </p>

            <div className="space-y-2 max-h-64 overflow-auto">
              {files.map((file, index) => (
                <div
                  key={`${file.name}_${file.size}_${file.lastModified}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ background: "#121214", border: "0.5px solid #2C2C2A" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileCheck className="h-4 w-4 shrink-0" style={{ color: "#EF9F27" }} />
                    <p
                      className="text-sm truncate"
                      style={{ color: "#B4B2A9" }}
                      title={file.name}
                    >
                      {file.name}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-xs px-2 py-1 rounded-md transition-colors"
                    style={{ color: "#888780", background: "#1E1E20" }}
                  >
                    remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          className="mt-6 gradient-btn border-0 text-xs h-9 px-5"
          disabled={files.length === 0 || processing}
          onClick={handleProcess}
        >
          {processing ? "Processando..." : "Processar PDFs"}
        </Button>
      </motion.div>

      {result && result.totalDocumentos > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-5"
        >
          <SectionContainer title="Resultado do processamento">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard label="Arquivos processados" value={result.arquivosProcessados} index={0} />
              <SummaryCard label="Total de documentos" value={result.totalDocumentos} index={1} />
              <SummaryCard label="Total de descontos" value={formatBRL(result.totalDescontos)} index={2} />
              <SummaryCard label="Valor final" value={formatBRL(result.totalValorFinal)} index={3} />
            </div>
          </SectionContainer>

          <DataTable
            title="Prévia da planilha final"
            badge={`${result.documents.length} documento(s)`}
            columns={[
              { key: "filial", label: "Filial", width: "80px" },
              { key: "serie", label: "Série", width: "80px" },
              { key: "numeroDocumento", label: "Nº Documento", width: "150px", render: (row: any) => <span className="font-mono">{row.numeroDocumento}</span> },
              { key: "tipoDocumento", label: "Tipo", width: "100px" },
              { key: "valorOriginal", label: "Valor original", width: "140px", render: (row: any) => formatBRL(row.valorOriginal) },
              { key: "descontoAplicado", label: "Desconto", width: "140px", render: (row: any) => formatBRL(row.descontoAplicado) },
              { key: "valorFinal", label: "Valor final", width: "140px", className: "font-semibold", render: (row: any) => formatBRL(row.valorFinal) },
            ]}
            data={result.documents}
            keyExtractor={(row: any, i) => `${row.numeroDocumento}_${row.serie}_${i}`}
          />

          {result.descontosAplicados.length > 0 && (
            <DataTable
              title="Conferência dos descontos aplicados"
              badge={`${result.descontosAplicados.length} desconto(s)`}
              columns={[
                { key: "arquivoOrigem", label: "Arquivo", width: "1fr" },
                { key: "referenciaOrigem", label: "Referência do desconto", width: "1fr" },
                { key: "documentoAlvo", label: "Documento alvo", width: "140px", render: (row: any) => <span className="font-mono">{row.documentoAlvo}</span> },
                { key: "serieAlvo", label: "Série", width: "80px" },
                { key: "valorDesconto", label: "Valor descontado", width: "140px", render: (row: any) => formatBRL(row.valorDesconto) },
                { key: "saldoRestante", label: "Saldo restante", width: "140px", className: "font-semibold", render: (row: any) => formatBRL(row.saldoRestante) },
              ]}
              data={result.descontosAplicados}
              keyExtractor={(row: any, i) => `${row.referenciaOrigem}_${i}`}
            />
          )}

          <Button className="gradient-btn border-0 text-xs h-9 px-5" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Baixar planilha final
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Danone;