import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Download, FileCheck } from "lucide-react";
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
import { SummaryCard, DataTable } from "@/components/dashboard";
import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/ui/layout";

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
          description: "Não foi possível extrair dados válidos.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Processado com sucesso",
          description: `${res.totalDocumentos} documento(s).`,
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
      const description =
        error instanceof Error
          ? error.message
          : "Erro ao processar planilha.";

      toast({
        title: "Erro",
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
    a.download = `platlog_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();

    URL.revokeObjectURL(url);

    toast({
      title: "Arquivo gerado",
      description: a.download,
    });
  };

  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <PageContainer>
      <PageHeader
        title="Platlog"
        description="Baixa por planilha com desconto manual"
        right={
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            Voltar
          </Button>
        }
      />

      <SectionCard>
        <p className="text-sm font-medium mb-4">Planilha de entrada</p>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById("platlog-file-input")?.click()}
          className="rounded-xl border border-dashed border-border p-10 text-center cursor-pointer hover:border-primary transition"
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>

              <div className="text-left">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  Clique para trocar
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>

              <p className="text-sm font-medium">
                Arraste ou selecione a planilha
              </p>
              <p className="text-xs text-muted-foreground">
                .xlsx ou .xls
              </p>
            </>
          )}

          <input
            id="platlog-file-input"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium">
            Desconto total
          </label>

          <Input
            value={discountInput}
            onChange={(e) => {
              setDiscountInput(e.target.value);
              setResult(null);
            }}
            placeholder="Ex: 1.250,50"
            className="mt-2"
          />

          <p className="text-xs text-muted-foreground mt-2">
            Aplicado automaticamente nos maiores valores.
          </p>
        </div>

        <Button
          className="mt-6"
          disabled={!file || processing}
          onClick={handleProcess}
        >
          {processing ? "Processando..." : "Processar"}
        </Button>
      </SectionCard>

      {result && result.totalDocumentos > 0 && (
        <div className="space-y-5 mt-5">
          <SectionCard>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Docs" value={result.totalDocumentos} index={0} />
              <SummaryCard label="Original" value={formatBRL(result.totalValorOriginal)} index={1} />
              <SummaryCard label="Descontos" value={formatBRL(result.totalDescontos)} index={2} />
              <SummaryCard label="Final" value={formatBRL(result.totalValorFinal)} index={3} />
            </div>
          </SectionCard>

          <DataTable
            title="Prévia"
            badge={`${result.documents.length}`}
            columns={[
              { key: "filial", label: "Filial" },
              { key: "serie", label: "Série" },
              { key: "numeroDocumento", label: "Documento" },
              { key: "tipoDocumento", label: "Tipo" },
              { key: "valorOriginal", label: "Original", render: (r: any) => formatBRL(r.valorOriginal) },
              { key: "descontoAplicado", label: "Desconto", render: (r: any) => formatBRL(r.descontoAplicado) },
              { key: "valorFinal", label: "Final", render: (r: any) => formatBRL(r.valorFinal) },
            ]}
            data={result.documents}
            keyExtractor={(row: any, i) => `${row.numeroDocumento}_${i}`}
          />

          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Baixar
          </Button>
        </div>
      )}
    </PageContainer>
  );
};

export default Platlog;