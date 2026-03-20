import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { AppPermission } from "@/lib/permissions";

interface RouteProps {
  children: React.ReactNode;
  requiredPermission?: AppPermission;
}

const ProtectedRoute = ({ children, requiredPermission }: RouteProps) => {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#18181A" }}
      >
        <div
          className="h-8 w-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#BA7517", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    const fallbackPath = location.pathname === "/dashboard" ? "/" : "/dashboard";
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;