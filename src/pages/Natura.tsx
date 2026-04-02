import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Download,
  FileCheck,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { processarNatura, gerarPlanilhaNatura } from "@/lib/processors/natura";
import type { NaturaProcessingResult } from "@/lib/processors/natura";
import { addRecord } from "@/lib/history";
import { Badge } from "@/components/ui/badge";
import { SectionContainer, DataTable, StatusCard } from "@/components/dashboard";

const Natura = () => {
  const navigate = useNavigate();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [planilhaFile, setPlanilhaFile] = useState<File | null>(null);
  const [result, setResult] = useState<NaturaProcessingResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const handlePdfChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPdfFile(f);
      setResult(null);
      toast({ title: "PDF BOR carregado", description: f.name });
    }
  }, []);

  const handlePlanilhaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPlanilhaFile(f);
      setResult(null);
      toast({ title: "Planilha carregada", description: f.name });
    }
  }, []);

  const handleDrop = useCallback(
    (type: "pdf" | "planilha") => (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (!f) return;

      if (type === "pdf" && /\.pdf$/i.test(f.name)) {
        setPdfFile(f);
        setResult(null);
        toast({ title: "PDF BOR carregado", description: f.name });
      } else if (type === "planilha" && /\.(xlsx?|csv)$/i.test(f.name)) {
        setPlanilhaFile(f);
        setResult(null);
        toast({ title: "Planilha carregada", description: f.name });
      }
    },
    []
  );

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
        toast({
          title: "Nenhum compromisso encontrado",
          description: "Não foi possível localizar a seção COMPROMISSOS no PDF.",
          variant: "destructive",
        });
      } else {
        const alertas: string[] = [];
        if (res.totalNaoEncontrados > 0) alertas.push(`${res.totalNaoEncontrados} não encontrado(s)`);
        if (res.totalSemValor > 0) alertas.push(`${res.totalSemValor} sem valor`);

        toast({
          title: "Processamento concluído",
          description: `${res.totalEncontrados} encontrado(s)${
            alertas.length ? ` · ${alertas.join(" · ")}` : ""
          }`,
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
      toast({
        title: "Erro ao processar",
        description: "Verifique os arquivos e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const buffer = gerarPlanilhaNatura(result.registros);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `importacao_natura_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Planilha gerada", description: a.download });
  };

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusIcon = (status: string) => {
    if (status === "encontrado") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    if (status === "não encontrado") return <XCircle className="h-3.5 w-3.5 text-red-400" />;
    return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />;
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      encontrado: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
      "não encontrado": "bg-red-500/10 text-red-300 border-red-500/20",
      "sem valor": "bg-amber-500/10 text-amber-300 border-amber-500/20",
    };

    return (
      <Badge
        variant="outline"
        className={`gap-1 border text-[10px] font-medium ${styles[status] ?? "border-white/10 bg-white/5 text-white/70"}`}
      >
        {statusIcon(status)}
        {status}
      </Badge>
    );
  };

  const UploadArea = ({
    id,
    file,
    title,
    description,
    accept,
    onChange,
    onDrop,
    icon: Icon,
  }: {
    id: string;
    file: File | null;
    title: string;
    description: string;
    accept: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDrop: (e: React.DragEvent) => void;
    icon: any;
  }) => (
    <label
      className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#11131c]/95 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] cursor-pointer"
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.dataset.dragover = "true";
      }}
      onDragLeave={(e) => {
        e.currentTarget.dataset.dragover = "false";
      }}
      onDrop={(e) => {
        e.currentTarget.dataset.dragover = "false";
        onDrop(e);
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.10),transparent_24%)]" />

      <div className="relative">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <p className="text-sm text-white/55">{description}</p>
          </div>
        </div>

        <div className="rounded-[26px] border border-dashed border-violet-400/20 bg-[linear-gradient(180deg,rgba(139,92,246,0.06),rgba(255,255,255,0.02))] px-6 py-14 text-center transition-all duration-200 hover:border-violet-400/45 hover:bg-[linear-gradient(180deg,rgba(139,92,246,0.12),rgba(255,255,255,0.03))]">
          {file ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-violet-400/25 bg-violet-500/12">
                <FileCheck className="h-7 w-7 text-violet-200" />
              </div>

              <div>
                <p className="text-lg font-semibold text-white">{file.name}</p>
                <p className="mt-1 text-sm text-white/55">
                  Arquivo carregado com sucesso. Clique para trocar.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] border border-violet-400/20 bg-violet-500/10">
                <Icon className="h-8 w-8 text-violet-200" />
              </div>

              <p className="text-xl font-semibold text-white">{title}</p>
              <p className="mt-3 text-sm text-white/50">{description}</p>
            </>
          )}
        </div>

        <input id={id} type="file" accept={accept} className="hidden" onChange={onChange} />
      </div>
    </label>
  );

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1560px] px-6 py-7">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="mb-8"
        >
          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#11131c]/95 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.14),transparent_28%)]" />

            <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/80 transition-all duration-200 hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200">
                    <FileText className="h-3.5 w-3.5" />
                    Cliente Natura
                  </div>

                  <h1 className="text-[32px] font-semibold leading-none tracking-tight text-white">
                    Cruzamento BOR × Planilha
                  </h1>

                  <p className="mt-3 max-w-3xl text-[15px] leading-7 text-white/60">
                    Envie o PDF BOR e a planilha do sistema para cruzar faturas, localizar documentos,
                    validar valores e gerar a planilha final de importação com o mesmo padrão visual do sistema.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[420px]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/80">
                    Entrada
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    PDF BOR + planilha do sistema
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/80">
                    Saída
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-white">
                    Planilha de importação e status do cruzamento
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
          className="mb-6 grid gap-6 xl:grid-cols-[1fr_1fr]"
        >
          <UploadArea
            id="natura-pdf-input"
            file={pdfFile}
            title="PDF BOR"
            description="Borderô de antecipação em PDF"
            accept=".pdf"
            onChange={handlePdfChange}
            onDrop={handleDrop("pdf")}
            icon={Upload}
          />

          <UploadArea
            id="natura-planilha-input"
            file={planilhaFile}
            title="Planilha do sistema"
            description="Contas a receber (.xlsx, .xls, .csv)"
            accept=".xlsx,.xls,.csv"
            onChange={handlePlanilhaChange}
            onDrop={handleDrop("planilha")}
            icon={FileSpreadsheet}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.3 }}
          className="mb-6"
        >
          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#11131c]/95 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.10),transparent_24%)]" />

            <div className="relative p-6 lg:p-7">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
                  <Download className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Processamento
                  </h2>
                  <p className="text-sm text-white/55">
                    O sistema cruza os arquivos e prepara a planilha final para importação.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-violet-400/15 bg-violet-500/[0.06] p-4">
                <p className="text-sm leading-7 text-white/62">
                  O BOR é lido para localizar os compromissos, a planilha do sistema é usada para encontrar
                  os documentos e o resultado final é consolidado com status de encontrado, não encontrado
                  ou sem valor.
                </p>
              </div>

              <div className="mt-6 flex justify-start">
                <Button
                  className="h-12 border-0 bg-[linear-gradient(135deg,#7c3aed_0%,#8b5cf6_55%,#6366f1_100%)] px-5 text-white shadow-[0_10px_30px_rgba(124,58,237,0.35)] transition-all duration-200 hover:opacity-95"
                  disabled={!pdfFile || !planilhaFile || processing}
                  onClick={handleProcess}
                >
                  {processing ? "Processando..." : "Processar arquivos"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#11131c]/95 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.10),transparent_24%)]" />

              <div className="relative p-6 sm:p-7">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                      Resultado do cruzamento
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                      Visão geral do processamento
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                      Resumo executivo da leitura do BOR e do cruzamento com a planilha do sistema.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Documentos no BOR
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      {result.documentosBOR.length}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/8 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Encontrados
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-300">
                      {result.totalEncontrados}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-red-500/15 bg-red-500/8 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Não encontrados
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-red-300">
                      {result.totalNaoEncontrados}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-violet-500/15 bg-violet-500/8 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Valor total
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-violet-200">
                      {formatBRL(result.totalValor)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {result.totalNaoEncontrados > 0 && (
              <StatusCard
                icon={XCircle}
                title={`${result.totalNaoEncontrados} documento(s) do BOR não encontrado(s) na planilha do sistema.`}
                variant="error"
              />
            )}

            {result.totalSemValor > 0 && (
              <StatusCard
                icon={AlertTriangle}
                title={`${result.totalSemValor} documento(s) encontrado(s) sem valor na planilha.`}
                variant="warning"
              />
            )}

            <DataTable
              title="Detalhamento por Fatura"
              badge={`${result.blocos.length} fatura(s)`}
              columns={[
                {
                  key: "fatura",
                  label: "Fatura (BOR)",
                  width: "150px",
                  render: (row: any) => <span className="font-mono">{row.fatura}</span>,
                },
                {
                  key: "documentos",
                  label: "Documentos encontrados",
                  width: "1fr",
                  render: (row: any) => (row.documentos.length > 0 ? row.documentos.join(", ") : "—"),
                },
                {
                  key: "valor",
                  label: "Valor total",
                  width: "140px",
                  render: (row: any) => (row.status === "encontrado" ? formatBRL(row.valor) : "—"),
                },
                {
                  key: "status",
                  label: "Status",
                  width: "140px",
                  render: (row: any) => statusBadge(row.status),
                },
              ]}
              data={result.blocos}
              keyExtractor={(_: any, i) => String(i)}
            />

            {result.totalEncontrados > 0 && (
              <div className="flex justify-start">
                <Button
                  className="h-11 border-0 bg-[linear-gradient(135deg,#7c3aed_0%,#8b5cf6_55%,#6366f1_100%)] px-5 text-white shadow-[0_10px_30px_rgba(124,58,237,0.28)] hover:opacity-95"
                  onClick={handleDownload}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar planilha de importação
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Natura;