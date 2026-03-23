import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Building2,
  Fuel,
  FileSearch,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Shield,
  X,
  BarChart3,
} from "lucide-react";
import { getRecords } from "@/lib/history";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  showBadge?: boolean;
  masterOnly?: boolean;
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Visão geral",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { title: "Histórico", icon: History, path: "/historico", showBadge: true },
    ],
  },
  {
    label: "Fiscal",
    items: [
      { title: "NF-e / NFS-e", icon: FileSearch, path: "/conciliacao" },
    ],
  },
  {
    label: "Frota",
    items: [
      { title: "Abastecimento", icon: Fuel, path: "/abastecimento" },
      { title: "Médias de Abastecimento", icon: BarChart3, path: "/medias-abastecimento" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Clientes", icon: Building2, path: "/clientes" },
      { title: "Usuários", icon: Shield, path: "/usuarios", masterOnly: true },
      { title: "Configurações", icon: Settings, path: "/configuracoes" },
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
  const historyCount = getRecords().length;
  const [isMaster, setIsMaster] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.role === "master") setIsMaster(true);
      });
  }, [user]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [location.pathname]);

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
      {/* Close button - mobile only */}
      <div className="flex items-center justify-end mb-2 md:hidden">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto space-y-5">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !("masterOnly" in item && item.masterOnly) || isMaster
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
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
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                        active
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${
                          active ? "text-primary" : ""
                        }`}
                      />
                      <span className="flex-1 text-left">{item.title}</span>

                      {item.showBadge && historyCount > 0 && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
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
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[11px] font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-foreground">
              {displayName}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
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
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 flex-col w-[240px] bg-sidebar border-r border-sidebar-border">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-sidebar border-r border-sidebar-border animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default DashboardSidebar;
