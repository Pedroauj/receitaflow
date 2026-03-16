import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="p-7 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div
          className="h-14 w-14 rounded-xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "#412402" }}
        >
          <AlertTriangle className="h-7 w-7" style={{ color: "#EF9F27" }} />
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "#F5F5F0" }}>404</h1>
        <p className="text-sm mb-6" style={{ color: "#888780" }}>Página não encontrada</p>
        <a
          href="/"
          className="text-sm font-medium px-5 py-2 rounded-lg inline-block transition-colors"
          style={{ background: "#412402", color: "#FAC775" }}
        >
          Voltar ao dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;
