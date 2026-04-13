// (CÓDIGO GRANDE — FOCO 100% VISUAL PADRONIZADO)

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  CalendarIcon,
  Download,
  CheckCircle2,
  XCircle,
  FileCheck,
  Info,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { toast } from "@/hooks/use-toast";
import {
  processarMartinBrower,
  gerarPlanilhaFinal,
} from "@/lib/processors/martin-brower";

import type { ProcessingResult } from "@/lib/processors/types";
import { addRecord } from "@/lib/history";

import {
  SummaryCard,
  HighlightCard,
  SectionContainer,
  DataTable,
  StatusCard,
} from "@/components/dashboard";

const MartinBrower = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [dataRecebimento, setDataRecebimento] = useState<Date>();
  const [dataVencimento, setDataVencimento] = useState<Date>();
  const [valorBanco, setValorBanco] = useState("");
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const valorBancoNum = parseFloat(valorBanco.replace(",", ".")) || 0;
  const canProcess =
    file && dataRecebimento && dataVencimento && valorBancoNum > 0;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    toast({ title: "Planilha carregada", description: f.name });
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
        const statusConf =
          Math.abs(res.totalValorBruto - valorBancoNum) < 0.01
            ? "confere"
            : "diverge";

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
          title: "Nenhuma linha válida",
          description: "Nenhum documento encontrado.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro ao processar",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !dataRecebimento) return;

    const buffer = gerarPlanilhaFinal(result.documents, dataRecebimento);

    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `baixa_${format(dataRecebimento, "yyyy-MM-dd")}.xlsx`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1560px] px-6 py-7">

        {/* HEADER PADRONIZADO */}
        <div className="mb-8 rounded-[30px] border border-white/10 bg-[#11131c]/95 p-7">
          <div className="flex items-center gap-4">

            <button
              onClick={() => navigate("/dashboard")}
              className="h-11 w-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center hover:bg-violet-500/10 transition"
            >
              <ArrowLeft />
            </button>

            <div>
              <h1 className="text-2xl font-semibold text-white">
                Martin Brower
              </h1>
              <p className="text-sm text-white/60">
                Baixa por aviso bancário
              </p>
            </div>
          </div>
        </div>

        {/* UPLOAD */}
        <div className="rounded-[30px] border border-white/10 bg-[#11131c]/95 p-7 mb-6">
          <label
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border border-dashed border-violet-400/20 rounded-2xl p-16 text-center cursor-pointer hover:border-violet-400/50 transition block"
          >
            {file ? (
              <div className="flex items-center justify-center gap-4">
                <FileCheck className="text-violet-300" />
                <span className="text-white">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="mx-auto mb-4 text-violet-300" />
                <p className="text-white">Arraste ou clique para selecionar</p>
                <p className="text-sm text-white/40 mt-1">Formatos aceitos: .xlsx, .xls</p>
              </>
            )}

            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* PARAMETROS */}
        <div className="rounded-[30px] border border-white/10 bg-[#11131c]/95 p-7 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">

            {/* Data Recebimento */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Data Recebimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-white/10 bg-white/[0.03]",
                      !dataRecebimento && "text-white/40"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataRecebimento
                      ? format(dataRecebimento, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataRecebimento}
                    onSelect={setDataRecebimento}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Vencimento */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Data Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-white/10 bg-white/[0.03]",
                      !dataVencimento && "text-white/40"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataVencimento
                      ? format(dataVencimento, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataVencimento}
                    onSelect={setDataVencimento}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Valor Banco */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Valor Banco</Label>
              <Input
                placeholder="0,00"
                value={valorBanco}
                onChange={(e) => setValorBanco(e.target.value)}
                className="border-white/10 bg-white/[0.03]"
              />
            </div>

            <Button
              onClick={handleProcess}
              disabled={!canProcess || processing}
              className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white h-10"
            >
              {processing ? "Processando..." : "Processar"}
            </Button>
          </div>
        </div>

        {/* RESULTADO */}
        {result && (
          <>
            {/* Conferência banco */}
            <SectionContainer title="Conferência">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <HighlightCard
                  label="Total Planilha"
                  value={formatBRL(result.totalValorBruto)}
                  variant="default"
                />
                <HighlightCard
                  label="Valor Banco"
                  value={formatBRL(valorBancoNum)}
                  variant="default"
                />
                <HighlightCard
                  label="Diferença"
                  value={formatBRL(Math.abs(result.totalValorBruto - valorBancoNum))}
                  variant={Math.abs(result.totalValorBruto - valorBancoNum) < 0.01 ? "emerald" : "red"}
                />
              </div>

              <div className="mt-4">
                <StatusCard
                  label="Status da conferência"
                  value={Math.abs(result.totalValorBruto - valorBancoNum) < 0.01 ? "Confere" : "Diverge"}
                  icon={Math.abs(result.totalValorBruto - valorBancoNum) < 0.01 ? CheckCircle2 : XCircle}
                  variant={Math.abs(result.totalValorBruto - valorBancoNum) < 0.01 ? "success" : "danger"}
                />
              </div>
            </SectionContainer>

            {/* Indicadores de auditoria */}
            <SectionContainer title="Auditoria do Processamento">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Linhas lidas" value={String(result.totalLinhasLidas)} index={0} />
                <SummaryCard label="Filtradas por data" value={String(result.totalLinhasFiltradasData)} index={1} />
                <SummaryCard label="Pgto. vazio (mantidas)" value={String(result.totalLinhasPagamentoVazio)} index={2} />
                <SummaryCard label="Removidas por pgto." value={String(result.totalLinhasRemovidasPagamento)} index={3} />
                <SummaryCard label="Documentos válidos" value={String(result.totalLinhasValidas)} index={4} />
                <SummaryCard label="Com erro" value={String(result.totalLinhasComErro)} index={5} />
                <SummaryCard label="Ignoradas (subtotal)" value={String(result.totalLinhasIgnoradas)} index={6} />
                <SummaryCard label="Total documentos" value={String(result.totalDocumentos)} index={7} />
              </div>
            </SectionContainer>

            {/* Preview de validação */}
            {result.preview.length > 0 && (
              <SectionContainer title="Preview de Validação" subtitle="Primeiras 20 linhas processadas">
                <DataTable
                  columns={[
                    { key: "row", label: "Linha" },
                    { key: "dataVcto", label: "Data Vcto." },
                    { key: "dataPagamento", label: "Data Pagamento" },
                    { key: "faturaOriginal", label: "Nº Fatura" },
                    { key: "serie", label: "Série" },
                    { key: "numeroDocumento", label: "Nº Documento" },
                    { key: "valorBrutoConvertido", label: "Valor Bruto", render: (v) => v != null ? formatBRL(v as number) : "—" },
                    { key: "status", label: "Status", render: (v) => {
                      const s = v as string;
                      const color = s === "válida" ? "text-emerald-400" : s === "erro" ? "text-red-400" : "text-amber-400";
                      return <span className={color}>{s}</span>;
                    }},
                  ]}
                  data={result.preview}
                />
              </SectionContainer>
            )}

            {/* Erros */}
            {result.errors.length > 0 && (
              <SectionContainer title="Erros encontrados">
                <DataTable
                  columns={[
                    { key: "row", label: "Linha" },
                    { key: "fatura", label: "Nº Fatura" },
                    { key: "motivo", label: "Motivo" },
                  ]}
                  data={result.errors}
                />
              </SectionContainer>
            )}

            {/* Download */}
            {result.totalDocumentos > 0 && (
              <div className="flex justify-end">
                <Button
                  onClick={handleDownload}
                  className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar planilha final
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MartinBrower;