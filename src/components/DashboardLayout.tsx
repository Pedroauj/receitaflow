import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { usePresentationMode } from "@/contexts/PresentationModeContext";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronDown,
  HelpCircle,
  LayoutDashboard,
  History,
  FileSearch,
  Fuel,
  Building2,
  Settings,
  LogOut,
  Search,
  Bell,
  User,
  BarChart3,
} from "lucide-react";

type NavModule = {
  key: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  masterOnly?: boolean;
};

const NAV_MODULES: NavModule[] = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { key: "historico", label: "Histórico", path: "/historico", icon: History },
  { key: "conciliacao", label: "NF-e / NFS-e", path: "/conciliacao", icon: FileSearch },
  { key: "abastecimento", label: "Abastecimento", path: "/abastecimento", icon: Fuel },
  {
    key: "medias_abastecimento",
    label: "Médias de abastecimento",
    path: "/medias-abastecimento",
    icon: BarChart3,
  },
  { key: "clientes", label: "Clientes", path: "/clientes", icon: Building2 },
];

const DashboardLayout = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { isPresentationMode } = usePresentationMode();
  const { canView, isMaster } = useModulePermissions();
  const { user } = useAuth();

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Usuário";

  const userEmail = user?.email || "";
  const userInitial = firstName.charAt(0).toUpperCase();

  const visibleModules = useMemo(() => {
    return NAV_MODULES.filter((mod) => {
      if (mod.masterOnly && !isMaster) return false;
      return canView(mod.key) || isMaster;
    });
  }, [canView, isMaster]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  const isRouteActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/inicio";
    }
    return location.pathname.startsWith(path);
  };

  const handleOpenProfile = () => {
    setUserMenuOpen(false);
    navigate("/configuracoes");
  };

  const handleOpenSettings = () => {
    setUserMenuOpen(false);
    navigate("/configuracoes");
  };

  const handleOpenSupport = () => {
    setUserMenuOpen(false);
    navigate("/configuracoes");
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      setUserMenuOpen(false);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro ao sair:", error);
        return;
      }

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Erro inesperado ao sair:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="rf-shell relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <style>
        {`
          .rf-shell {
            --rf-ease: cubic-bezier(0.22, 1, 0.36, 1);
            --rf-line: rgba(255,255,255,0.08);
            --rf-line-soft: rgba(255,255,255,0.05);
            --rf-bg-soft: rgba(255,255,255,0.035);
            --rf-shadow-lg: 0 22px 50px rgba(0, 0, 0, 0.34);
            --rf-shadow-md: 0 12px 28px rgba(0, 0, 0, 0.22);
            --rf-shadow-sm: 0 8px 18px rgba(0, 0, 0, 0.14);
          }

          .rf-shell * {
            -webkit-tap-highlight-color: transparent;
          }

          .rf-shell .rf-top-nav-item {
            height: 34px;
            padding: 0 14px;
            border-radius: 999px;
            border: 1px solid transparent;
            background: rgba(255,255,255,0.045);
            color: rgba(255,255,255,0.82);
            font-size: 13px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition:
              transform 180ms var(--rf-ease),
              background-color 180ms var(--rf-ease),
              border-color 180ms var(--rf-ease),
              color 180ms var(--rf-ease),
              box-shadow 180ms var(--rf-ease);
            white-space: nowrap;
          }

          .rf-shell .rf-top-nav-item:hover {
            transform: translateY(-1px);
            background: rgba(255,255,255,0.06);
            border-color: rgba(255,255,255,0.06);
            color: rgba(255,255,255,0.96);
          }

          .rf-shell .rf-top-nav-item.is-active {
            background: #fbfbfd;
            color: #111318;
            border-color: rgba(255,255,255,0.10);
            box-shadow:
              0 8px 18px rgba(255,255,255,0.06),
              inset 0 1px 0 rgba(255,255,255,0.45);
          }

          .rf-shell .rf-icon-btn {
            width: 34px;
            height: 34px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--rf-line-soft);
            color: rgba(255,255,255,0.84);
            transition:
              transform 180ms var(--rf-ease),
              background-color 180ms var(--rf-ease),
              border-color 180ms var(--rf-ease),
              box-shadow 180ms var(--rf-ease);
          }

          .rf-shell .rf-icon-btn:hover {
            transform: translateY(-1px);
            background: rgba(255,255,255,0.06);
            border-color: rgba(255,255,255,0.09);
            box-shadow: var(--rf-shadow-sm);
          }

          .rf-shell .rf-user-trigger {
            height: 36px;
            padding: 0 10px 0 4px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            gap: 9px;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--rf-line-soft);
            color: rgba(255,255,255,0.92);
            transition:
              transform 180ms var(--rf-ease),
              background-color 180ms var(--rf-ease),
              border-color 180ms var(--rf-ease),
              box-shadow 180ms var(--rf-ease);
          }

          .rf-shell .rf-user-trigger:hover {
            transform: translateY(-1px);
            background: rgba(255,255,255,0.06);
            border-color: rgba(255,255,255,0.09);
            box-shadow: var(--rf-shadow-sm);
          }

          .rf-shell .rf-user-avatar {
            width: 26px;
            height: 26px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 800;
            color: #171717;
            background: linear-gradient(135deg, #f1d29f, #a5693f);
            border: 1px solid rgba(255,255,255,0.14);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.18);
          }

          .rf-shell .rf-dropdown {
            background: linear-gradient(
              180deg,
              rgba(18, 22, 33, 0.98),
              rgba(13, 16, 25, 0.98)
            );
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 24px 56px rgba(0,0,0,0.42);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }

          .rf-shell .rf-dropdown-item {
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 12px;
            color: rgba(255,255,255,0.86);
            font-size: 14px;
            font-weight: 700;
            transition:
              background-color 180ms var(--rf-ease),
              color 180ms var(--rf-ease),
              transform 180ms var(--rf-ease);
          }

          .rf-shell .rf-dropdown-item:hover {
            background: rgba(255,255,255,0.05);
            transform: translateX(2px);
          }

          .rf-shell .rf-dropdown-divider {
            height: 1px;
            background: rgba(255,255,255,0.06);
            margin: 8px 2px;
          }

          .rf-shell .rf-page-enter {
            animation: rfPageEnter 220ms var(--rf-ease);
          }

          @keyframes rfPageEnter {
            from {
              opacity: 0;
              transform: translateY(8px) scale(0.996);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 8% 10%, rgba(99,102,241,0.11), transparent 20%),
              radial-gradient(circle at 92% 88%, rgba(139,92,246,0.08), transparent 22%),
              radial-gradient(circle at 50% 0%, rgba(59,130,246,0.05), transparent 26%),
              linear-gradient(180deg, #060912 0%, #070b14 42%, #060912 100%)
            `,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.014), rgba(255,255,255,0))",
          }}
        />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.06]" />
      </div>

      {!isPresentationMode && (
        <header className="fixed inset-x-0 top-0 z-40">
          <div
            className="w-full border-b border-white/5 bg-gradient-to-b from-black/60 to-black/20 backdrop-blur-md"
            style={{
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            <div className="mx-auto max-w-[1560px] px-4 md:px-5">
              <div className="flex h-[64px] items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <div
                    className="h-7 w-7 shrink-0 rounded-full"
                    style={{
                      background:
                        "conic-gradient(from 180deg, #d4c4ff, #a57bff, #6f45ff, #d4c4ff)",
                      boxShadow: "0 0 14px rgba(139,92,246,.18)",
                    }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-extrabold tracking-[-0.04em] text-foreground">
                      ReceitaFlow
                    </p>
                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                      Control Center
                    </p>
                  </div>
                </button>

                <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
                  {visibleModules.map((mod) => {
                    const Icon = mod.icon;
                    const active = isRouteActive(mod.path);

                    return (
                      <button
                        key={mod.key}
                        type="button"
                        onClick={() => navigate(mod.path)}
                        className={`rf-top-nav-item ${active ? "is-active" : ""}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{mod.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="flex items-center gap-2">
                  <button type="button" className="rf-icon-btn hidden sm:inline-flex">
                    <Search className="h-4 w-4" />
                  </button>

                  <button type="button" className="rf-icon-btn hidden sm:inline-flex">
                    <Bell className="h-4 w-4" />
                  </button>

                  <div ref={userMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((prev) => !prev)}
                      className="rf-user-trigger"
                      aria-expanded={userMenuOpen}
                      aria-haspopup="menu"
                    >
                      <span className="rf-user-avatar">{userInitial}</span>
                      <span className="hidden max-w-[100px] truncate text-[13px] font-bold sm:inline-block">
                        {firstName}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-white/55 transition-transform duration-200 ${
                          userMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.985 }}
                          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                          className="rf-dropdown absolute right-0 top-[46px] z-[999] w-[286px] rounded-[18px] p-3"
                        >
                          <div className="mb-2 rounded-[14px] border border-white/5 bg-white/[0.03] p-3">
                            <div className="flex items-center gap-3">
                              <span className="rf-user-avatar h-[40px] w-[40px] text-[14px]">
                                {userInitial}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[15px] font-extrabold tracking-[-0.02em] text-foreground">
                                  {firstName}
                                </p>
                                <p className="truncate text-[12px] text-white/52">
                                  {userEmail || "Administrador"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="rf-dropdown-item w-full text-left"
                            onClick={handleOpenProfile}
                          >
                            <User className="h-4 w-4 text-white/68" />
                            Perfil
                          </button>

                          <button
                            type="button"
                            className="rf-dropdown-item w-full text-left"
                            onClick={handleOpenSettings}
                          >
                            <Settings className="h-4 w-4 text-white/68" />
                            Configurações
                          </button>

                          <button
                            type="button"
                            className="rf-dropdown-item w-full text-left"
                            onClick={handleOpenSupport}
                          >
                            <HelpCircle className="h-4 w-4 text-white/68" />
                            Ajuda e suporte
                          </button>

                          <div className="rf-dropdown-divider" />

                          <button
                            type="button"
                            className="rf-dropdown-item w-full text-left text-[#ffb3b3]"
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                          >
                            <LogOut className="h-4 w-4 text-[#ff9d9d]" />
                            {isSigningOut ? "Saindo..." : "Sair"}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {visibleModules.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-3 lg:hidden">
                  {visibleModules.map((mod) => {
                    const Icon = mod.icon;
                    const active = isRouteActive(mod.path);

                    return (
                      <button
                        key={`mobile-${mod.key}`}
                        type="button"
                        onClick={() => navigate(mod.path)}
                        className={`rf-top-nav-item shrink-0 ${active ? "is-active" : ""}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{mod.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <main
        ref={mainRef}
        className={`relative z-10 transition-all duration-500 ease-out ${
          isPresentationMode ? "" : "pt-[88px] md:pt-[92px]"
        }`}
      >
        <div
          className={`mx-auto transition-all duration-500 ease-out ${
            isPresentationMode
              ? "max-w-[1920px] p-6 lg:p-10"
              : "max-w-[1720px] px-4 pb-6 md:px-5 md:pb-8 lg:px-6 lg:pb-10"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="rf-page-enter"
              initial={{ opacity: 0, y: 8, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.998 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;