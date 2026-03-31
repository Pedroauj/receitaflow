// 🔥 ALTERAÇÃO VISUAL PREMIUM DARK + GOLD

import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import { usePresentationMode } from "@/contexts/PresentationModeContext";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  useEffect(() => {
    if (isPresentationMode) return;

    setIsTransitioning(true);
    const timeout = window.setTimeout(() => {
      setIsTransitioning(false);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [location.pathname, isPresentationMode]);

  return (
    <div className="relative min-h-screen bg-[#0D0D0D] text-white">
      <style>
        {`
          :root {
            --gold: #D4AF37;
            --gold-soft: rgba(212,175,55,0.12);
            --border-soft: rgba(255,255,255,0.06);
            --border-strong: rgba(255,255,255,0.12);
          }

          * {
            -webkit-tap-highlight-color: transparent;
          }

          button, a, [role="button"] {
            transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          }

          button:hover, a:hover {
            transform: translateY(-1px);
          }

          button:active {
            transform: scale(0.98);
          }

          .card,
          [class*="rounded"] {
            position: relative;
            overflow: hidden;
          }

          .card::before,
          [class*="rounded"]::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background: linear-gradient(
              180deg,
              rgba(255,255,255,0.04),
              rgba(255,255,255,0.01),
              transparent
            );
            pointer-events: none;
          }

          .card:hover,
          [class*="rounded"]:hover {
            box-shadow:
              0 20px 50px rgba(0,0,0,0.5),
              inset 0 1px 0 rgba(255,255,255,0.05);
          }

          /* sidebar fix */
          .sidebar-shell,
          .sidebar-shell:hover {
            transform: none !important;
          }
        `}
      </style>

      {/* 🔥 BACKGROUND PREMIUM */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#0D0D0D]" />

        {/* glow dourado principal */}
        <div
          className="absolute left-1/2 top-[-140px] h-[380px] w-[380px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "rgba(212,175,55,0.10)" }}
        />

        {/* luz lateral */}
        <div
          className="absolute left-[12%] top-[25%] h-[200px] w-[200px] rounded-full blur-3xl"
          style={{ background: "rgba(212,175,55,0.05)" }}
        />

        <div
          className="absolute right-[10%] bottom-[15%] h-[240px] w-[240px] rounded-full blur-3xl"
          style={{ background: "rgba(212,175,55,0.05)" }}
        />

        {/* leve textura */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 10%, rgba(255,255,255,0.03), transparent 30%),
              radial-gradient(circle at 80% 80%, rgba(212,175,55,0.05), transparent 35%)
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
        className={`relative z-10 transition-all duration-500 ${
          isPresentationMode ? "" : "md:ml-[272px]"
        }`}
      >
        <div
          className={`transition-all duration-500 ${
            isPresentationMode
              ? "mx-auto max-w-[1920px] p-6 lg:p-10"
              : "mx-auto max-w-[1500px] px-4 pb-6 pt-20 md:px-6 md:pb-8 md:pt-20 lg:px-8 lg:pb-10 lg:pt-20"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.995 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
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