import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import { usePresentationMode } from "@/contexts/PresentationModeContext";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isPresentationMode } = usePresentationMode();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPresentationMode) return;

      if (e.key === "Escape" && location.pathname !== "/inicio") {
        e.preventDefault();
        navigate("/inicio");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location.pathname, navigate, isPresentationMode]);

  return (
    <div className="apple-dashboard-shell relative min-h-screen bg-background">
      <style>
        {`
          .apple-dashboard-shell {
            --apple-ease: cubic-bezier(0.4, 0, 0.2, 1);
            --apple-fast: 180ms;
            --apple-normal: 220ms;
            --apple-ring: rgba(255, 255, 255, 0.08);
            --apple-border: rgba(255, 255, 255, 0.06);
            --apple-border-strong: rgba(255, 255, 255, 0.12);
            --apple-surface: rgba(255, 255, 255, 0.03);
            --apple-surface-strong: rgba(255, 255, 255, 0.05);
            --apple-shadow-sm: 0 10px 24px rgba(0, 0, 0, 0.18);
            --apple-shadow-md: 0 18px 40px rgba(0, 0, 0, 0.22);
            --apple-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }

          .apple-dashboard-shell * {
            -webkit-tap-highlight-color: transparent;
          }

          .apple-dashboard-shell main,
          .apple-dashboard-shell aside,
          .apple-dashboard-shell header,
          .apple-dashboard-shell section,
          .apple-dashboard-shell article,
          .apple-dashboard-shell nav,
          .apple-dashboard-shell button,
          .apple-dashboard-shell a,
          .apple-dashboard-shell input,
          .apple-dashboard-shell textarea,
          .apple-dashboard-shell select,
          .apple-dashboard-shell [role="button"],
          .apple-dashboard-shell [data-state],
          .apple-dashboard-shell [data-slot="card"],
          .apple-dashboard-shell .card {
            transition:
              background-color var(--apple-normal) var(--apple-ease),
              border-color var(--apple-normal) var(--apple-ease),
              box-shadow var(--apple-normal) var(--apple-ease),
              transform var(--apple-fast) var(--apple-ease),
              opacity var(--apple-fast) var(--apple-ease),
              color var(--apple-fast) var(--apple-ease);
          }

          .apple-dashboard-shell button,
          .apple-dashboard-shell a,
          .apple-dashboard-shell [role="button"] {
            transform: translateY(0) scale(1);
            will-change: transform, box-shadow, background-color;
          }

          .apple-dashboard-shell button:hover,
          .apple-dashboard-shell a:hover,
          .apple-dashboard-shell [role="button"]:hover {
            transform: translateY(-1px);
          }

          .apple-dashboard-shell button:active,
          .apple-dashboard-shell a:active,
          .apple-dashboard-shell [role="button"]:active {
            transform: translateY(0) scale(0.985);
          }

          .apple-dashboard-shell button:focus-visible,
          .apple-dashboard-shell a:focus-visible,
          .apple-dashboard-shell input:focus-visible,
          .apple-dashboard-shell textarea:focus-visible,
          .apple-dashboard-shell select:focus-visible,
          .apple-dashboard-shell [role="button"]:focus-visible {
            outline: none;
            box-shadow:
              0 0 0 2px var(--apple-ring),
              0 0 0 1px var(--apple-border-strong),
              0 12px 28px rgba(0, 0, 0, 0.16);
          }

          .apple-dashboard-shell input,
          .apple-dashboard-shell textarea,
          .apple-dashboard-shell select {
            border-color: var(--apple-border);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
          }

          .apple-dashboard-shell input:hover,
          .apple-dashboard-shell textarea:hover,
          .apple-dashboard-shell select:hover {
            border-color: rgba(255, 255, 255, 0.1);
          }

          .apple-dashboard-shell input:focus,
          .apple-dashboard-shell textarea:focus,
          .apple-dashboard-shell select:focus {
            border-color: var(--apple-border-strong);
            background: rgba(255, 255, 255, 0.035);
            box-shadow:
              0 0 0 2px rgba(255, 255, 255, 0.06),
              0 14px 32px rgba(0, 0, 0, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.04);
          }

          .apple-dashboard-shell [data-slot="card"],
          .apple-dashboard-shell .card,
          .apple-dashboard-shell article,
          .apple-dashboard-shell section > div[class*="rounded"],
          .apple-dashboard-shell div[class*="border"][class*="rounded"],
          .apple-dashboard-shell div[class*="bg-card"] {
            position: relative;
            overflow: hidden;
          }

          .apple-dashboard-shell [data-slot="card"]::before,
          .apple-dashboard-shell .card::before,
          .apple-dashboard-shell article::before,
          .apple-dashboard-shell section > div[class*="rounded"]::before,
          .apple-dashboard-shell div[class*="border"][class*="rounded"]::before,
          .apple-dashboard-shell div[class*="bg-card"]::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            border-radius: inherit;
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.045) 0%,
              rgba(255, 255, 255, 0.018) 22%,
              rgba(255, 255, 255, 0.008) 45%,
              rgba(255, 255, 255, 0) 100%
            );
            opacity: 0.8;
          }

          .apple-dashboard-shell [data-slot="card"]:hover,
          .apple-dashboard-shell .card:hover,
          .apple-dashboard-shell article:hover,
          .apple-dashboard-shell section > div[class*="rounded"]:hover,
          .apple-dashboard-shell div[class*="border"][class*="rounded"]:hover,
          .apple-dashboard-shell div[class*="bg-card"]:hover {
            border-color: var(--apple-border-strong);
            box-shadow:
              var(--apple-shadow-sm),
              var(--apple-highlight);
            transform: translateY(-1px);
          }

          .apple-dashboard-shell [data-slot="card"]:focus-within,
          .apple-dashboard-shell .card:focus-within,
          .apple-dashboard-shell article:focus-within,
          .apple-dashboard-shell section > div[class*="rounded"]:focus-within,
          .apple-dashboard-shell div[class*="border"][class*="rounded"]:focus-within,
          .apple-dashboard-shell div[class*="bg-card"]:focus-within {
            border-color: rgba(255, 255, 255, 0.14);
            box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.08),
              var(--apple-shadow-md),
              var(--apple-highlight);
          }

          .apple-dashboard-shell aside a[aria-current="page"],
          .apple-dashboard-shell aside button[aria-current="page"],
          .apple-dashboard-shell aside .active,
          .apple-dashboard-shell nav a[aria-current="page"],
          .apple-dashboard-shell nav .active {
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.08),
              rgba(255, 255, 255, 0.045)
            );
            border-color: rgba(255, 255, 255, 0.12);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.06),
              0 8px 24px rgba(0, 0, 0, 0.14);
          }

          .apple-dashboard-shell aside a:hover,
          .apple-dashboard-shell aside button:hover,
          .apple-dashboard-shell nav a:hover {
            background: rgba(255, 255, 255, 0.045);
          }

          .apple-dashboard-shell .apple-panel {
            background: rgba(255, 255, 255, 0.025);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid var(--apple-border);
            box-shadow:
              0 16px 40px rgba(0, 0, 0, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.04);
          }

          .apple-dashboard-shell .apple-page-enter {
            animation: applePageEnter 220ms var(--apple-ease);
          }

          @keyframes applePageEnter {
            from {
              opacity: 0;
              transform: translateY(8px) scale(0.995);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>

      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute left-1/2 top-[-120px] h-[320px] w-[320px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "rgba(186, 117, 23, 0.09)" }}
        />
        <div
          className="absolute left-[10%] top-[18%] h-[180px] w-[180px] rounded-full blur-3xl"
          style={{ background: "rgba(250, 199, 117, 0.05)" }}
        />
        <div
          className="absolute right-[8%] bottom-[12%] h-[220px] w-[220px] rounded-full blur-3xl"
          style={{ background: "rgba(239, 159, 39, 0.05)" }}
        />
        <div
          className="absolute left-[18%] top-[8%] h-[240px] w-[240px] rounded-full blur-3xl"
          style={{ background: "rgba(255, 255, 255, 0.025)" }}
        />
        <div className="absolute inset-0 bg-grid-pattern" />
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 10%, rgba(255,255,255,0.035), transparent 28%),
              radial-gradient(circle at 80% 80%, rgba(255,200,0,0.05), transparent 32%),
              linear-gradient(to bottom, rgba(255,255,255,0.015), transparent 30%)
            `,
          }}
        />
      </div>

      {!isPresentationMode && (
        <>
          <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <DashboardTopbar onMenuToggle={() => setSidebarOpen(true)} />
        </>
      )}

      <main
        className={`relative z-10 mac-scroll transition-all duration-500 ease-out ${
          isPresentationMode ? "" : "md:ml-[272px]"
        }`}
      >
        <div
          className={`transition-all duration-500 ease-out ${
            isPresentationMode
              ? "mx-auto max-w-[1920px] p-6 lg:p-10"
              : "mx-auto max-w-[1500px] px-4 pb-6 pt-20 md:px-6 md:pb-8 md:pt-20 lg:px-8 lg:pb-10 lg:pt-20"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="apple-page-enter"
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