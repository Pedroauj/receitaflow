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
  const [isTransitioning, setIsTransitioning] = useState(false);
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
    if (isPresentationMode) return;

    setIsTransitioning(true);
    const timeout = window.setTimeout(() => {
      setIsTransitioning(false);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [location.pathname, isPresentationMode]);

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
            --rf-bg: #05070c;
            --rf-bg-2: #0a0d15;
            --rf-panel: rgba(18, 23, 34, 0.78);
            --rf-panel-strong: rgba(19, 24, 36, 0.92);
            --rf-panel-soft: rgba(255,255,255,0.035);
            --rf-line: rgba(255,255,255,0.08);
            --rf-line-soft: rgba(255,255,255,0.05);
            --rf-text-soft: rgba(255,255,255,0.7);
            --rf-text-muted: rgba(255,255,255,0.52);
            --rf-brand: #8b5cf6;
            --rf-brand-soft: rgba(139, 92, 246, 0.16);
            --rf-gold: #efb24f;
            --rf-green: #44d391;
            --rf-red: #ff7f7f;
            --rf-shadow-lg: 0 30px 80px rgba(0, 0, 0, 0.42);
            --rf-shadow-md: 0 18px 45px rgba(0, 0, 0, 0.28);
            --rf-shadow-sm: 0 10px 24px rgba(0, 0, 0, 0.18);
            --rf-ease: cubic-bezier(0.22, 1, 0.36, 1);
          }

          .rf-shell * {
            -webkit-tap-highlight-color: transparent;
          }

          .rf-shell .rf-glass {
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            background: linear-gradient(
              180deg,
              rgba(15, 20, 31, 0.82),
              rgba(11, 15, 24, 0.72)
            );
            border: 1px solid var(--rf-line);
            box-shadow: var(--rf-shadow-lg);
          }

          .rf-shell .rf-card-polish {
            position: relative;
            overflow: hidden;
          }

          .rf-shell .rf-card-polish::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            border-radius: inherit;
            background: linear-gradient(
              180deg,
              rgba(255,255,255,0.055) 0%,
              rgba(255,255,255,0.018) 18%,
              rgba(255,255,255,0.008) 42%,
              rgba(255,255,255,0) 100%
            );
            opacity: 0.95;
          }

          .rf-shell .rf-surface-hover {
            transition:
              transform 220ms var(--rf-ease),
              background-color 220ms var(--rf-ease),
              border-color 220ms var(--rf-ease),
              box-shadow 220ms var(--rf-ease),
              color 220ms var(--rf-ease),
              opacity 220ms var(--rf-ease);
          }

          .rf-shell .rf-surface-hover:hover {
            border-color: rgba(255,255,255,0.12);
            box-shadow:
              var(--rf-shadow-sm),
              inset 0 1px 0 rgba(255,255,255,0.05);
          }

          .rf-shell .rf-top-nav-item {
            position: relative;
            height: 40px;
            padding: 0 16px;
            border-radius: 999px;
            border: 1px solid transparent;
            background: rgba(255,255,255,0.035);
            color: rgba(255,255,255,0.78);
            font-size: 14px;
            font-weight: 700;
            transition:
              transform 200ms var(--rf-ease),
              background-color 200ms var(--rf-ease),
              border-color 200ms var(--rf-ease),
              color 200ms var(--rf-ease),
              box-shadow 200ms var(--rf-ease);
          }

          .rf-shell .rf-top-nav-item:hover {
            transform: translateY(-1px);
            background: rgba(255,255,255,0.055);
            border-color: rgba(255,255,255,0.07);
            color: rgba(255,255,255,0.92);
          }

          .rf-shell .rf-top-nav-item.is-active {
            background: #fbfbfd;
            color: #111318;
            border-color: rgba(255,255,255,0.1);
            box-shadow:
              0 10px 24px rgba(255,255,255,0.08),
              inset 0 1px 0 rgba(255,255,255,0.45);
          }

          .rf-shell .rf-icon-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 999px;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--rf-line-soft);
            color: rgba(255,255,255,0.82);
            transition:
              transform 200ms var(--rf-ease),
              background-color 200ms var(--rf-ease),
              border-color 200ms var(--rf-ease),
              box-shadow 200ms var(--rf-ease);
          }

          .rf-shell .rf-icon-btn:hover {
            transform: translateY(-1px);
            background: rgba(255,255,255,0.06);
            border-color: rgba(255,255,255,0.1);
            box-shadow: var(--rf-shadow-sm);
          }

          .rf-shell .rf-user-trigger {
            height: 44px;
            padding: 0 10px 0 4px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--rf-line-soft);
            color: rgba(255,255,255,0.92);
            transition:
              transform 200ms var(--rf-ease),
              background-color 200ms var(--rf-ease),
              border-color 200ms var(--rf-ease),
              box-shadow 200ms var(--rf-ease);
          }

          .rf-shell .rf-user-trigger:hover {
            transform: translateY(-1px);
            background: rgba(255,255,255,0.06);
            border-color: rgba(255,255,255,0.1);
            box-shadow: var(--rf-shadow-sm);
          }

          .rf-shell .rf-user-avatar {
            width: 34px;
            height: 34px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 800;
            color: #171717;
            background: linear-gradient(135deg, #f1d29f, #a5693f);
            border: 1px solid rgba(255,255,255,0.14);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
          }

          .rf-shell .rf-dropdown {
            background: linear-gradient(
              180deg,
              rgba(18, 22, 33, 0.96),
              rgba(13, 16, 25, 0.96)
            );
            border: 1px solid rgba(255,255,255,0.09);
            box-shadow: 0 28px 70px rgba(0,0,0,0.46);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
          }

          .rf-shell .rf-dropdown-item {
            height: 42px;
            border-radius: 14px;
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
            animation: rfPageEnter 240ms var(--rf-ease);
          }

          @keyframes rfPageEnter {
            from {
              opacity: 0;
              transform: translateY(10px) scale(0.996);
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
          className="absolute left-1/2 top-[-120px] h-[300px] w-[300px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "rgba(139, 92, 246, 0.13)" }}
        />
        <div
          className="absolute left-[8%] top-[18%] h-[190px] w-[190px] rounded-full blur-3xl"
          style={{ background: "rgba(239, 178, 79, 0.06)" }}
        />
        <div
          className="absolute right-[6%] bottom-[12%] h-[240px] w-[240px] rounded-full blur-3xl"
          style={{ background: "rgba(139, 92, 246, 0.08)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 15% 0%, rgba(139,92,246,0.10), transparent 20%),
              radial-gradient(circle at 100% 100%, rgba(139,92,246,0.06), transparent 22%),
              linear-gradient(180deg, rgba(255,255,255,0.015), transparent 24%)
            `,
          }}
        />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.18]" />
      </div>

      {!isPresentationMode && (
        <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4 md:px-6 lg:px-8">
          <div className="mx-auto max-w-[1680px]">
            <div className="rf-glass rf-card-polish rounded-[28px]">
              <div className="grid h-[78px] grid-cols-[minmax(180px,260px)_1fr_auto] items-center gap-4 px-4 md:px-5 lg:px-6">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="group flex min-w-0 items-center gap-3 text-left"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background:
                        "conic-gradient(from 180deg, #d4c4ff, #a57bff, #6f45ff, #d4c4ff)",
                      boxShadow: "0 0 20px rgba(139,92,246,.22)",
                    }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[18px] font-extrabold tracking-[-0.04em] text-foreground">
                      ReceitaFlow
                    </p>
                    <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
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
                        <Icon className="h-4 w-4" />
                        <span>{mod.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="flex items-center justify-end gap-2 md:gap-3">
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
                    >
                      <span className="rf-user-avatar">{userInitial}</span>
                      <span className="hidden max-w-[110px] truncate text-[14px] font-bold sm:inline-block">
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
                          className="rf-dropdown absolute right-0 top-[54px] z-50 w-[290px] rounded-[22px] p-3"
                        >
                          <div className="mb-2 rounded-[16px] border border-white/5 bg-white/[0.03] p-3">
                            <div className="flex items-center gap-3">
                              <span className="rf-user-avatar h-[42px] w-[42px] text-[14px]">
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
                <div className="flex items-center gap-2 overflow-x-auto px-4 pb-4 lg:hidden">
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
                        <Icon className="h-4 w-4" />
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
          isPresentationMode ? "" : "pt-[104px] md:pt-[112px]"
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