import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Download,
  FileCheck,
  FileSpreadsheet,
  BadgePercent,
} from "lucide-react";
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
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="mb-8"
        >
          <div className="rounded-[28px] border border-border/70 bg-card/60 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate("/dashboard")}
                  className="h-10 w-10 shrink-0 rounded-xl border-border/70 bg-background/60"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Cliente Platlog
                  </div>

                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Processamento de baixa
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Envie a planilha da Platlog, informe o desconto total recebido por e-mail
                    e gere a planilha final já preparada para a baixa.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[360px]">
                <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Entrada
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Planilha .xlsx ou .xls
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Regra
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Desconto aplicado do maior para o menor valor
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, duration: 0.3 }}
          className="mb-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]"
        >
          <div className="rounded-[28px] border border-border/70 bg-card/65 p-6 shadow-sm backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Planilha de entrada
                </h2>
                <p className="text-sm text-muted-foreground">
                  Arraste o arquivo ou clique para selecionar.
                </p>
              </div>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById("platlog-file-input")?.click()}
              className="group cursor-pointer rounded-[24px] border border-dashed border-border bg-background/40 px-6 py-14 text-center transition-all hover:border-primary/50 hover:bg-background/60"
            >
              {file ? (
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>

                  <div className="text-center sm:text-left">
                    <p className="text-base font-semibold text-foreground">
                      {file.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Arquivo carregado com sucesso. Clique para trocar.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/70 transition-all group-hover:bg-primary/10">
                    <Upload className="h-7 w-7 text-muted-foreground group-hover:text-primary" />
                  </div>

                  <p className="text-base font-semibold text-foreground">
                    Arraste ou clique para selecionar a planilha
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
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
          </div>

          <div className="rounded-[28px] border border-border/70 bg-card/65 p-6 shadow-sm backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BadgePercent className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Desconto total
                </h2>
                <p className="text-sm text-muted-foreground">
                  Valor informado por e-mail.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
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
                  className="h-11"
                />
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  O desconto será aplicado automaticamente no documento de maior valor.
                  Se ainda houver saldo de desconto, ele continua no próximo maior.
                </p>
              </div>

              <Button
                className="h-11 w-full"
                disabled={!file || processing}
                onClick={handleProcess}
              >
                {processing ? "Processando planilha..." : "Processar planilha"}
              </Button>
            </div>
          </div>
        </motion.div>

        {result && result.totalDocumentos > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <SectionContainer title="Resumo do processamento">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <Button className="h-10 px-5" onClick={handleDownload}>
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