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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0d16" }}>
        <div className="h-7 w-7 rounded-full animate-spin border-2 border-violet-500/20 border-t-violet-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (moduleKey && !canView(moduleKey)) {
    return <Navigate to="/inicio" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
