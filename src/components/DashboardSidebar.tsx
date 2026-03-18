import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  FileSearch,
  Hexagon,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { getRecords } from "@/lib/history";
import { useAuth } from "@/contexts/AuthContext";

const SIDEBAR_WIDTH = 272;

const navSections = [
  {
    label: "Visão geral",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
        description: "Resumo operacional",
      },
      {
        title: "Histórico",
        icon: History,
        path: "/historico",
        description: "Execuções anteriores",
        showBadge: true,
      },
      {
        title: "Em andamento",
        icon: Loader2,
        path: "/em-andamento",
        description: "Processos em aberto",
      },
    ],
  },
  {
    label: "Operação",
    items: [
      {
        title: "Conciliação",
        icon: FileSearch,
        path: "/conciliacao",
        description: "Motor de comparação",
      },
      {
        title: "Clientes",
        icon: Building2,
        path: "/clientes",
        description: "Centrais e módulos",
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        title: "Configurações",
        icon: Settings,
        path: "/configuracoes",
        description: "Preferências da conta",
      },
    ],
  },
];

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const historyCount = getRecords().length;

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "RF";

  const displayName = user?.user_metadata?.full_name || user?.email || "Usuário";

  return (
    <aside
      className="sidebar-shell fixed left-0 top-0 bottom-0 z-50 flex flex-col"
      style={{ width: SIDEBAR_WIDTH }}
    >
      <div className="flex h-full flex-col px-4 py-4">
        {/* Marca */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="surface-panel mb-5 flex w-full items-start gap-3 px-4 py-4 text-left transition-all hover:-translate-y-[1px]"
          style={{ borderRadius: 20 }}
        >
          <div className="sidebar-brand-badge flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
            <Hexagon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-[#F3F6FB]">
                ReceitaFlow
              </h1>
              <span className="status-info inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Pro
              </span>
            </div>

            <p className="mt-1 text-[11px] leading-relaxed text-[#8A96A8]">
              Plataforma de conciliação financeira e fiscal
            </p>
          </div>
        </button>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto pr-1">
          <div className="space-y-5">
            {navSections.map((section) => (
              <section key={section.label}>
                <p className="sidebar-label">{section.label}</p>

                <div className="space-y-1.5">
                  {section.items.map((item) => {
                    const active = isActive(item.path);

                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className={`sidebar-item w-full text-left ${active ? "active" : ""}`}
                      >
                        <div className="sidebar-item-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#121A24]">
                          <item.icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{item.title}</span>

                            {item.showBadge && historyCount > 0 && (
                              <span className="sidebar-badge shrink-0">
                                {historyCount}
                              </span>
                            )}
                          </div>

                          <p className="truncate text-[11px] text-[#6F7C8F]">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        {/* Rodapé */}
        <div className="mt-5">
          <div
            className="surface-panel flex items-center gap-3 px-3.5 py-3"
            style={{ borderRadius: 18 }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(91,141,239,0.16)] text-sm font-semibold text-[#A9C3FF]">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#F3F6FB]">
                {displayName}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="status-active">Administrador</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent text-[#7F8FA4] transition-all hover:border-[rgba(91,141,239,0.22)] hover:bg-[rgba(91,141,239,0.12)] hover:text-[#A9C3FF]"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;