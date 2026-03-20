import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Menu } from "lucide-react";
import logo from "@/assets/logo.png";

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
    <div className="sticky top-0 z-40 px-3 md:px-4 pt-3 pb-0 md:ml-[240px]">
      <div
        className="h-11 rounded-2xl border border-white/[0.06] flex items-center px-3 md:px-5 shadow-lg shadow-black/20"
        style={{
          background: "rgba(30, 30, 32, 0.45)",
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
        }}
      >
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors mr-2"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* ReceitaFlow branding */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="ReceitaFlow" className="h-7 w-7 rounded-md" />
          <span className="text-sm font-semibold" style={{ color: "#F5F5F0" }}>
            Receita<span style={{ color: "#FAC775" }}>Flow</span>
          </span>
        </div>

        {/* Divider + Company logo */}
        {company && (
          <>
            <div
              className="h-5 w-px mx-3 md:mx-4"
              style={{ background: "#2C2C2A" }}
            />
            <div className="flex items-center gap-2.5">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-5 max-w-[90px] object-contain"
                />
              ) : (
                <span
                  className="text-sm font-medium"
                  style={{ color: "#888780" }}
                >
                  {company.name}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardTopbar;
