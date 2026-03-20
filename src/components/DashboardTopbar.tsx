import { useEffect, useState } from "react";
import { Hexagon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
}

const DashboardTopbar = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadCompany = async () => {
      // Get user's company_id from profile
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
    <div
      className="h-12 border-b border-border flex items-center px-6 shrink-0"
      style={{ background: "#1E1E20" }}
    >
      {/* ReceitaFlow branding */}
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 rounded-md flex items-center justify-center"
          style={{ background: "#412402" }}
        >
          <Hexagon className="h-4 w-4" style={{ color: "#BA7517" }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: "#F5F5F0" }}>
          Receita<span style={{ color: "#FAC775" }}>Flow</span>
        </span>
      </div>

      {/* Divider + Company logo */}
      {company && (
        <>
          <div
            className="h-5 w-px mx-4"
            style={{ background: "#2C2C2A" }}
          />
          <div className="flex items-center gap-2.5">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-7 max-w-[120px] object-contain"
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
  );
};

export default DashboardTopbar;
