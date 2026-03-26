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

const navSections = [
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

const DashboardSidebar = ({ open, onClose }: any) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { canView, isMaster } = useModulePermissions();
  const historyCount = getRecords().length;

  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  const initials =
    user?.user_metadata?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "RF";

  const displayName =
    user?.user_metadata?.full_name || user?.email || "Usuário";

  const sidebarContent = (
    <div className="flex h-full flex-col px-3 py-4">
      <nav className="flex-1 overflow-y-auto space-y-6">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (item.masterOnly && !isMaster) return false;
            if (item.moduleKey && !canView(item.moduleKey)) return false;
            return true;
          });

          if (!visibleItems.length) return null;

          return (
            <div key={section.label}>
              <p className="px-3 mb-2 text-[11px] uppercase tracking-wider text-white/40">
                {section.label}
              </p>

              <div className="space-y-2">
                {visibleItems.map((item) => {
                  const active = isActive(item.path);

                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] transition-all ${
                        active
                          ? "bg-white/10 border border-white/10 text-white shadow"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{item.title}</span>

                      {item.showBadge && historyCount > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-primary/20 text-primary">
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

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
            {initials}
          </div>

          <div className="flex-1 truncate text-sm">{displayName}</div>

          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-white/5"
          >
            <LogOut className="h-4 w-4 text-white/60" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP */}
      <aside className="hidden md:flex fixed left-4 top-4 bottom-4 z-50 w-[240px]">
        <div className="w-full rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-2xl">
          {sidebarContent}
        </div>
      </aside>

      {/* MOBILE */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="absolute left-4 top-4 bottom-4 w-[260px]">
            <div className="h-full rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-2xl">
              {sidebarContent}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default DashboardSidebar;