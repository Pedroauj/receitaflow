import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Building2,
  FileSearch,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Users,
  Shield,
} from "lucide-react";
import { getRecords } from "@/lib/history";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const navSections = [
  {
    label: "Visão geral",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { title: "Histórico", icon: History, path: "/historico", showBadge: true },
      { title: "Em andamento", icon: Loader2, path: "/em-andamento" },
    ],
  },
  {
    label: "Operação",
    items: [
      { title: "Conciliação", icon: FileSearch, path: "/conciliacao" },
      { title: "Clientes", icon: Building2, path: "/clientes" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Usuários", icon: Shield, path: "/usuarios", masterOnly: true },
      { title: "Configurações", icon: Settings, path: "/configuracoes" },
    ],
  },
] as const;

const DashboardSidebar = () => {
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
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2.5 px-3 py-3 mb-6 rounded-lg transition-colors hover:bg-accent/50"
        >
          <img src={logo} alt="ReceitaFlow" className="h-7 w-7 rounded-lg" />
          <span className="text-sm font-semibold text-foreground">ReceitaFlow</span>
        </button>

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
                      onClick={() => navigate(item.path)}
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
          ))}
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
    </aside>
  );
};

export default DashboardSidebar;