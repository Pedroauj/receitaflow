import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardTopbar />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 min-h-0 ml-[240px]">
          <div className="p-6 lg:p-8 max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
