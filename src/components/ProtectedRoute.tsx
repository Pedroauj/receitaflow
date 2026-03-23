import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModulePermissions } from "@/hooks/useModulePermissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  moduleKey?: string;
}

const ProtectedRoute = ({ children, moduleKey }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { canView, loading: permLoading } = useModulePermissions();

  if (loading || permLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#18181A" }}>
        <div className="h-8 w-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#BA7517", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (moduleKey && !canView(moduleKey)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
