import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Download, FileCheck, FileX, Fuel, CheckCircle2,
  AlertTriangle, X, FileCode, Building2, Plus, Search,
  Tag, Trash2, ChevronRight, Store,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Leitura segura de XML ────────────────────────────────────────────────────
// file.text() sempre decodifica como UTF-8. Se o arquivo for ISO-8859-1 ou
// Windows-1252 (comum em sistemas fiscais brasileiros), caracteres como ã, é, ç
// viram sequências inválidas que o MSXML rejeita com "invalid character in text".
// Esta função detecta o encoding declarado no próprio XML e decodifica corretamente.

async function lerXML(file: File): Promise<{ content: string; bytes: Uint8Array }> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);

  // Remove BOM UTF-8 (EF BB BF) se presente
  const offset = (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) ? 3 : 0;
  const bytesLimpos = offset > 0 ? bytes.subarray(offset) : bytes;

  // Lê o cabeçalho como Latin-1 (1-pra-1 com bytes) para achar a declaração de encoding
  const header = new TextDecoder("iso-8859-1").decode(bytesLimpos.subarray(0, Math.min(300, bytesLimpos.length)));
  const matchEnc = header.match(/encoding\s*=\s*["']([^"']+)["']/i);
  const enc = matchEnc?.[1]?.toLowerCase().replace(/_/g, "-") ?? "utf-8";

  // Decodifica com o encoding correto (fallback para UTF-8 se desconhecido)
  let decoder: TextDecoder;
  try { decoder = new TextDecoder(enc); }
  catch { decoder = new TextDecoder("utf-8"); }

  let content = decoder.decode(bytesLimpos);

  // Remove caracteres proibidos pelo XML 1.0
  content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F￾￿]/g, "");

  // Se o encoding original não era UTF-8, atualiza a declaração e re-codifica os bytes
  if (!["utf-8", "utf8"].includes(enc)) {
    content = content.replace(
      /(<\?xml[^?]*?\s)encoding\s*=\s*["'][^"']*["']/i,
      (_m, p1) => `${p1}encoding="UTF-8"`
    );
    return { content, bytes: new TextEncoder().encode(content) };
  }

  return { content, bytes: bytesLimpos };
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Posto {
  cnpj: string;
  nome: string;
  tags: string[];         // tags de placa cadastradas
  firstSeen: string;      // ISO date
}

interface NotaItem {
  id: string;
  nNF: string;
  fileName: string;
  rawContent: string;     // string para exibição e regex
  rawBytes: Uint8Array;   // bytes originais para export fiel ao arquivo
  infCpl: string;         // conteúdo digitado pelo usuário (só a placa)
  temPlaca: boolean;
  posto: string;
  cnpj: string;
}

// ─── Helpers XML ─────────────────────────────────────────────────────────────

function extrairNNF(xml: string): string {
  const m = xml.match(/<nNF>(\d+)<\/nNF>/);
  return m ? m[1] : "—";
}

function extrairPosto(xml: string): { nome: string; cnpj: string } {
  const nome = xml.match(/<emit>[\s\S]*?<xNome>([\s\S]*?)<\/xNome>/i)?.[1]?.trim() ?? "—";
  const cnpj = xml.match(/<emit>[\s\S]*?<CNPJ>(\d+)<\/CNPJ>/i)?.[1]?.trim() ?? "";
  return { nome, cnpj };
}

function temPlacaNoXML(xml: string): boolean {
  const m = xml.match(/<infCpl>([\s\S]*?)<\/infCpl>/i);
  return m ? /placa\s*/i.test(m[1]) : false;
}

function PlacaInput({ id, value, onChange }: { id: string; value: string; onChange: (id: string, valor: string) => void }) {
  const [local, setLocal] = useState(value);

  useEffect(() => { setLocal(value); }, [value]);

  return (
    <Input
      placeholder="Digite a placa..."
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => onChange(id, local)}
      className={`h-9 rounded-xl border bg-white/[0.04] text-sm text-white placeholder:text-slate-600 transition-colors focus:outline-none ${
        local.trim() ? "border-violet-500/30 focus:border-violet-500/50" : "border-amber-500/30 focus:border-amber-500/50"
      }`}
    />
  );
}

function montarInfCpl(tags: string[], placa: string): string {
  if (!tags.length) return placa.trim();
  return tags.map(tag => `${tag}${placa.trim()}`).join(" ");
}

function inserirNaXML(xml: string, conteudo: string): string {
  if (/<infCpl>/i.test(xml)) {
    return xml.replace(
      /<infCpl>([\s\S]*?)<\/infCpl>/i,
      (_, existente) => {
        const resto = existente.trim();
        const sep = resto.startsWith(";") ? "" : ";";
        return `<infCpl>${conteudo}${resto ? sep + resto : ""}</infCpl>`;
      }
    );
  }
  if (/<infAdic>/i.test(xml)) {
    return xml.replace(/<infAdic>/i, () => `<infAdic><infCpl>${conteudo}</infCpl>`);
  }
  return xml.replace(/<\/infNFe>/i, () => `<infAdic><infCpl>${conteudo}</infCpl></infAdic></infNFe>`);
}

function formatCNPJ(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

type Tab = "correcao" | "postos";

const Abastecimento = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("correcao");

  // ── Estado correção ──
  const [notas, setNotas] = useState<NotaItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Estado postos ──
  const [postos, setPostos] = useState<Posto[]>([]);
  const [searchPosto, setSearchPosto] = useState("");
  const [loadingPostos, setLoadingPostos] = useState(true);

  // ── Estado modal nova tag ──
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [searchPostoModal, setSearchPostoModal] = useState("");
  const [postoSelecionado, setPostoSelecionado] = useState<Posto | null>(null);

  // ── Carrega postos do Supabase (compartilhado entre todos os usuários) ──
  useEffect(() => {
    const fetchPostos = async () => {
      setLoadingPostos(true);
      const { data, error } = await supabase
        .from("postos_abastecimento")
        .select("*")
        .order("nome");
      if (!error && data) {
        setPostos(data.map(p => ({
          cnpj: p.cnpj,
          nome: p.nome,
          tags: p.tags ?? [],
          firstSeen: p.first_seen,
        })));
      }
      setLoadingPostos(false);
    };
    fetchPostos();
  }, []);

  // ── Merge postos extraídos dos XMLs → Supabase (compartilhado) ──
  const mergePostos = useCallback(async (novasNotas: { nome: string; cnpj: string }[]) => {
    const novos = novasNotas.filter(({ cnpj }) => cnpj && cnpj !== "—");
    if (!novos.length) return;

    // Atualização otimista local (imediata)
    setPostos(prev => {
      const mapa = new Map(prev.map(p => [p.cnpj, p]));
      novos.forEach(({ nome, cnpj }) => {
        if (!mapa.has(cnpj)) {
          mapa.set(cnpj, { cnpj, nome, tags: [], firstSeen: new Date().toISOString() });
        }
      });
      return Array.from(mapa.values());
    });

    // Persiste no Supabase — ignoreDuplicates garante que não sobrescreve tags já cadastradas
    const { error } = await supabase
      .from("postos_abastecimento")
      .upsert(
        novos.map(({ cnpj, nome }) => ({
          cnpj,
          nome,
          tags: [],
          created_by: user?.id ?? null,
        })),
        { onConflict: "cnpj", ignoreDuplicates: true }
      );
    if (error) console.error("mergePostos:", error);
  }, [user]);

  // ── Leitura de XMLs ──
  const processarArquivos = useCallback(async (files: FileList | File[]) => {
    const lista = Array.from(files).filter(f => f.name.toLowerCase().endsWith(".xml"));
    if (!lista.length) { toast({ title: "Nenhum XML encontrado", variant: "destructive" }); return; }

    const novas: NotaItem[] = [];
    const postosEncontrados: { nome: string; cnpj: string }[] = [];

    for (const file of lista) {
      const { content: raw, bytes: rawBytes } = await lerXML(file);
      const nNF = extrairNNF(raw);
      const { nome, cnpj } = extrairPosto(raw);
      const temPlaca = temPlacaNoXML(raw);
      postosEncontrados.push({ nome, cnpj });
      novas.push({ id: `${file.name}_${nNF}`, nNF, fileName: file.name, rawContent: raw, rawBytes, infCpl: "", temPlaca, posto: nome, cnpj });
    }

    await mergePostos(postosEncontrados);

    setNotas(prev => {
      const mapa = new Map(prev.map(n => [n.id, n]));
      return novas.map(n => ({ ...n, infCpl: mapa.get(n.id)?.infCpl ?? "" }));
    });

    toast({
      title: `${novas.length} XML${novas.length > 1 ? "s" : ""} carregado${novas.length > 1 ? "s" : ""}`,
      description: `${novas.filter(n => !n.temPlaca).length} sem placa identificados.`,
    });
  }, [mergePostos]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    processarArquivos(e.dataTransfer.files);
  }, [processarArquivos]);

  const atualizarInfCpl = (id: string, valor: string) =>
    setNotas(prev => prev.map(n => n.id === id ? { ...n, infCpl: valor } : n));

  const removerNota = (id: string) =>
    setNotas(prev => prev.filter(n => n.id !== id));

  // ── Gerar preview do infCpl para uma nota ──
  const getPreview = (nota: NotaItem): string => {
    if (!nota.infCpl.trim()) return "";
    const posto = postos.find(p => (p.cnpj && p.cnpj === nota.cnpj) || p.nome === nota.posto);
    if (posto?.tags.length) return montarInfCpl(posto.tags, nota.infCpl);
    return nota.infCpl.trim();
  };

  // ── Exportar ZIP ──
  const gerarXMLs = () => {
    const semPlaca = notas.filter(n => !n.temPlaca && !n.infCpl.trim());
    if (semPlaca.length) {
      toast({ title: "Campo não preenchido", description: `${semPlaca.length} nota(s) sem conteúdo.`, variant: "destructive" });
      return null;
    }
    return notas.map(nota => {
      const conteudo = nota.infCpl.trim() ? getPreview(nota) : "";
      // Gera a string modificada e converte para bytes via TextEncoder (UTF-8 nativo do browser)
const xmlStr = conteudo ? inserirNaXML(nota.rawContent, conteudo) : nota.rawContent;
      const xmlBytes = new TextEncoder().encode(xmlStr);
      const nome = nota.fileName.toLowerCase().endsWith(".xml") ? nota.fileName : `${nota.fileName}.xml`;
      return { nome, xmlBytes };
    });
  };

  // Exporta cada XML diretamente, sem passar pelo ZIP.
  // Usa File System Access API (Chrome/Edge): abre seletor de pasta e salva todos os arquivos
  // de uma vez, sem conflito de downloads, independente da quantidade.
  // Fallback para download sequencial com delay nos demais browsers.
  const confirmarSemZip = async () => {
    const arquivos = gerarXMLs();
    if (!arquivos) return;

    // Chrome / Edge: File System Access API — salva todos na pasta escolhida
    if ("showDirectoryPicker" in window) {
      try {
        const dir = await (window as any).showDirectoryPicker({ mode: "readwrite" });
        for (const { nome, xmlBytes } of arquivos) {
          const fh = await dir.getFileHandle(nome, { create: true });
          const writable = await fh.createWritable();
          await writable.write(xmlBytes);
          await writable.close();
        }
        toast({ title: `${arquivos.length} XMLs salvos na pasta`, description: "Todos os arquivos foram gravados diretamente." });
        return;
      } catch {
        // usuário cancelou o seletor — não faz nada
        return;
      }
    }

    // Fallback: download sequencial com 150ms de intervalo
    for (let i = 0; i < arquivos.length; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 150));
      const { nome, xmlBytes } = arquivos[i];
      const blob = new Blob([xmlBytes], { type: "application/xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = nome;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    }
    toast({ title: `${arquivos.length} XMLs exportados` });
  };

  // ── Validação de tag ──
  const tagInvalida = /[<>&]/.test(tagInput);
  const tagAviso   = /;/.test(tagInput);

  // ── Salvar nova tag ──
  const salvarTag = async () => {
    if (!tagInput.trim()) { toast({ title: "Digite a tag", variant: "destructive" }); return; }
    if (tagInvalida) { toast({ title: "Caractere inválido na tag", description: 'Os caracteres < > & quebram o XML e não são permitidos.', variant: "destructive" }); return; }
    if (!postoSelecionado) { toast({ title: "Selecione um posto", variant: "destructive" }); return; }

    const posto = postos.find(p => p.cnpj === postoSelecionado.cnpj);
    if (posto?.tags.includes(tagInput.trim())) {
      toast({ title: "Tag já existe neste posto", variant: "destructive" }); return;
    }

    const novasTags = [...(posto?.tags ?? []), tagInput.trim()];

    // Atualização otimista local
    setPostos(prev => prev.map(p =>
      p.cnpj === postoSelecionado.cnpj ? { ...p, tags: novasTags } : p
    ));

    // Persiste no Supabase
    const { error } = await supabase
      .from("postos_abastecimento")
      .update({ tags: novasTags, updated_at: new Date().toISOString() })
      .eq("cnpj", postoSelecionado.cnpj);

    if (error) {
      console.error("salvarTag:", error);
      toast({ title: "Erro ao salvar tag", variant: "destructive" });
      return;
    }

    toast({ title: "Tag salva!", description: `"${tagInput.trim()}" adicionada ao posto ${postoSelecionado.nome}.` });
    setTagInput(""); setPostoSelecionado(null); setSearchPostoModal(""); setShowTagModal(false);
  };

  const removerTag = async (cnpj: string, tag: string) => {
    const posto = postos.find(p => p.cnpj === cnpj);
    if (!posto) return;

    const novasTags = posto.tags.filter(t => t !== tag);

    // Atualização otimista local
    setPostos(prev => prev.map(p =>
      p.cnpj === cnpj ? { ...p, tags: novasTags } : p
    ));

    // Persiste no Supabase
    const { error } = await supabase
      .from("postos_abastecimento")
      .update({ tags: novasTags, updated_at: new Date().toISOString() })
      .eq("cnpj", cnpj);

    if (error) console.error("removerTag:", error);
  };

  const postosFiltrados = postos.filter(p =>
    p.nome.toLowerCase().includes(searchPosto.toLowerCase()) ||
    p.cnpj.includes(searchPosto)
  );

  const postosModalFiltrados = postos.filter(p =>
    p.nome.toLowerCase().includes(searchPostoModal.toLowerCase()) ||
    p.cnpj.includes(searchPostoModal)
  );

  const semPlacaCount = notas.filter(n => !n.temPlaca && !n.infCpl.trim()).length;
  const prontoParaConfirmar = notas.length > 0 && semPlacaCount === 0;

  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1560px] px-6 py-7">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="mb-7">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(19,27,52,0.96)_0%,rgba(10,14,28,0.98)_45%,rgba(7,10,20,1)_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_28%)]" />
            <div className="relative p-6 lg:p-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                <Fuel className="h-3.5 w-3.5" /> Abastecimento
              </div>
              <h1 className="text-[28px] font-semibold leading-none tracking-tight text-white lg:text-[32px]">
                Correção de XML sem Placa
              </h1>
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-400">
                Importe os XMLs de notas de abastecimento com erro por falta de placa. Cadastre as tags de placa por posto e gere os arquivos corrigidos automaticamente.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="mb-6 inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(16,20,32,0.98),rgba(10,13,22,0.98))] p-1.5">
          {([
            { key: "correcao", label: "Correção de XML",  icon: FileCode },
            { key: "postos",   label: "Postos e Tags",    icon: Store },
          ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
                tab === key
                  ? "bg-violet-500/15 text-white shadow-[inset_0_0_0_1px_rgba(139,92,246,0.3)]"
                  : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════
            ABA 1 — CORREÇÃO DE XML
        ════════════════════════════════════════ */}
        {tab === "correcao" && (
          <div className="space-y-5">
            {/* Upload */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer rounded-[24px] border-2 border-dashed p-10 text-center transition-all duration-300 ${
                  dragOver
                    ? "border-violet-500/60 bg-violet-500/8"
                    : "border-white/10 bg-[linear-gradient(180deg,rgba(16,20,32,0.98),rgba(10,13,22,0.98))] hover:border-violet-500/30 hover:bg-violet-500/5"
                }`}
              >
                <input ref={inputRef} type="file" accept=".xml" multiple className="hidden"
                  onChange={e => e.target.files && processarArquivos(e.target.files)} />
                <div className="flex flex-col items-center gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-colors duration-300 ${
                    dragOver ? "border-violet-500/40 bg-violet-500/20 text-violet-300" : "border-white/10 bg-white/[0.04] text-slate-400"
                  }`}>
                    <FileCode className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {dragOver ? "Solte os arquivos aqui" : "Arraste os XMLs ou clique para selecionar"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Múltiplos arquivos .xml aceitos</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Lista de notas */}
            <AnimatePresence>
              {notas.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Cabeçalho lista */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-white">{notas.length} nota{notas.length > 1 ? "s" : ""}</p>
                      {semPlacaCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                          <AlertTriangle className="h-3 w-3" />{semPlacaCount} sem preencher
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />Todas prontas
                        </span>
                      )}
                    </div>
                    <button onClick={() => setNotas([])} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                      Limpar tudo
                    </button>
                  </div>

                  {/* Tabela */}
                  <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,20,32,0.98),rgba(10,13,22,0.98))] shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                    {/* Header tabela */}
                    <div className="grid grid-cols-[80px_1fr_1.4fr_1.6fr_1.5fr_36px] items-center border-b border-white/8 bg-white/[0.02] px-5 py-3 gap-3">
                      {["Nº Nota","Posto","Arquivo","Placa","Preview infCpl",""].map((h, i) => (
                        <p key={i} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{h}</p>
                      ))}
                    </div>

                    {/* Linhas */}
                    <div className="divide-y divide-white/[0.05]">
                      <AnimatePresence>
                        {notas.map((nota, idx) => {
                          const preview = getPreview(nota);
                          const posto = postos.find(p => (p.cnpj && p.cnpj === nota.cnpj) || p.nome === nota.posto);
                          const temTags = (posto?.tags.length ?? 0) > 0;

                          return (
                            <motion.div
                              key={nota.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 8 }}
                              transition={{ duration: 0.2, delay: idx * 0.02 }}
                              className="grid grid-cols-[80px_1fr_1.4fr_1.6fr_1.5fr_36px] items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                            >
                              {/* Nº Nota */}
                              <div className="flex items-center gap-2">
                                {nota.temPlaca
                                  ? <FileCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                                  : <FileX className="h-4 w-4 shrink-0 text-amber-400" />}
                                <span className="text-sm font-semibold tabular-nums text-white">{nota.nNF}</span>
                              </div>

                              {/* Posto */}
                              <div>
                                <p className="truncate text-xs font-medium text-slate-300" title={nota.posto}>{nota.posto}</p>
                                {temTags && (
                                  <p className="mt-0.5 text-[10px] text-violet-400">{posto!.tags.length} tag{posto!.tags.length > 1 ? "s" : ""}</p>
                                )}
                              </div>

                              {/* Arquivo */}
                              <p className="truncate text-xs text-slate-500" title={nota.fileName}>{nota.fileName}</p>

                              {/* Campo placa */}
                              <div>
                                {nota.temPlaca ? (
                                  <p className="text-xs italic text-slate-600">Placa já registrada</p>
                                ) : (
                                  <PlacaInput
                                    id={nota.id}
                                    value={nota.infCpl}
                                    onChange={atualizarInfCpl}
                                  />
                                )}
                              </div>

                              {/* Preview */}
                              <div>
                                {preview ? (
                                  <p className="truncate text-[11px] text-violet-300 font-mono" title={preview}>{preview}</p>
                                ) : (
                                  <p className="text-[11px] text-slate-600 italic">—</p>
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
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Rodapé confirmar */}
                  <div className="flex items-center justify-between rounded-[20px] border border-white/8 bg-white/[0.02] px-5 py-4">
                    <p className="text-sm text-slate-400">
                      {semPlacaCount > 0
                        ? `Preencha a placa de ${semPlacaCount} nota${semPlacaCount > 1 ? "s" : ""} para continuar`
                        : "Tudo pronto! Clique em Confirmar para gerar os XMLs"}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={confirmarSemZip}
                        disabled={!prontoParaConfirmar}
                        title="Salva os XMLs direto em uma pasta, sem ZIP"
                        className="inline-flex h-11 items-center gap-2 rounded-2xl border border-violet-500/30 bg-[linear-gradient(135deg,rgba(99,102,241,0.85),rgba(139,92,246,0.75))] px-5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(99,102,241,0.25)] transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Download className="h-4 w-4" />
                        Salvar XMLs
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {notas.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                  <Upload className="h-7 w-7 text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-400">Nenhum XML carregado ainda</p>
                <p className="mt-1 text-xs text-slate-600">Arraste os arquivos ou clique na área acima para começar</p>
              </motion.div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            ABA 2 — POSTOS E TAGS
        ════════════════════════════════════════ */}
        {tab === "postos" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">

            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Buscar por nome ou CNPJ..."
                  value={searchPosto}
                  onChange={e => setSearchPosto(e.target.value)}
                  className="pl-10 h-10 rounded-xl border border-white/8 bg-white/[0.04] text-sm text-white placeholder:text-slate-600"
                />
              </div>
              <button
                onClick={() => setShowTagModal(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/15 px-4 text-sm font-semibold text-violet-300 transition-all hover:bg-violet-500/20"
              >
                <Plus className="h-4 w-4" />
                Criar tag de placa
              </button>
            </div>

            {/* Lista de postos */}
            {loadingPostos ? (
              <div className="flex items-center justify-center py-16 rounded-[24px] border border-white/8 bg-white/[0.02]">
                <div className="h-5 w-5 rounded-full border-2 border-violet-500/40 border-t-violet-400 animate-spin" />
                <span className="ml-3 text-sm text-slate-500">Carregando postos...</span>
              </div>
            ) : postosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center rounded-[24px] border border-white/8 bg-white/[0.02]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                  <Building2 className="h-6 w-6 text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-400">Nenhum posto cadastrado ainda</p>
                <p className="mt-1 text-xs text-slate-600">Importe XMLs na aba de Correção para os postos aparecerem aqui automaticamente</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,20,32,0.98),rgba(10,13,22,0.98))] shadow-[0_14px_40px_rgba(0,0,0,0.28)]">
                <div className="divide-y divide-white/[0.05]">
                  {postosFiltrados.map((posto, i) => (
                    <motion.div
                      key={posto.cnpj || posto.nome}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      className="px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Info do posto */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04]">
                            <Store className="h-4 w-4 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{posto.nome}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{posto.cnpj ? formatCNPJ(posto.cnpj) : "CNPJ não identificado"}</p>
                          </div>
                        </div>

                        {/* Badge tags */}
                        <div className="flex items-center gap-2 shrink-0">
                          {posto.tags.length > 0 ? (
                            <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300">
                              {posto.tags.length} tag{posto.tags.length > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-600">
                              Sem tags
                            </span>
                          )}
                          <button
                            onClick={() => { setPostoSelecionado(posto); setShowTagModal(true); }}
                            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.04] px-3 text-[12px] font-medium text-slate-400 transition-all hover:border-violet-500/25 hover:bg-violet-500/10 hover:text-violet-300"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Tag
                          </button>
                        </div>
                      </div>

                      {/* Tags cadastradas */}
                      {posto.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 pl-[52px]">
                          {posto.tags.map(tag => (
                            <div key={tag} className="group inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5">
                              <Tag className="h-3 w-3 text-violet-400" />
                              <span className="font-mono text-[12px] text-slate-300">{tag}</span>
                              <button
                                onClick={() => removerTag(posto.cnpj, tag)}
                                className="ml-1 text-slate-600 transition-colors hover:text-red-400"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ════════════════════════════════════════
            MODAL — CRIAR TAG DE PLACA
        ════════════════════════════════════════ */}
        <AnimatePresence>
          {showTagModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={e => { if (e.target === e.currentTarget) { setShowTagModal(false); setPostoSelecionado(null); setTagInput(""); setSearchPostoModal(""); }}}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,20,32,0.99),rgba(10,13,22,0.99))] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
              >
                {/* Header modal */}
                <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
                      <Tag className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Criar tag de placa</p>
                      <p className="text-xs text-slate-500">Como esse posto escreve a palavra "placa"</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowTagModal(false); setPostoSelecionado(null); setTagInput(""); setSearchPostoModal(""); }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-slate-500 hover:text-slate-300 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-5 p-6">
                  {/* Campo tag */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tag de placa</label>
                    <Input
                      placeholder='Ex: "PLACA:" ou "Placa - " ou "placa "'
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      className="h-11 rounded-xl border border-white/8 bg-white/[0.04] font-mono text-sm text-white placeholder:font-sans placeholder:text-slate-600"
                    />
                    {tagInput && !tagInvalida && !tagAviso && (
                      <p className="text-[11px] text-slate-500">
                        Resultado no XML: <span className="font-mono text-violet-300">{tagInput}ABC1D23</span>
                      </p>
                    )}
                    {tagInvalida && (
                      <p className="flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] font-medium text-red-400">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Os caracteres &lt; &gt; &amp; são inválidos em XML e impedirão a importação.
                      </p>
                    )}
                    {tagAviso && !tagInvalida && (
                      <div className="space-y-1">
                        <p className="text-[11px] text-slate-500">
                          Resultado no XML: <span className="font-mono text-violet-300">{tagInput}ABC1D23</span>
                        </p>
                        <p className="flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          O caractere <span className="font-mono mx-0.5">;</span> pode causar erro na importação do seu sistema fiscal.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Busca posto */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {postoSelecionado ? "Posto selecionado" : "Selecionar posto"}
                    </label>

                    {postoSelecionado ? (
                      <div className="flex items-center justify-between rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{postoSelecionado.nome}</p>
                          <p className="text-xs text-slate-500">{postoSelecionado.cnpj ? formatCNPJ(postoSelecionado.cnpj) : "Sem CNPJ"}</p>
                        </div>
                        <button onClick={() => { setPostoSelecionado(null); setSearchPostoModal(""); }}
                          className="text-slate-500 hover:text-slate-300 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <Input
                            placeholder="Buscar por nome ou CNPJ..."
                            value={searchPostoModal}
                            onChange={e => setSearchPostoModal(e.target.value)}
                            className="pl-10 h-10 rounded-xl border border-white/8 bg-white/[0.04] text-sm text-white placeholder:text-slate-600"
                          />
                        </div>
                        {postos.length === 0 ? (
                          <p className="text-xs text-slate-600 px-1">Nenhum posto cadastrado. Importe XMLs primeiro.</p>
                        ) : (
                          <div className="max-h-44 overflow-y-auto rounded-xl border border-white/8 bg-white/[0.02] divide-y divide-white/[0.04]">
                            {postosModalFiltrados.map(p => (
                              <button
                                key={p.cnpj || p.nome}
                                onClick={() => setPostoSelecionado(p)}
                                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
                              >
                                <div>
                                  <p className="text-sm font-medium text-white">{p.nome}</p>
                                  <p className="text-xs text-slate-500">{p.cnpj ? formatCNPJ(p.cnpj) : "Sem CNPJ"}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-600" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Botão salvar */}
                  <button
                    onClick={salvarTag}
                    disabled={!tagInput.trim() || !postoSelecionado || tagInvalida}
                    className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-violet-500/30 bg-[linear-gradient(135deg,rgba(99,102,241,0.85),rgba(139,92,246,0.75))] text-sm font-semibold text-white shadow-[0_10px_30px_rgba(99,102,241,0.25)] transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                    Salvar tag
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Abastecimento;
