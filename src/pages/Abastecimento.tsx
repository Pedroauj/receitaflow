import JSZip from "jszip";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  FileCheck,
  FileX,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCode,
  Car,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/dashboard/PageHeader";
import { AccentButton } from "@/components/client";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface NotaItem {
  id: string;
  nNF: string;
  fileName: string;
  rawContent: string;
  placa: string;
  temPlaca: boolean;
  posto: string;
}

// ─── Helpers XML ─────────────────────────────────────────────────────────────

function extrairNNF(xml: string): string {
  const match = xml.match(/<nNF>(\d+)<\/nNF>/);
  return match ? match[1] : "—";
}

function extrairPosto(xml: string): string {
  const match = xml.match(/<emit>[\s\S]*?<xNome>([\s\S]*?)<\/xNome>/i);
  return match ? match[1].trim() : "—";
}

function temPlacaNoXML(xml: string): boolean {
  const infCplMatch = xml.match(/<infCpl>([\s\S]*?)<\/infCpl>/i);
  if (!infCplMatch) return false;
  return /placa\s*:/i.test(infCplMatch[1]);
}

function inserirPlacaNoXML(xml: string, valor: string): string {
  const texto = valor.trim();

  // Caso 1: <infCpl> existe — insere no início do conteúdo
  if (/<infCpl>/i.test(xml)) {
    return xml.replace(
      /<infCpl>([\s\S]*?)<\/infCpl>/i,
      (_, conteudo) => `<infCpl>${texto} ${conteudo.trim()}</infCpl>`
    );
  }

  // Caso 2: <infAdic> existe mas sem <infCpl> — cria dentro
  if (/<infAdic>/i.test(xml)) {
    return xml.replace(
      /<infAdic>/i,
      `<infAdic><infCpl>${texto}</infCpl>`
    );
  }

  // Caso 3: nem <infAdic> existe — cria antes de </infNFe>
  return xml.replace(
    /<\/infNFe>/i,
    `<infAdic><infCpl>${texto}</infCpl></infAdic></infNFe>`
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

const Abastecimento = () => {
  const [notas, setNotas] = useState<NotaItem[]>([]);
  const [processando, setProcessando] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lê e parseia os arquivos XML
  const processarArquivos = useCallback(async (files: FileList | File[]) => {
    const lista = Array.from(files).filter((f) =>
      f.name.toLowerCase().endsWith(".xml")
    );

    if (lista.length === 0) {
      toast({ title: "Nenhum XML encontrado", variant: "destructive" });
      return;
    }

    setProcessando(true);

    const novas: NotaItem[] = [];

    for (const file of lista) {
      const raw = await file.text();
      const nNF = extrairNNF(raw);
      const temPlaca = temPlacaNoXML(raw);
      const posto = extrairPosto(raw);

      novas.push({
        id: `${file.name}_${nNF}`,
        nNF,
        fileName: file.name,
        rawContent: raw,
        placa: "",
        temPlaca,
        posto,
      });
    }

    // Merge: mantém placas já preenchidas para arquivos re-importados
    setNotas((prev) => {
      const mapa = new Map(prev.map((n) => [n.id, n]));
      return novas.map((n) => ({
        ...n,
        placa: mapa.get(n.id)?.placa ?? n.placa,
      }));
    });

    setProcessando(false);
    toast({
      title: `${novas.length} XML${novas.length > 1 ? "s" : ""} carregado${novas.length > 1 ? "s" : ""}`,
      description: `${novas.filter((n) => !n.temPlaca).length} sem placa identificados.`,
    });
  }, []);

  // Drag & drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      processarArquivos(e.dataTransfer.files);
    },
    [processarArquivos]
  );

  // Atualiza placa de uma nota
  const atualizarPlaca = (id: string, placa: string) => {
    setNotas((prev) =>
      prev.map((n) => (n.id === id ? { ...n, placa } : n))
    );
  };

  // Remove uma nota da lista
  const removerNota = (id: string) => {
    setNotas((prev) => prev.filter((n) => n.id !== id));
  };

  // Gera e baixa os XMLs corrigidos
  const confirmar = async () => {
    const semPlaca = notas.filter((n) => !n.temPlaca && !n.placa.trim());
    if (semPlaca.length > 0) {
      toast({
        title: "Conteúdo não preenchido",
        description: `${semPlaca.length} nota(s) sem conteúdo informado.`,
        variant: "destructive",
      });
      return;
    }

    const zip = new JSZip();

    for (const nota of notas) {
      const xmlFinal = nota.placa.trim()
        ? inserirPlacaNoXML(nota.rawContent, nota.placa)
        : nota.rawContent;

      // Garante extensão .xml no nome do arquivo
      const nomeArquivo = nota.fileName.toLowerCase().endsWith(".xml")
        ? nota.fileName
        : `${nota.fileName}.xml`;

      zip.file(nomeArquivo, xmlFinal);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xmls-corrigidos-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: `${notas.length} XML${notas.length > 1 ? "s" : ""} exportado${notas.length > 1 ? "s" : ""}`,
      description: "Arquivo ZIP gerado com todos os XMLs corrigidos.",
    });
  };

  const semPlacaCount = notas.filter((n) => !n.temPlaca && !n.placa.trim()).length;
  const prontoParaConfirmar = notas.length > 0 && semPlacaCount === 0;

  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1560px] px-6 py-7">
        <PageHeader
          badgeIcon={Fuel}
          badgeLabel="Abastecimento"
          title="Correção de XML sem Placa"
          description="Importe os XMLs de notas de abastecimento que estão com erro por falta de placa. Informe a placa de cada nota e gere os arquivos corrigidos com um clique."
        />

        {/* ── Upload ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative cursor-pointer rounded-[24px] border-2 border-dashed p-10 text-center transition-all duration-300 ${
              dragOver
                ? "border-violet-500/60 bg-violet-500/8"
                : "border-white/10 bg-[linear-gradient(180deg,rgba(16,20,32,0.98),rgba(10,13,22,0.98))] hover:border-violet-500/30 hover:bg-violet-500/5"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xml"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && processarArquivos(e.target.files)}
            />

            <div className="flex flex-col items-center gap-3">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-colors duration-300 ${
                dragOver
                  ? "border-violet-500/40 bg-violet-500/20 text-violet-300"
                  : "border-white/10 bg-white/[0.04] text-slate-400"
              }`}>
                <FileCode className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {dragOver ? "Solte os arquivos aqui" : "Arraste os XMLs ou clique para selecionar"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Múltiplos arquivos .xml aceitos
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Lista de notas ── */}
        <AnimatePresence>
          {notas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Header da lista */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-white">
                    {notas.length} nota{notas.length > 1 ? "s" : ""} carregada{notas.length > 1 ? "s" : ""}
                  </p>
                  {semPlacaCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                      <AlertTriangle className="h-3 w-3" />
                      {semPlacaCount} sem placa
                    </span>
                  )}
                  {semPlacaCount === 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Todas prontas
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setNotas([])}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Limpar tudo
                </button>
              </div>

              {/* Tabela */}
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,20,32,0.98),rgba(10,13,22,0.98))] shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                {/* Cabeçalho */}
                <div className="grid grid-cols-[1fr_1.4fr_1.6fr_1.5fr_40px] items-center border-b border-white/8 bg-white/[0.02] px-5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Nº Nota</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Posto</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Arquivo</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Conteúdo infCpl</p>
                  <div />
                </div>

                {/* Linhas */}
                <div className="divide-y divide-white/[0.05]">
                  <AnimatePresence>
                    {notas.map((nota, idx) => (
                      <motion.div
                        key={nota.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        className="grid grid-cols-[1fr_1.4fr_1.6fr_1.5fr_40px] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                      >
                        {/* Nº Nota */}
                        <div className="flex items-center gap-2.5">
                          {nota.temPlaca ? (
                            <FileCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                          ) : (
                            <FileX className="h-4 w-4 shrink-0 text-amber-400" />
                          )}
                          <span className="text-sm font-semibold tabular-nums text-white">
                            {nota.nNF}
                          </span>
                          {nota.temPlaca && (
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                              já tem
                            </span>
                          )}
                        </div>

                        {/* Posto */}
                        <p className="truncate text-xs font-medium text-slate-300" title={nota.posto}>
                          {nota.posto}
                        </p>

                        {/* Arquivo */}
                        <p className="truncate text-xs text-slate-400" title={nota.fileName}>
                          {nota.fileName}
                        </p>

                        {/* Campo infCpl */}
                        <div>
                          {nota.temPlaca ? (
                            <p className="text-xs text-slate-500 italic">
                              Placa já registrada no XML
                            </p>
                          ) : (
                            <Input
                              placeholder="Digite o conteúdo para o infCpl"
                              value={nota.placa}
                              onChange={(e) =>
                                atualizarPlaca(nota.id, e.target.value)
                              }
                              className={`h-9 rounded-xl border bg-white/[0.04] text-sm text-white placeholder:text-slate-600 transition-colors focus:outline-none ${
                                nota.placa.trim()
                                  ? "border-violet-500/30 focus:border-violet-500/50"
                                  : "border-amber-500/30 focus:border-amber-500/50"
                              }`}
                            />
                          )}
                        </div>

                        {/* Remover */}
                        <button
                          onClick={() => removerNota(nota.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-slate-500 transition-colors hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* ── Rodapé com botão confirmar ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between rounded-[20px] border border-white/8 bg-white/[0.02] px-5 py-4"
              >
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-slate-500" />
                  <p className="text-sm text-slate-400">
                    {semPlacaCount > 0
                      ? `Preencha a placa de ${semPlacaCount} nota${semPlacaCount > 1 ? "s" : ""} para continuar`
                      : "Tudo pronto! Clique em Confirmar para gerar os XMLs corrigidos"}
                  </p>
                </div>

                <AccentButton
                  onClick={confirmar}
                  disabled={!prontoParaConfirmar}
                >
                  <Download className="h-4 w-4" />
                  Confirmar e baixar XMLs
                </AccentButton>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ── */}
        {notas.length === 0 && !processando && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
              <Upload className="h-7 w-7 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">
              Nenhum XML carregado ainda
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Arraste os arquivos ou clique na área acima para começar
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Abastecimento;
