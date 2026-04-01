import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import { usePresentationMode } from "@/contexts/PresentationModeContext";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

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
    const html = document.documentElement;
    const body = document.body;
    const mainEl = mainRef.current;

    let scrollTimeout = 0;
    let hoverTimeout = 0;

    const addScrollState = () => {
      html.classList.add("is-scrolling");
      body.classList.add("is-scrolling");
      mainEl?.classList.add("is-scrolling");

      window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        html.classList.remove("is-scrolling");
        body.classList.remove("is-scrolling");
        mainEl?.classList.remove("is-scrolling");
      }, 850);
    };

    const addHoverState = () => {
      html.classList.add("scrollbar-awake");
      body.classList.add("scrollbar-awake");
      mainEl?.classList.add("scrollbar-awake");

      window.clearTimeout(hoverTimeout);
      hoverTimeout = window.setTimeout(() => {
        html.classList.remove("scrollbar-awake");
        body.classList.remove("scrollbar-awake");
        mainEl?.classList.remove("scrollbar-awake");
      }, 900);
    };

    const handleWindowScroll = () => {
      addScrollState();
    };

    const handlePointerMove = (e: PointerEvent) => {
      const nearViewportRightEdge = window.innerWidth - e.clientX <= 28;
      if (nearViewportRightEdge) {
        addHoverState();
      }
    };

    const handleMainMouseEnter = () => {
      addHoverState();
    };

    const handleMainMouseMove = (e: MouseEvent) => {
      const rect = mainEl?.getBoundingClientRect();
      if (!rect) return;

      const nearContainerRightEdge = rect.right - e.clientX <= 28;
      if (nearContainerRightEdge) {
        addHoverState();
      }
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    mainEl?.addEventListener("mouseenter", handleMainMouseEnter);
    mainEl?.addEventListener("mousemove", handleMainMouseMove);

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      mainEl?.removeEventListener("mouseenter", handleMainMouseEnter);
      mainEl?.removeEventListener("mousemove", handleMainMouseMove);

      window.clearTimeout(scrollTimeout);
      window.clearTimeout(hoverTimeout);

      html.classList.remove("is-scrolling", "scrollbar-awake");
      body.classList.remove("is-scrolling", "scrollbar-awake");
      mainEl?.classList.remove("is-scrolling", "scrollbar-awake");
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0B0C0F] text-white">
      <style>
        {`
          .rf-shell {
            --rf-bg: #0b0c0f;
            --rf-surface: #111318;
            --rf-surface-2: #151820;
            --rf-border: rgba(255,255,255,0.06);
            --rf-border-strong: rgba(255,255,255,0.10);
            --rf-text-soft: rgba(255,255,255,0.62);
            --rf-shadow: 0 20px 60px rgba(0,0,0,0.28);
            --rf-ease: cubic-bezier(0.22, 1, 0.36, 1);
          }

          .rf-shell * {
            -webkit-tap-highlight-color: transparent;
          }

          .rf-shell main,
          .rf-shell aside,
          .rf-shell header,
          .rf-shell section,
          .rf-shell article,
          .rf-shell nav,
          .rf-shell button,
          .rf-shell a,
          .rf-shell input,
          .rf-shell textarea,
          .rf-shell select,
          .rf-shell [role="button"],
          .rf-shell [data-state],
          .rf-shell [data-slot="card"],
          .rf-shell .card {
            transition:
              background-color 220ms var(--rf-ease),
              border-color 220ms var(--rf-ease),
              box-shadow 220ms var(--rf-ease),
              transform 180ms var(--rf-ease),
              opacity 180ms var(--rf-ease),
              color 180ms var(--rf-ease);
          }

          .rf-shell button,
          .rf-shell a,
          .rf-shell [role="button"] {
            transform: translateY(0);
          }

          .rf-shell button:active,
          .rf-shell a:active,
          .rf-shell [role="button"]:active {
            transform: scale(0.985);
          }

          .rf-shell button:focus-visible,
          .rf-shell a:focus-visible,
          .rf-shell input:focus-visible,
          .rf-shell textarea:focus-visible,
          .rf-shell select:focus-visible,
          .rf-shell [role="button"]:focus-visible {
            outline: none;
            box-shadow:
              0 0 0 1px rgba(142,166,255,0.45),
              0 0 0 4px rgba(142,166,255,0.12);
          }

          .rf-shell .sidebar-shell,
          .rf-shell .sidebar-shell:hover,
          .rf-shell .sidebar-shell:focus-within,
          .rf-shell .sidebar-shell:active {
            transform: none !important;
          }

          .rf-shell .rf-panel {
            background: linear-gradient(180deg, rgba(20,22,28,0.94) 0%, rgba(14,16,21,0.96) 100%);
            border: 1px solid var(--rf-border);
            box-shadow: var(--rf-shadow);
          }

          .rf-shell .rf-page-enter {
            animation: rfPageEnter 220ms var(--rf-ease);
          }

          @keyframes rfPageEnter {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div className="rf-shell">
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background: `
              radial-gradient(circle at 18% 12%, rgba(255,255,255,0.04), transparent 24%),
              radial-gradient(circle at 82% 78%, rgba(120,146,255,0.08), transparent 28%),
              radial-gradient(circle at 50% 0%, rgba(255,255,255,0.025), transparent 30%),
              linear-gradient(180deg, #0B0C0F 0%, #0A0B0E 100%)
            `,
          }}
        />

        {!isPresentationMode && (
          <>
            <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <DashboardTopbar onMenuToggle={() => setSidebarOpen(true)} />
          </>
        )}

        <main
          ref={mainRef}
          className={`relative z-10 mac-scroll transition-all duration-300 ${
            isPresentationMode ? "" : "md:ml-[272px]"
          }`}
        >
          <div
            className={`mx-auto transition-all duration-300 ${
              isPresentationMode
                ? "max-w-[1920px] p-6 lg:p-10"
                : "max-w-[1440px] px-4 pb-8 pt-20 md:px-6 lg:px-8"
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                className="rf-page-enter"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;