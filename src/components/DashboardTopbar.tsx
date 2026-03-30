import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Menu } from "lucide-react";

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
    <div className="sticky top-0 z-40 pt-3 pb-0">
      <div className="px-4">
        <div
          className="h-12 rounded-[20px] border border-white/[0.07] px-3 md:px-5 shadow-[0_18px_45px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300"
          style={{
            background:
              "linear-gradient(180deg, rgba(34,34,37,0.64) 0%, rgba(24,24,27,0.46) 100%)",
            backdropFilter: "blur(18px) saturate(1.35)",
            WebkitBackdropFilter: "blur(18px) saturate(1.35)",
          }}
        >
          <div className="flex h-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center">
              <button
                onClick={onMenuToggle}
                className="mr-2 flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-all duration-200 hover:translate-y-0 hover:border-white/8 hover:bg-white/[0.045] hover:text-foreground active:translate-y-0 active:scale-[0.98] md:hidden"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>

              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(250,199,117,0.18) 0%, rgba(250,199,117,0.08) 100%)",
                  }}
                >
                  <span className="text-sm leading-none" style={{ color: "#FAC775" }}>
                    ⬡
                  </span>
                </div>

                <div className="flex items-baseline gap-0.5">
                  <span
                    className="text-sm font-semibold tracking-[-0.02em]"
                    style={{ color: "#F5F5F0" }}
                  >
                    Receita
                  </span>
                  <span
                    className="text-sm font-semibold tracking-[-0.02em]"
                    style={{ color: "#FAC775" }}
                  >
                    Flow
                  </span>
                </div>
              </div>

              {company && (
                <>
                  <div
                    className="mx-3 h-5 w-px md:mx-4"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
                    }}
                  />

                  <div className="flex min-w-0 items-center">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="h-7 max-w-[140px] object-contain object-left"
                      />
                    ) : (
                      <span
                        className="block max-w-[160px] truncate text-[12px] font-medium tracking-[-0.01em]"
                        style={{ color: "#A4A39D" }}
                      >
                        {company.name}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="pointer-events-none hidden h-7 items-center rounded-full border border-white/[0.05] bg-white/[0.025] px-3 text-[11px] font-medium tracking-[-0.01em] text-white/45 md:flex">
              Sistema ativo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTopbar;