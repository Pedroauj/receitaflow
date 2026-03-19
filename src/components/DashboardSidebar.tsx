import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  FileSearch,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
} from "lucide-react";
import { getRecords } from "@/lib/history";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const navSections = [
  {
    label: "Visão geral",
    items: [
      { title: "Dashboard", description: "Resumo operacional", icon: LayoutDashboard, path: "/dashboard" },
      { title: "Histórico", description: "Execuções anteriores", icon: History, path: "/historico", showBadge: true },
      { title: "Em andamento", description: "Processos em aberto", icon: Loader2, path: "/em-andamento" },
    ],
  },
  {
    label: "Operação",
    items: [
      { title: "Conciliação", description: "Motor de comparação", icon: FileSearch, path: "/conciliacao" },
      { title: "Clientes", description: "Centrais e módulos", icon: Building2, path: "/clientes" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Configurações", description: "Preferências da conta", icon: Settings, path: "/configuracoes" },
    ],
  },
];

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const historyCount = getRecords().length;

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "RF";

  const displayName = user?.user_metadata?.full_name || user?.email || "Usuário";

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 flex w-[268px] flex-col border-r border-[#182235] bg-[linear-gradient(180deg,#07111F_0%,#040B16_100%)]">
      <div className="flex h-full flex-col px-3 py-4">
        {/* Brand */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mb-5 flex items-center gap-3 rounded-[22px] border border-[#243754] bg-[linear-gradient(180deg,rgba(19,31,52,0.96)_0%,rgba(9,18,34,0.96)_100%)] px-4 py-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-[#2E4A72] hover:bg-[linear-gradient(180deg,rgba(22,35,58,1)_0%,rgba(11,21,39,1)_100%)]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-[#31507D] bg-[linear-gradient(180deg,#162847_0%,#102037_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <img src={logo} alt="ReceitaFlow" className="h-5 w-5 object-contain" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="truncate text-[15px] font-semibold text-[#F5F7FB]">ReceitaFlow</span>
              <span className="rounded-full border border-[#2C537D] bg-[linear-gradient(180deg,#183452_0%,#14304A_100%)] px-2 py-0.5 text-[10px] font-semibold text-[#8FD1FF]">
                Pro
              </span>
            </div>
            <p className="line-clamp-2 text-left text-[13px] leading-[1.35] text-[#7D8CA3]">
              Plataforma de conciliação financeira e fiscal
            </p>
          </div>
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto pr-1">
          <div className="space-y-6">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#60708A]">
                  {section.label}
                </p>

                <div className="space-y-2">
                  {section.items.map((item) => {
                    const active = isActive(item.path);

                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className={`group relative flex w-full items-center gap-3 rounded-[16px] border px-3 py-3 text-left transition-all duration-200 ${
                          active
                            ? "border-[#315994] bg-[linear-gradient(180deg,rgba(40,58,90,0.96)_0%,rgba(25,39,66,0.96)_100%)] shadow-[0_8px_22px_rgba(9,18,33,0.30),inset_0_1px_0_rgba(255,255,255,0.05)]"
                            : "border-transparent bg-transparent hover:border-[#1A2B44] hover:bg-[rgba(16,27,45,0.55)]"
                        }`}
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border transition-all duration-200 ${
                            active
                              ? "border-[#294A78] bg-[linear-gradient(180deg,#12233C_0%,#0C182B_100%)] text-[#D7E7FF]"
                              : "border-[#0E1A2A] bg-[linear-gradient(180deg,#0C1727_0%,#09111D_100%)] text-[#8E9AB0] group-hover:border-[#213554] group-hover:text-[#C7D2E4]"
                          }`}
                        >
                          <item.icon className={`h-[18px] w-[18px] ${item.path === "/em-andamento" ? "stroke-[1.8]" : ""}`} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`truncate text-[15px] font-semibold ${
                                active ? "text-[#F5F7FB]" : "text-[#B5C0D0] group-hover:text-[#E7EDF7]"
                              }`}
                            >
                              {item.title}
                            </span>

                            {item.showBadge && historyCount > 0 && (
                              <span
                                className={`inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                                  active
                                    ? "border border-[#40669A] bg-[#20395D] text-[#CFE5FF]"
                                    : "bg-[#3D2A08] text-[#E2A52B]"
                                }`}
                              >
                                {historyCount}
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-0.5 truncate text-[12.5px] ${
                              active ? "text-[#8EA0BA]" : "text-[#6E7E97] group-hover:text-[#8E9CB2]"
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="mt-5 pt-4">
          <div className="rounded-[18px] border border-[#223754] bg-[linear-gradient(180deg,rgba(11,20,35,0.96)_0%,rgba(7,14,26,0.96)_100%)] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#1D3153_0%,#15253E_100%)] text-[13px] font-bold text-[#C9DCF9]">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#F5F7FB]">{displayName}</p>
                <div className="mt-1 inline-flex items-center rounded-full border border-[#1E5D43] bg-[#113322] px-2 py-0.5 text-[10px] font-semibold text-[#6EE7A8]">
                  Administrador
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-[#91A0B7] transition-all duration-200 hover:bg-[rgba(27,42,66,0.75)] hover:text-[#F3F7FD]"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;