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
  ChevronRight,
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
      <div className="mb-3 flex items-center justify-between px-1 md:mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl border"
            style={{
              borderColor: "rgba(95, 135, 255, 0.18)",
              background: "linear-gradient(180deg, rgba(70,95,180,0.20) 0%, rgba(45,58,108,0.16) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <span className="text-sm font-semibold leading-none text-[#9CB2FF]">⬡</span>
          </div>

          <div className="min-w-0">
            <p className="text-[14px] font-semibold tracking-[-0.03em] text-white">
              Receita<span className="text-[#8EA6FF]">Flow</span>
            </p>
            <p className="mt-0.5 text-[11px] text-white/34">Painel operacional</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/52 transition-all duration-200 hover:bg-white/[0.05] hover:text-white md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 rounded-[22px] border border-white/[0.05] bg-white/[0.025] px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-[#151821] text-[12px] font-semibold text-[#B9C7FF]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold tracking-[-0.02em] text-white">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-white/38">
              {isMaster ? "Administrador master" : "Sessão ativa"}
            </p>
          </div>
        </div>
      </div>

      <nav className="mac-scroll flex-1 space-y-5 overflow-y-auto pr-1">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (item.masterOnly && !isMaster) return false;
            if (item.moduleKey && !canView(item.moduleKey)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/26">
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
                      className={[
                        "group relative flex w-full items-center gap-3 overflow-hidden rounded-[20px] border px-3.5 py-3 text-left transition-all duration-200",
                        active
                          ? "border-white/[0.08] bg-[linear-gradient(180deg,rgba(24,28,38,0.98)_0%,rgba(18,21,29,0.98)_100%)] shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
                          : "border-transparent bg-transparent hover:border-white/[0.04] hover:bg-white/[0.035]",
                      ].join(" ")}
                    >
                      <span
                        className={`absolute left-0 top-[8px] bottom-[8px] w-[3px] rounded-r-full transition-all duration-200 ${
                          active ? "bg-[#8EA6FF] opacity-100" : "bg-[#8EA6FF] opacity-0 group-hover:opacity-45"
                        }`}
                      />

                      <div
                        className={`relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200 ${
                          active
                            ? "border-[rgba(142,166,255,0.16)] bg-[rgba(142,166,255,0.10)]"
                            : "border-white/[0.04] bg-white/[0.025] group-hover:border-white/[0.06] group-hover:bg-white/[0.045]"
                        }`}
                      >
                        <item.icon
                          className={`h-4 w-4 transition-colors duration-200 ${
                            active ? "text-[#B9C7FF]" : "text-white/48 group-hover:text-white/78"
                          }`}
                        />
                      </div>

                      <div className="relative z-[1] min-w-0 flex-1">
                        <p
                          className={`truncate text-[13px] font-medium tracking-[-0.01em] ${
                            active ? "text-white" : "text-white/62 group-hover:text-white/90"
                          }`}
                        >
                          {item.title}
                        </p>
                      </div>

                      {item.showBadge && historyCount > 0 ? (
                        <span className="relative z-[1] rounded-xl border border-[rgba(142,166,255,0.14)] bg-[rgba(142,166,255,0.08)] px-2 py-1 text-[11px] font-semibold text-[#B9C7FF]">
                          {historyCount}
                        </span>
                      ) : (
                        <ChevronRight
                          className={`relative z-[1] h-4 w-4 shrink-0 transition-all duration-200 ${
                            active
                              ? "text-[#8EA6FF]"
                              : "text-white/20 group-hover:translate-x-0.5 group-hover:text-white/38"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-white/[0.06] pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-between rounded-[20px] border border-white/[0.06] bg-white/[0.025] px-3.5 py-3 text-left transition-all duration-200 hover:bg-white/[0.05]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/[0.04] bg-white/[0.03]">
              <LogOut className="h-4 w-4 text-white/58" />
            </div>

            <div>
              <p className="text-[13px] font-medium text-white/82">Sair</p>
              <p className="mt-0.5 text-[11px] text-white/34">Encerrar sessão atual</p>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-white/20" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed left-4 top-[72px] bottom-4 z-50 hidden w-[248px] md:flex">
        <div
          className="sidebar-shell w-full rounded-[28px] border shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
          style={{
            borderColor: "rgba(255,255,255,0.06)",
            background: "linear-gradient(180deg, rgba(17,19,24,0.96) 0%, rgba(13,15,20,0.98) 100%)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          {sidebarContent}
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-in fade-in-0 duration-200"
            onClick={onClose}
          />

          <aside className="absolute left-4 top-4 bottom-4 w-[286px]">
            <div
              className="sidebar-shell h-full rounded-[28px] border shadow-[0_24px_70px_rgba(0,0,0,0.30)] animate-in slide-in-from-left duration-200 fade-in-0"
              style={{
                borderColor: "rgba(255,255,255,0.06)",
                background: "linear-gradient(180deg, rgba(17,19,24,0.98) 0%, rgba(13,15,20,0.99) 100%)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
              }}
            >
              {sidebarContent}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default DashboardSidebar;