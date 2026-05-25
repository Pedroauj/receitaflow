import { useState } from "react";
import { ExternalLink, Loader2, AlertTriangle, RefreshCw } from "lucide-react";

const SGT_URL = "https://dashboardsgt.lovable.app/login";

const SgtWorkspace = () => {
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [key, setKey] = useState(0);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setBlocked(true);
  };

  const handleReload = () => {
    setBlocked(false);
    setLoading(true);
    setKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Topbar */}
      <div className="flex items-center justify-between border-b border-white/8 bg-[rgba(10,13,22,0.95)] px-5 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/15 ring-1 ring-teal-500/20">
            <ExternalLink className="h-4 w-4 text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">Workspace SGT</p>
            <p className="mt-0.5 text-[11px] text-slate-500 leading-none">{SGT_URL}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReload}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[12px] text-slate-400 transition hover:border-white/14 hover:text-white"
          >
            <RefreshCw className="h-3 w-3" />
            Recarregar
          </button>
          <a
            href={SGT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-teal-500/25 bg-teal-500/10 px-3 py-1.5 text-[12px] font-medium text-teal-400 transition hover:border-teal-400/40 hover:bg-teal-500/15"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir em nova aba
          </a>
        </div>
      </div>

      {/* Área do iframe */}
      <div className="relative flex-1 overflow-hidden bg-[rgba(7,10,20,1)]">
        {/* Loading */}
        {loading && !blocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <p className="text-sm text-slate-400">Carregando Workspace SGT…</p>
          </div>
        )}

        {/* Bloqueado por X-Frame-Options */}
        {blocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Incorporação bloqueada</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                O site <span className="text-white">dashboardsgt.lovable.app</span> está impedindo
                a incorporação por iframe. Para resolver, é necessário configurar os headers do
                projeto SGT para permitir <code className="rounded bg-white/8 px-1 text-xs text-slate-300">X-Frame-Options: ALLOWALL</code>.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReload}
                className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition hover:border-white/14 hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Tentar novamente
              </button>
              <a
                href={SGT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-teal-500/25 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-400 transition hover:border-teal-400/40 hover:bg-teal-500/15"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir em nova aba
              </a>
            </div>
          </div>
        )}

        <iframe
          key={key}
          src={SGT_URL}
          title="Workspace SGT"
          className={`h-full w-full border-0 transition-opacity duration-300 ${
            loading || blocked ? "opacity-0" : "opacity-100"
          }`}
          onLoad={handleLoad}
          onError={handleError}
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>
    </div>
  );
};

export default SgtWorkspace;
