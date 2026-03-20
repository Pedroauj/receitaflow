import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Users, Shield, ShieldOff, Search } from "lucide-react";
import { motion } from "framer-motion";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  role: string;
  active: boolean;
  created_at: string;
}

const Usuarios = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    checkMasterAndLoad();
  }, [user]);

  const checkMasterAndLoad = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "master") {
      setIsMaster(false);
      setLoading(false);
      return;
    }

    setIsMaster(true);
    await loadProfiles();
  };

  const loadProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar usuários", description: error.message, variant: "destructive" });
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const toggleRole = async (profile: Profile) => {
    if (profile.email === "pedraljoao5@gmail.com") return;
    setUpdating(profile.id);
    const newRole = profile.role === "master" ? "user" : "master";
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, role: newRole } : p)));
      toast({ title: `Papel alterado para ${newRole === "master" ? "Admin" : "Usuário"}` });
    }
    setUpdating(null);
  };

  const toggleActive = async (profile: Profile) => {
    if (profile.email === "pedraljoao5@gmail.com") return;
    setUpdating(profile.id);
    const { error } = await supabase
      .from("profiles")
      .update({ active: !profile.active })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, active: !p.active } : p))
      );
      toast({ title: profile.active ? "Usuário desativado" : "Usuário ativado" });
    }
    setUpdating(null);
  };

  if (isMaster === false) return <Navigate to="/dashboard" replace />;

  const filtered = profiles.filter(
    (p) =>
      (p.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.full_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.display_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Gestão de Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie permissões e acessos dos usuários do sistema.
        </p>
      </div>

      {/* Search + count */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} usuário{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl border border-border overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
                    Usuário
                  </th>
                  <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
                    Email
                  </th>
                  <th className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
                    Papel
                  </th>
                  <th className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
                    Status
                  </th>
                  <th className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((profile) => {
                  const isSelf = profile.email === "pedraljoao5@gmail.com";
                  const initials = (profile.full_name || profile.display_name || profile.email || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={profile.id}
                      className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors duration-150"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[11px] font-semibold text-primary">
                            {initials}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {profile.full_name || profile.display_name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {profile.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                            profile.role === "master"
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {profile.role === "master" ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <Users className="h-3 w-3" />
                          )}
                          {profile.role === "master" ? "Admin" : "Usuário"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium ${
                            profile.active
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {profile.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="text-[11px] text-muted-foreground/50 flex justify-center">
                            Protegido
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleRole(profile)}
                              disabled={updating === profile.id}
                              className="h-7 px-2.5 rounded-md text-[11px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                              title={
                                profile.role === "master"
                                  ? "Rebaixar para Usuário"
                                  : "Promover a Admin"
                              }
                            >
                              {profile.role === "master" ? (
                                <ShieldOff className="h-3.5 w-3.5" />
                              ) : (
                                <Shield className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleActive(profile)}
                              disabled={updating === profile.id}
                              className={`h-7 px-2.5 rounded-md text-[11px] font-medium border transition-colors disabled:opacity-50 ${
                                profile.active
                                  ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                                  : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              }`}
                            >
                              {profile.active ? "Desativar" : "Ativar"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Usuarios;
