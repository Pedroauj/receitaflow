import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import { usePresentationMode } from "@/contexts/PresentationModeContext";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
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
    <div className="min-h-screen bg-background relative">
      {/* Ambient glow effects — matches Landing / Login */}
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
        className={`relative z-10 transition-all duration-500 ease-out ${
          isPresentationMode ? "" : "md:ml-[240px]"
        }`}
      >
        <div
          className={`mx-auto transition-all duration-500 ease-out ${
            isPresentationMode
              ? "p-6 lg:p-10 max-w-[1920px]"
              : "p-4 md:p-6 lg:p-8 max-w-[1440px]"
          }`}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
