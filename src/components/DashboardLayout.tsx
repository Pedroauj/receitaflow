import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardTopbar />
      <main className="ml-[240px]">
        <div className="p-6 lg:p-8 max-w-[1440px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
