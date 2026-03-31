import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, FileCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  processarPlatlog,
  gerarPlanilhaPlatlog,
  type PlatlogProcessingResult,
} from "@/lib/processors/platlog";
import { addRecord } from "@/lib/history";
import { SummaryCard, SectionContainer, DataTable } from "@/components/dashboard";
import type { DataTableColumn } from "@/components/dashboard";

const Platlog = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [result, setResult] = useState<PlatlogProcessingResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setResult(null);

    toast({
      title: "Planilha carregada",
      description: selected.name,
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    const selected = e.dataTransfer.files?.[0];
    if (!selected) return;

    const isSpreadsheet = /\.(xlsx|xls)$/i.test(selected.name);
    if (!isSpreadsheet) {
      toast({
        title: "Arquivo inválido",
        description: "Envie uma planilha .xlsx ou .xls.",
        variant: "destructive",
      });
      return;
    }

    setFile(selected);
    setResult(null);

    toast({
      title: "Planilha carregada",
      description: selected.name,
    });
  }, []);

  const parseDiscountValue = (value: string): number => {
    if (!value.trim()) return 0;

    const cleaned = value
      .replace(/[R$\s]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    const parsed = Number.parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : Math.abs(parsed);
  };

  const handleProcess = async () => {
    if (!file) return;

    setProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const descontoTotal = parseDiscountValue(discountInput);

      const res = await processarPlatlog(
        {
          fileName: file.name,
          buffer,
        },
        descontoTotal
      );

      setResult(res);

      if (res.totalDocumentos === 0) {
        toast({
          title: "Nenhum documento encontrado",
          description: "Não foi possível extrair dados válidos da planilha da Platlog.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Planilha processada com sucesso",
          description: `${res.totalDocumentos} documento(s) gerado(s).`,
        });

        addRecord({
          cliente: "Platlog",
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
    } catch (error) {
      console.error(error);

      const description =
        error instanceof Error
          ? error.message
          : "Não foi possível processar a planilha da Platlog.";

      toast({
        title: "Erro ao processar",
        description,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const buffer = gerarPlanilhaPlatlog(result);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `baixa_platlog_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
            Platlog
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#888780" }}>
            Baixa por planilha com desconto manual
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
          Planilha de entrada
        </p>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="rounded-xl p-10 text-center cursor-pointer transition-all"
          style={{ border: "1px dashed #2C2C2A" }}
          onClick={() => document.getElementById("platlog-file-input")?.click()}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#633806")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2C2C2A")}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ background: "#412402" }}
              >
                <FileCheck className="h-5 w-5" style={{ color: "#EF9F27" }} />
              </div>

              <div className="text-left">
                <p className="text-sm font-medium" style={{ color: "#F5F5F0" }}>
                  {file.name}
                </p>
                <p className="text-xs" style={{ color: "#5F5E5A" }}>
                  Clique para trocar o arquivo
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
                Arraste ou clique para selecionar a planilha
              </p>
              <p className="text-xs" style={{ color: "#5F5E5A" }}>
                Formatos aceitos: .xlsx e .xls
              </p>
            </>
          )}

          <input
            id="platlog-file-input"
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium mb-2" style={{ color: "#F5F5F0" }}>
            Desconto total informado por e-mail
          </label>

          <Input
            value={discountInput}
            onChange={(e) => {
              setDiscountInput(e.target.value);
              setResult(null);
            }}
            placeholder="Ex.: 1.250,50"
            className="h-10"
          />

          <p className="text-xs mt-2" style={{ color: "#5F5E5A" }}>
            O desconto será aplicado automaticamente no documento de maior valor. Se sobrar desconto,
            ele continua no próximo maior.
          </p>
        </div>

        <Button
          className="mt-6 gradient-btn border-0 text-xs h-9 px-5"
          disabled={!file || processing}
          onClick={handleProcess}
        >
          {processing ? "Processando..." : "Processar planilha"}
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
              <SummaryCard label="Total de documentos" value={result.totalDocumentos} index={0} />
              <SummaryCard label="Valor original" value={formatBRL(result.totalValorOriginal)} index={1} />
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
              { key: "valorFinal", label: "Saldo devedor", width: "140px", className: "font-semibold", render: (row: any) => formatBRL(row.valorFinal) },
            ]}
            data={result.documents}
            keyExtractor={(row: any, i) => `${row.numeroDocumento}_${row.serie}_${i}`}
          />

          {result.descontosAplicados.length > 0 && (
            <DataTable
              title="Documentos que receberam desconto"
              badge={`${result.descontosAplicados.length} desconto(s)`}
              columns={[
                { key: "documentoAlvo", label: "Documento", width: "150px", render: (row: any) => <span className="font-mono">{row.documentoAlvo}</span> },
                { key: "serieAlvo", label: "Série", width: "80px" },
                { key: "tipoDocumentoAlvo", label: "Tipo", width: "100px" },
                { key: "valorDescontoAplicado", label: "Valor descontado", width: "140px", render: (row: any) => formatBRL(row.valorDescontoAplicado) },
                { key: "saldoRestante", label: "Saldo restante", width: "140px", className: "font-semibold", render: (row: any) => formatBRL(row.saldoRestante) },
              ]}
              data={result.descontosAplicados}
              keyExtractor={(row: any, i) => `${row.documentoAlvo}_${i}`}
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

export default Platlog;