import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  FileSearch,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
} from "lucide-react";
import { getRecords } from "@/lib/history";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const navSections = [
  {
    label: "Visão geral",
    items: [
      { title: "Dashboard", description: "Resumo operacional", icon: LayoutDashboard, path: "/dashboard" },
      { title: "Histórico", description: "Execuções anteriores", icon: History, path: "/historico", showBadge: true },
      { title: "Em andamento", description: "Processos em aberto", icon: Loader2, path: "/em-andamento" },
    ],
  },
  {
    label: "Operação",
    items: [
      { title: "Conciliação", description: "Motor de comparação", icon: FileSearch, path: "/conciliacao" },
      { title: "Clientes", description: "Centrais e módulos", icon: Building2, path: "/clientes" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Configurações", description: "Preferências da conta", icon: Settings, path: "/configuracoes" },
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
    <aside className="fixed left-0 top-0 bottom-0 z-50 flex flex-col w-[240px] bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col px-3 py-4">

        {/* Brand */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 px-3 py-3 mb-5 rounded-xl border border-border bg-card hover:bg-accent/40 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <img src={logo} alt="ReceitaFlow" className="h-5 w-5" />
          </div>

          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">ReceitaFlow</p>
            <p className="text-[11px] text-muted-foreground">
              Plataforma de conciliação
            </p>
          </div>
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto space-y-6">

          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>

              <div className="space-y-2">
                {section.items.map((item) => {
                  const active = isActive(item.path);

                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                        active
                          ? "bg-accent border border-border"
                          : "hover:bg-accent/40"
                      }`}
                    >
                      {/* Icon box */}
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
                          active
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>

                      {/* Text */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {item.title}
                          </span>

                          {item.showBadge && historyCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                              {historyCount}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

        </nav>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-bold">
              {initials}
            </div>

            <div className="flex-1">
              <p className="text-xs font-medium text-foreground truncate">
                {displayName}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
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