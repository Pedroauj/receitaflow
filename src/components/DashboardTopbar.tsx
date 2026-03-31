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
          className="h-14 rounded-[22px] border px-3 md:px-5 shadow-[0_20px_55px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300"
          style={{
            borderColor: "rgba(255,255,255,0.07)",
            background:
              "linear-gradient(180deg, rgba(20,20,23,0.78) 0%, rgba(13,13,15,0.68) 100%)",
            backdropFilter: "blur(20px) saturate(1.25)",
            WebkitBackdropFilter: "blur(20px) saturate(1.25)",
          }}
        >
          <div className="flex h-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center">
              <button
                onClick={onMenuToggle}
                className="mr-2 flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-white/55 transition-all duration-200 hover:translate-y-0 hover:border-white/10 hover:bg-white/[0.045] hover:text-white active:translate-y-0 active:scale-[0.98] md:hidden"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>

              <div className="flex items-center gap-2.5">
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-[13px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.22)]"
                  style={{
                    borderColor: "rgba(212, 175, 55, 0.16)",
                    background:
                      "linear-gradient(180deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.07) 100%)",
                  }}
                >
                  <span
                    className="absolute inset-0 rounded-[13px] opacity-80"
                    style={{
                      background:
                        "radial-gradient(circle at top, rgba(255,255,255,0.10), transparent 58%)",
                    }}
                  />
                  <span className="relative text-sm leading-none" style={{ color: "#D4AF37" }}>
                    ⬡
                  </span>
                </div>

                <div className="flex items-baseline gap-0.5">
                  <span
                    className="text-[15px] font-semibold tracking-[-0.03em]"
                    style={{ color: "#F7F7F2" }}
                  >
                    Receita
                  </span>
                  <span
                    className="text-[15px] font-semibold tracking-[-0.03em]"
                    style={{ color: "#D4AF37" }}
                  >
                    Flow
                  </span>
                </div>
              </div>

              {company && (
                <>
                  <div
                    className="mx-3 h-6 w-px md:mx-4"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(255,255,255,0.12), rgba(255,255,255,0.02))",
                    }}
                  />

                  <div className="min-w-0">
                    <div
                      className="flex min-w-0 items-center rounded-full border px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      style={{
                        borderColor: "rgba(255,255,255,0.06)",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={company.name}
                          className="h-5 max-w-[120px] object-contain object-left opacity-95"
                        />
                      ) : (
                        <span
                          className="block max-w-[180px] truncate text-[12px] font-medium tracking-[-0.01em]"
                          style={{ color: "#B6B2AA" }}
                        >
                          {company.name}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div
              className="pointer-events-none hidden h-8 items-center rounded-full border px-3.5 text-[11px] font-medium tracking-[0.01em] md:flex"
              style={{
                color: "#D8C08A",
                borderColor: "rgba(212,175,55,0.12)",
                background:
                  "linear-gradient(180deg, rgba(212,175,55,0.10) 0%, rgba(212,175,55,0.04) 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              Sistema ativo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTopbar;