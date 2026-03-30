import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
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
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute left-1/2 top-[-120px] h-[320px] w-[320px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "rgba(186, 117, 23, 0.07)" }}
        />
        <div
          className="absolute left-[10%] top-[18%] h-[180px] w-[180px] rounded-full blur-3xl"
          style={{ background: "rgba(250, 199, 117, 0.04)" }}
        />
        <div
          className="absolute right-[8%] bottom-[12%] h-[220px] w-[220px] rounded-full blur-3xl"
          style={{ background: "rgba(239, 159, 39, 0.04)" }}
        />
        <div className="absolute inset-0 bg-grid-pattern" />
      </div>

      {!isPresentationMode && (
        <>
          <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <DashboardTopbar onMenuToggle={() => setSidebarOpen(true)} />
        </>
      )}

      <main
        className={`relative z-10 transition-all duration-500 ease-out mac-scroll ${
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
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;