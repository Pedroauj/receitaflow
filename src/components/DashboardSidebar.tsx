import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  Building2,
  Fuel,
  FileSearch,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  X,
  BarChart3,
} from "lucide-react";
import { getRecords } from "@/lib/history";
import { useAuth } from "@/contexts/AuthContext";
import { useModulePermissions } from "@/hooks/useModulePermissions";

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  showBadge?: boolean;
  masterOnly?: boolean;
  moduleKey?: string;
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Visão geral",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard", moduleKey: "dashboard" },
      { title: "Histórico", icon: History, path: "/historico", showBadge: true, moduleKey: "historico" },
    ],
  },
  {
    label: "Fiscal",
    items: [
      { title: "NF-e / NFS-e", icon: FileSearch, path: "/conciliacao", moduleKey: "conciliacao" },
    ],
  },
  {
    label: "Frota",
    items: [
      { title: "Abastecimento", icon: Fuel, path: "/abastecimento", moduleKey: "abastecimento" },
      { title: "Médias de Abastecimento", icon: BarChart3, path: "/medias-abastecimento", moduleKey: "medias-abastecimento" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Clientes", icon: Building2, path: "/clientes", moduleKey: "clientes" },
      { title: "Usuários", icon: Shield, path: "/usuarios", masterOnly: true },
      { title: "Configurações", icon: Settings, path: "/configuracoes", moduleKey: "configuracoes" },
    ],
  },
];

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

const DashboardSidebar = ({ open, onClose }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { canView, isMaster } = useModulePermissions();
  const historyCount = getRecords().length;

  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
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

  const sidebarContent = (
    <div className="flex h-full flex-col px-3 py-4">
      <div className="mb-2 flex items-center justify-end md:hidden">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-5">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (item.masterOnly && !isMaster) return false;
            if (item.moduleKey && !canView(item.moduleKey)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-white/38">
                {section.label}
              </p>

              <div className="space-y-1.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.path);

                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium transition-all duration-150 ${
                        active
                          ? "border border-white/10 bg-white/[0.08] text-white"
                          : "text-white/65 hover:bg-white/[0.045] hover:text-white"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-white/55"}`}
                      />
                      <span className="flex-1 text-left">{item.title}</span>

                      {item.showBadge && historyCount > 0 && (
                        <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                          {historyCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-white/8 pt-4">
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[11px] font-semibold text-primary">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-white">
              {displayName}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/55 transition-colors hover:bg-white/5 hover:text-white"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed left-4 top-20 bottom-4 z-50 hidden w-[240px] md:flex">
        <div className="w-full rounded-2xl border border-white/8 bg-[rgba(17,18,23,0.42)] shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          {sidebarContent}
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="absolute left-4 top-4 bottom-4 w-[280px]">
            <div className="h-full rounded-2xl border border-white/8 bg-[rgba(17,18,23,0.58)] shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl animate-in slide-in-from-left duration-200">
              {sidebarContent}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default DashboardSidebar;