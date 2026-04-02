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

const Platlog = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [result, setResult] = useState<PlatlogProcessingResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
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

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
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
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1560px] px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="h-9 w-9 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Platlog
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Baixa por planilha com desconto manual.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="mb-5 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-sm"
        >
          <p className="mb-4 text-sm font-medium text-foreground">
            Planilha de entrada
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById("platlog-file-input")?.click()}
            className="cursor-pointer rounded-2xl border border-dashed border-border bg-background/40 p-10 text-center transition-colors hover:border-primary/50"
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <FileCheck className="h-5 w-5 text-primary" />
                </div>

                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Clique para trocar o arquivo
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>

                <p className="mb-1 text-sm font-medium text-foreground">
                  Arraste ou clique para selecionar a planilha
                </p>
                <p className="text-xs text-muted-foreground">
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
            <label className="mb-2 block text-sm font-medium text-foreground">
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

            <p className="mt-2 text-xs text-muted-foreground">
              O desconto será aplicado automaticamente no documento de maior valor.
              Se sobrar desconto, ele continua no próximo maior.
            </p>
          </div>

          <Button
            className="mt-6"
            disabled={!file || processing}
            onClick={handleProcess}
          >
            {processing ? "Processando..." : "Processar planilha"}
          </Button>
        </motion.div>

        {result && result.totalDocumentos > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <SectionContainer title="Resultado do processamento">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  label="Total de documentos"
                  value={result.totalDocumentos}
                  index={0}
                />
                <SummaryCard
                  label="Valor original"
                  value={formatBRL(result.totalValorOriginal)}
                  index={1}
                />
                <SummaryCard
                  label="Total de descontos"
                  value={formatBRL(result.totalDescontos)}
                  index={2}
                />
                <SummaryCard
                  label="Valor final"
                  value={formatBRL(result.totalValorFinal)}
                  index={3}
                />
              </div>
            </SectionContainer>

            <DataTable
              title="Prévia da planilha final"
              badge={`${result.documents.length} documento(s)`}
              columns={[
                { key: "filial", label: "Filial", width: "80px" },
                { key: "serie", label: "Série", width: "80px" },
                {
                  key: "numeroDocumento",
                  label: "Nº Documento",
                  width: "150px",
                  render: (row: any) => (
                    <span className="font-mono">{row.numeroDocumento}</span>
                  ),
                },
                { key: "tipoDocumento", label: "Tipo", width: "100px" },
                {
                  key: "valorOriginal",
                  label: "Valor original",
                  width: "140px",
                  render: (row: any) => formatBRL(row.valorOriginal),
                },
                {
                  key: "descontoAplicado",
                  label: "Desconto",
                  width: "140px",
                  render: (row: any) => formatBRL(row.descontoAplicado),
                },
                {
                  key: "valorFinal",
                  label: "Saldo devedor",
                  width: "140px",
                  className: "font-semibold",
                  render: (row: any) => formatBRL(row.valorFinal),
                },
              ]}
              data={result.documents}
              keyExtractor={(row: any, i) =>
                `${row.numeroDocumento}_${row.serie}_${i}`
              }
            />

            {result.descontosAplicados.length > 0 && (
              <DataTable
                title="Documentos que receberam desconto"
                badge={`${result.descontosAplicados.length} desconto(s)`}
                columns={[
                  {
                    key: "documentoAlvo",
                    label: "Documento",
                    width: "150px",
                    render: (row: any) => (
                      <span className="font-mono">{row.documentoAlvo}</span>
                    ),
                  },
                  { key: "serieAlvo", label: "Série", width: "80px" },
                  {
                    key: "tipoDocumentoAlvo",
                    label: "Tipo",
                    width: "100px",
                  },
                  {
                    key: "valorDescontoAplicado",
                    label: "Valor descontado",
                    width: "140px",
                    render: (row: any) => formatBRL(row.valorDescontoAplicado),
                  },
                  {
                    key: "saldoRestante",
                    label: "Saldo restante",
                    width: "140px",
                    className: "font-semibold",
                    render: (row: any) => formatBRL(row.saldoRestante),
                  },
                ]}
                data={result.descontosAplicados}
                keyExtractor={(row: any, i) => `${row.documentoAlvo}_${i}`}
              />
            )}

            <div className="flex justify-start">
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Baixar planilha final
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Platlog;