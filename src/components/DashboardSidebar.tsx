import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  const [profileData, setProfileData] = useState<{
    avatar_url: string | null;
    display_name: string | null;
    full_name: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("avatar_url, display_name, full_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfileData(data);
      });
  }, [user]);

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

  const displayName =
    profileData?.display_name ||
    profileData?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "Usuário";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarUrl = profileData?.avatar_url || null;

  const sidebarContent = (
    <div className="flex h-full flex-col px-3 py-4">
      <div className="mb-2 flex items-center justify-end md:hidden">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-white/60 transition-all duration-200 hover:bg-white/[0.05] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="mac-scroll flex-1 space-y-6 overflow-y-auto pr-1">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (item.masterOnly && !isMaster) return false;
            if (item.moduleKey && !canView(item.moduleKey)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                {section.label}
              </p>

              <div className="space-y-2">
                {visibleItems.map((item) => {
                  const active = isActive(item.path);

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-medium transition-all duration-300 ${
                        active
                          ? "bg-[#1A1A1A] text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                          : "text-white/55 hover:bg-[#1A1A1A]/60 hover:text-white"
                      }`}
                    >
                      {/* Barra ativa */}
                      <span
                        className={`absolute left-0 top-[8px] bottom-[8px] w-[3px] rounded-r-full transition-all ${
                          active ? "bg-[#D4AF37] opacity-100" : "opacity-0 group-hover:opacity-40 bg-[#D4AF37]"
                        }`}
                      />

                      <item.icon
                        className={`h-4 w-4 transition-all ${
                          active ? "text-[#D4AF37]" : "text-white/50 group-hover:text-white"
                        }`}
                      />

                      <span className="flex-1 text-left">{item.title}</span>

                      {item.showBadge && historyCount > 0 && (
                        <span className="rounded-lg bg-[#D4AF37]/15 px-2 py-0.5 text-[11px] font-semibold text-[#D4AF37]">
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

      {/* USER */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 rounded-2xl bg-[#1A1A1A] px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[11px] font-semibold text-[#D4AF37]">
            {avatarUrl ? (
              <img src={avatarUrl} className="h-full w-full object-cover rounded-xl" />
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-white">{displayName}</p>
            <p className="text-[11px] text-white/40">Sessão ativa</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/60 hover:bg-white/[0.05] hover:text-white transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed left-4 top-[68px] bottom-4 z-50 hidden w-[240px] md:flex">
        <div className="w-full rounded-[24px] border border-white/10 bg-[#0D0D0D] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          {sidebarContent}
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-4 top-4 bottom-4 w-[280px]">
            <div className="h-full rounded-[24px] bg-[#0D0D0D] shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
              {sidebarContent}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default DashboardSidebar;