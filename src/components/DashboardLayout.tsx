import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";

const SIDEBAR_WIDTH = 272;

const DashboardLayout = () => {
  return (
    <div className="min-h-screen app-shell-bg">
      <DashboardSidebar />

      <main
        className="min-h-screen"
        style={{
          marginLeft: SIDEBAR_WIDTH,
        }}
      >
        <div className="content-shell">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;