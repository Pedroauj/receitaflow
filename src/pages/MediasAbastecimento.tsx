import { useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  TrendingUp,
  Users,
  Truck,
  Droplets,
  Leaf,
  DollarSign,
  Download,
  FileText,
  Presentation,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ── Mock Data ────────────────────────────────────── */

const mockMotoristas = [
  { motorista: "Carlos Silva", placa: "ABC-1234", tipo: "Truck", media: 2.85, meta: 2.70, litrosEconomizados: 320, bonus: 480 },
  { motorista: "João Pereira", placa: "DEF-5678", tipo: "Carreta", media: 2.62, meta: 2.50, litrosEconomizados: 180, bonus: 270 },
  { motorista: "Pedro Santos", placa: "GHI-9012", tipo: "Rodotrem", media: 1.95, meta: 2.10, litrosEconomizados: -85, bonus: 0 },
  { motorista: "André Costa", placa: "JKL-3456", tipo: "Truck", media: 3.10, meta: 2.70, litrosEconomizados: 540, bonus: 810 },
  { motorista: "Lucas Oliveira", placa: "MNO-7890", tipo: "Carreta", media: 2.48, meta: 2.50, litrosEconomizados: -30, bonus: 0 },
  { motorista: "Rafael Lima", placa: "PQR-1122", tipo: "Truck", media: 2.92, meta: 2.70, litrosEconomizados: 295, bonus: 442 },
  { motorista: "Marcos Souza", placa: "STU-3344", tipo: "Rodotrem", media: 2.15, meta: 2.10, litrosEconomizados: 60, bonus: 90 },
  { motorista: "Thiago Alves", placa: "VWX-5566", tipo: "Carreta", media: 2.70, meta: 2.50, litrosEconomizados: 290, bonus: 435 },
];

const mockBarMotorista = mockMotoristas.map((m) => ({ name: m.motorista.split(" ")[0], media: m.media, meta: m.meta }));

const mockBarTipo = [
  { name: "Truck", media: 2.96 },
  { name: "Carreta", media: 2.60 },
  { name: "Rodotrem", media: 2.05 },
];

const mockEvolucao = [
  { mes: "Jan", media: 2.45 },
  { mes: "Fev", media: 2.52 },
  { mes: "Mar", media: 2.58 },
  { mes: "Abr", media: 2.61 },
  { mes: "Mai", media: 2.67 },
  { mes: "Jun", media: 2.72 },
];

const mockRanking = [...mockMotoristas].sort((a, b) => b.media - a.media).slice(0, 5).map((m) => ({ name: m.motorista.split(" ")[0], media: m.media }));

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

/* ── Component ────────────────────────────────────── */

const MediasAbastecimento = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [tipoFrota, setTipoFrota] = useState<string>("todos");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleProcess = () => {
    if (!file) {
      toast.error("Selecione uma planilha antes de processar.");
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setShowResults(true);
      toast.success("Planilha processada com sucesso!");
    }, 1800);
  };

  const handleExport = (type: string) => {
    toast.info(`Exportação ${type} será implementada em breve.`);
  };

  /* ── KPIs ──────────────────────────────────────── */
  const kpis = [
    { label: "Total de motoristas", value: "8", icon: Users, color: "text-blue-400" },
    { label: "Total de veículos", value: "8", icon: Truck, color: "text-purple-400" },
    { label: "Média geral da frota", value: "2.60 km/l", icon: TrendingUp, color: "text-primary" },
    { label: "Total de litros consumidos", value: "45.280 L", icon: Droplets, color: "text-cyan-400" },
    { label: "Total de economia", value: "1.570 L", icon: Leaf, color: "text-emerald-400" },
    { label: "Total de bônus", value: formatBRL(2527), icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Médias de Abastecimento</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Análise de desempenho de consumo por motorista e veículo
        </p>
      </div>

      {/* ── Upload Card ────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-5">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          {file ? (
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div className="text-sm">
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button onClick={() => setFile(null)} className="ml-2 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground text-center">
                Envie a planilha exportada do sistema da empresa
              </p>
              <label className="cursor-pointer rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">
                Selecionar arquivo
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
              </label>
              <p className="text-xs text-muted-foreground/50">.xlsx ou .xls</p>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Data inicial</label>
            <input
              type="date"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Data final</label>
            <input
              type="date"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tipo de frota</label>
            <Select value={tipoFrota} onValueChange={setTipoFrota}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="carreta">Carreta</SelectItem>
                <SelectItem value="rodotrem">Rodotrem</SelectItem>
                <SelectItem value="bitrem">Bitrem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <button
          onClick={handleProcess}
          disabled={processing}
          className="w-full sm:w-auto rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {processing ? "Processando…" : "Processar Planilha"}
        </button>
      </div>

      {/* ── Results ─────────────────────────────── */}
      {showResults && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Media por motorista */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-medium text-foreground">Média por Motorista</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockBarMotorista}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="media" name="Média" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                    <Bar dataKey="meta" name="Meta" radius={[4, 4, 0, 0]} fill="hsl(var(--muted-foreground))" opacity={0.3} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Media por tipo de caminhão */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-medium text-foreground">Média por Tipo de Caminhão</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockBarTipo} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="media" name="Média" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Evolução */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-medium text-foreground">Evolução ao Longo do Tempo</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockEvolucao}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={[2.3, 2.8]} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Line type="monotone" dataKey="media" name="Média" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ranking */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-medium text-foreground">Top Motoristas</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockRanking} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="media" name="Média" radius={[0, 4, 4, 0]}>
                      {mockRanking.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : `hsl(var(--primary) / ${0.7 - i * 0.1})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground">Dados Detalhados</h3>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Média</TableHead>
                    <TableHead className="text-right">Meta</TableHead>
                    <TableHead className="text-right">Litros Econ.</TableHead>
                    <TableHead className="text-right">Bônus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMotoristas.map((m) => (
                    <TableRow key={m.placa}>
                      <TableCell className="font-medium">{m.motorista}</TableCell>
                      <TableCell>{m.placa}</TableCell>
                      <TableCell>{m.tipo}</TableCell>
                      <TableCell className="text-right">{m.media.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{m.meta.toFixed(2)}</TableCell>
                      <TableCell className={`text-right ${m.litrosEconomizados >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {m.litrosEconomizados >= 0 ? "+" : ""}{m.litrosEconomizados}
                      </TableCell>
                      <TableCell className="text-right">{formatBRL(m.bonus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground">Exportar Relatório</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleExport("PowerPoint")}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Presentation className="h-4 w-4 text-primary" />
                Gerar Apresentação (PowerPoint)
              </button>
              <button
                onClick={() => handleExport("PDF")}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <FileText className="h-4 w-4 text-red-400" />
                Exportar PDF
              </button>
              <button
                onClick={() => handleExport("Excel")}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Download className="h-4 w-4 text-emerald-400" />
                Exportar Excel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MediasAbastecimento;
