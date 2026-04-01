import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, Building2, Sparkles } from "lucide-react";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
}

interface DashboardTopbarProps {
  onMenuToggle: () => void;
}

const DashboardTopbar = ({ onMenuToggle }: DashboardTopbarProps) => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadCompany = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (profile?.company_id) {
        const { data: comp } = await supabase
          .from("companies")
          .select("id, name, logo_url")
          .eq("id", profile.company_id)
          .single();

        if (comp) setCompany(comp);
      }
    };

    loadCompany();
  }, [user]);

  return (
    <div className="sticky top-0 z-40 px-4 pt-4 pb-0">
      <div
        className="h-14 rounded-[24px] border px-3 md:px-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] transition-all duration-300"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          background: "linear-gradient(180deg, rgba(18,19,23,0.96) 0%, rgba(14,15,18,0.98) 100%)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div className="flex h-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <button
              onClick={onMenuToggle}
              className="mr-1 flex h-9 w-9 items-center justify-center rounded-2xl border text-muted-foreground transition-all duration-200 hover:bg-white/[0.04] hover:text-white active:scale-[0.98] md:hidden"
              style={{
                borderColor: "rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: "rgba(95, 135, 255, 0.22)",
                  background: "linear-gradient(180deg, rgba(70,95,180,0.22) 0%, rgba(45,58,108,0.18) 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <span
                  className="text-sm font-semibold leading-none"
                  style={{ color: "#9CB2FF" }}
                >
                  ⬡
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span
                    className="text-[15px] font-semibold tracking-[-0.03em]"
                    style={{ color: "#F5F7FA" }}
                  >
                    Receita
                  </span>
                  <span
                    className="text-[15px] font-semibold tracking-[-0.03em]"
                    style={{ color: "#8EA6FF" }}
                  >
                    Flow
                  </span>
                </div>

                <p
                  className="mt-1 truncate text-[11px] leading-none"
                  style={{ color: "rgba(255,255,255,0.38)" }}
                >
                  Plataforma operacional
                </p>
              </div>
            </div>

            {company && (
              <>
                <div
                  className="mx-1 hidden h-6 w-px md:block"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(255,255,255,0.01), rgba(255,255,255,0.10), rgba(255,255,255,0.01))",
                  }}
                />

                <div
                  className="hidden min-w-0 items-center gap-2 rounded-2xl border px-3 py-2 md:flex"
                  style={{
                    borderColor: "rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.025)",
                  }}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.58)",
                    }}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="text-[10px] uppercase tracking-[0.16em]"
                      style={{ color: "rgba(255,255,255,0.30)" }}
                    >
                      Empresa
                    </p>

                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="mt-1 h-5 max-w-[140px] object-contain object-left opacity-90"
                      />
                    ) : (
                      <p
                        className="mt-0.5 truncate text-[12px] font-medium"
                        style={{ color: "#D7DBE4" }}
                      >
                        {company.name}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div
            className="hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium md:flex"
            style={{
              borderColor: "rgba(120,146,255,0.16)",
              background: "rgba(120,146,255,0.08)",
              color: "#B8C6FF",
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sistema ativo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTopbar;