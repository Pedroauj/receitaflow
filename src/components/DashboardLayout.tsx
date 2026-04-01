import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { usePresentationMode } from "@/contexts/PresentationModeContext";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useAuth } from "@/contexts/AuthContext";
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
  Repeat,
  User,
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
  { key: "clientes", label: "Clientes", path: "/clientes", icon: Building2 },
];

const DashboardLayout = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

  return (
    <div className="rf-shell relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <style>
        {`
          .rf-shell {
            --rf-line: rgba(255,255,255,0.08);
            --rf-line-soft: rgba(255,255,255,0.05);
            --rf-shadow-lg: 0 18px 48px rgba(0, 0, 0, 0.32);
            --rf-shadow-md: 0 12px 28px rgba(0, 0, 0, 0.22);
            --rf-shadow-sm: 0 8px 20px rgba(0, 0, 0, 0.16);
            --rf-ease: cubic-bezier(0.22, 1, 0.36, 1);
          }

          .rf-shell * {
            -webkit-tap-highlight-color: transparent;
          }

          .rf-shell .rf-top-shell {
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            background: linear-gradient(
              180deg,
              rgba(10, 13, 20, 0.9),
              rgba(8, 11, 18, 0.8)
            );
            border: 1px solid rgba(255,255,255,0.07);
            box-shadow: var(--rf-shadow-lg);
          }

          .rf-shell .rf-top-nav-item {
            position: relative;
            height: 36px;
            padding: 0 14px;
            border-radius: 999px;
            border: 1px solid transparent;
            background: rgba(255,255,255,0.035);
            color: rgba(255,255,255,0.8);
            font-size: 13px;
            font-weight: 700;
            transition:
              transform 180ms var(--rf-ease),
              background-color 180ms var(--rf-ease),
              border-color 180ms var(--rf-ease),
              color 180ms var(--rf-ease),
              box-shadow 180ms var(--rf-ease);
          }

          .rf-shell .rf-top-nav-item:hover {
            background: rgba(255,255,255,0.05);
            border-color: rgba(255,255,255,0.06);
            color: rgba(255,255,255,0.95);
            transform: translateY(-1px);
          }

          .rf-shell .rf-top-nav-item.is-active {
            background: #fbfbfd;
            color: #111318;
            border-color: rgba(255,255,255,0.1);
            box-shadow:
              0 8px 18px rgba(255,255,255,0.06),
              inset 0 1px 0 rgba(255,255,255,0.4);
          }

          .rf-shell .rf-icon-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 999px;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--rf-line-soft);
            color: rgba(255,255,255,0.82);
            transition:
              transform 180ms var(--rf-ease),
              background-color 180ms var(--rf-ease),
              border-color 180ms var(--rf-ease),
              box-shadow 180ms var(--rf-ease);
          }

          .rf-shell .rf-icon-btn:hover {
            background: rgba(255,255,255,0.06);
            border-color: rgba(255,255,255,0.09);
            box-shadow: var(--rf-shadow-sm);
            transform: translateY(-1px);
          }

          .rf-shell .rf-user-trigger {
            height: 38px;
            padding: 0 10px 0 4px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
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
            background: rgba(255,255,255,0.06);
            border-color: rgba(255,255,255,0.1);
            box-shadow: var(--rf-shadow-sm);
            transform: translateY(-1px);
          }

          .rf-shell .rf-user-avatar {
            width: 28px;
            height: 28px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 800;
            color: #171717;
            background: linear-gradient(135deg, #f1d29f, #a5693f);
            border: 1px solid rgba(255,255,255,0.14);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
          }

          .rf-shell .rf-dropdown {
            background: linear-gradient(
              180deg,
              rgba(18, 22, 33, 0.97),
              rgba(13, 16, 25, 0.97)
            );
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 22px 56px rgba(0,0,0,0.42);
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
          className="absolute left-[-80px] top-[-80px] h-[220px] w-[220px] rounded-full blur-3xl"
          style={{ background: "rgba(139, 92, 246, 0.08)" }}
        />
        <div
          className="absolute right-[-60px] bottom-[-80px] h-[240px] w-[240px] rounded-full blur-3xl"
          style={{ background: "rgba(139, 92, 246, 0.06)" }}
        />
        <div
          className="absolute left-0 right-0 top-0 h-[180px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0))",
          }}
        />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.12]" />
      </div>

      {!isPresentationMode && (
        <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4 md:px-6 lg:px-8">
          <div className="mx-auto max-w-[1680px]">
            <div className="rf-top-shell rounded-[24px]">
              <div className="grid h-[58px] grid-cols-[minmax(170px,240px)_1fr_auto] items-center gap-3 px-4 md:px-5">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="group flex min-w-0 items-center gap-3 text-left"
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
                    <p className="truncate text-[15px] font-extrabold tracking-[-0.04em] text-foreground">
                      ReceitaFlow
                    </p>
                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      Control Center
                    </p>
                  </div>
                </button>

                <nav className="hidden min-w-0 items-center justify-center gap-2 lg:flex">
                  {visibleModules.map((mod) => {
                    const Icon = mod.icon;
                    const active = isRouteActive(mod.path);

                    return (
                      <button
                        key={mod.key}
                        type="button"
                        onClick={() => navigate(mod.path)}
                        className={`rf-top-nav-item inline-flex items-center gap-2 ${
                          active ? "is-active" : ""
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{mod.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="flex items-center justify-end gap-2">
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
                      <span className="hidden max-w-[110px] truncate text-[13px] font-bold sm:inline-block">
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
                          className="rf-dropdown absolute right-0 top-[46px] z-50 w-[290px] rounded-[20px] p-3"
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

                          <button type="button" className="rf-dropdown-item w-full text-left">
                            <User className="h-4 w-4 text-white/68" />
                            Perfil
                          </button>

                          <button
                            type="button"
                            className="rf-dropdown-item w-full text-left"
                            onClick={() => {
                              setUserMenuOpen(false);
                              navigate("/configuracoes");
                            }}
                          >
                            <Settings className="h-4 w-4 text-white/68" />
                            Configurações
                          </button>

                          <button type="button" className="rf-dropdown-item w-full text-left">
                            <Repeat className="h-4 w-4 text-white/68" />
                            Trocar empresa
                          </button>

                          <button type="button" className="rf-dropdown-item w-full text-left">
                            <HelpCircle className="h-4 w-4 text-white/68" />
                            Ajuda e suporte
                          </button>

                          <div className="rf-dropdown-divider" />

                          <button
                            type="button"
                            className="rf-dropdown-item w-full text-left text-[#ffb3b3]"
                          >
                            <LogOut className="h-4 w-4 text-[#ff9d9d]" />
                            Sair
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {visibleModules.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
                  {visibleModules.map((mod) => {
                    const Icon = mod.icon;
                    const active = isRouteActive(mod.path);

                    return (
                      <button
                        key={`mobile-${mod.key}`}
                        type="button"
                        onClick={() => navigate(mod.path)}
                        className={`rf-top-nav-item inline-flex shrink-0 items-center gap-2 ${
                          active ? "is-active" : ""
                        }`}
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
          isPresentationMode ? "" : "pt-[84px] md:pt-[88px]"
        }`}
      >
        <div
          className={`mx-auto transition-all duration-500 ease-out ${
            isPresentationMode
              ? "max-w-[1920px] p-6 lg:p-10"
              : "max-w-[1680px] px-4 pb-6 md:px-6 md:pb-8 lg:px-8 lg:pb-10"
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