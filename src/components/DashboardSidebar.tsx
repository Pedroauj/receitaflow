import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  History,
  Loader2,
  Users,
  Settings,
  Hexagon,
} from "lucide-react";
import { getRecords } from "@/lib/history";

const navItems = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/" },
      { title: "Histórico", icon: History, path: "/historico", showBadge: true },
      { title: "Em andamento", icon: Loader2, path: "/em-andamento" },
    ],
  },
  {
    label: "Configurações",
    items: [
      { title: "Clientes", icon: Users, path: "/clientes" },
      { title: "Configurações", icon: Settings, path: "/configuracoes" },
    ],
  },
];

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const historyCount = getRecords().length;

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar-nav fixed left-0 top-0 bottom-0 w-[220px] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center"
          style={{ background: "#412402" }}
        >
          <Hexagon className="h-5 w-5" style={{ color: "#BA7517" }} />
        </div>
        <div>
          <h1 className="text-sm font-semibold" style={{ color: "#F5F5F0" }}>
            Receita<span style={{ color: "#FAC775" }}>Flow</span>
          </h1>
          <p className="text-[10px]" style={{ color: "#5F5E5A" }}>
            Conversor financeiro
          </p>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 pt-6 space-y-6 overflow-y-auto">
        {navItems.map((section) => (
          <div key={section.label}>
            <p className="sidebar-label">{section.label}</p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <div
                  key={item.path}
                  className={`sidebar-item ${isActive(item.path) ? "active" : ""}`}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1">{item.title}</span>
                  {item.showBadge && historyCount > 0 && (
                    <span className="amber-badge">{historyCount}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User avatar */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "#2C2C2A" }}>
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ background: "#412402", color: "#FAC775" }}
          >
            RF
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "#F5F5F0" }}>
              Usuário
            </p>
            <p className="text-[10px]" style={{ color: "#5F5E5A" }}>
              Administrador
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
