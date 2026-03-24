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
    <div className="min-h-screen bg-background">
      {!isPresentationMode && (
        <>
          <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <DashboardTopbar onMenuToggle={() => setSidebarOpen(true)} />
        </>
      )}
      <main
        className={`transition-all duration-500 ease-out ${
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
