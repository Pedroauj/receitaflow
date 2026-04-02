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
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border border-dashed border-violet-400/20 rounded-2xl p-16 text-center cursor-pointer hover:border-violet-400/50 transition"
          >
            {file ? (
              <div className="flex items-center justify-center gap-4">
                <FileCheck className="text-violet-300" />
                <span className="text-white">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="mx-auto mb-4 text-violet-300" />
                <p className="text-white">Arraste ou clique</p>
              </>
            )}

            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* PARAMETROS */}
        <div className="rounded-[30px] border border-white/10 bg-[#11131c]/95 p-7 mb-6">
          <div className="grid grid-cols-3 gap-4">

            <Input
              placeholder="Valor banco"
              value={valorBanco}
              onChange={(e) => setValorBanco(e.target.value)}
            />

            <Button
              onClick={handleProcess}
              disabled={!canProcess}
              className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white"
            >
              Processar
            </Button>
          </div>
        </div>

        {/* RESULTADO */}
        {result && (
          <SectionContainer title="Resultado">
            <SummaryCard
              label="Total"
              value={formatBRL(result.totalValorBruto)}
              index={0}
            />
          </SectionContainer>
        )}
      </div>
    </div>
  );
};

export default MartinBrower;