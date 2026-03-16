import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen" style={{ background: "#18181A" }}>
      <DashboardSidebar />
      <div className="ml-[220px] min-h-screen">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
