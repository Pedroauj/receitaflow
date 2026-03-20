import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, ShieldCheck, ShieldOff, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  full_name: string | null;
  role: string;
  active: boolean;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  master: "Admin",
  user: "Usuário",
};

const roleBadgeClass: Record<string, string> = {
  master: "bg-primary/15 text-primary",
  user: "bg-muted text-muted-foreground",
};

const Usuarios = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMaster, setIsMaster] = useState(false);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
    checkMaster();
  }, []);

  const checkMaster = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("is_master", { _user_id: user.id });
    setIsMaster(!!data);
  };

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Erro ao carregar usuários", description: error.message, variant: "destructive" });
    } else {
      // Fetch emails from auth for each profile
      setProfiles((data as Profile[]) || []);
    }
    setLoading(false);
  };

  const fetchEmails = async (profs: Profile[]) => {
    // emails may be null in profiles, try to fill from auth
    const needsEmail = profs.filter((p) => !p.email);
    if (needsEmail.length === 0) return profs;

    // We can't query auth.users from client, so we rely on profile email
    return profs;
  };

  const handleRoleChange = async (profileId: string, userId: string, newRole: string) => {
    if (userId === user?.id) {
      toast({ title: "Ação não permitida", description: "Você não pode alterar seu próprio papel.", variant: "destructive" });
      return;
    }

    setUpdating(profileId);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profileId);

    if (error) {
      toast({ title: "Erro ao atualizar papel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Papel atualizado", description: `Usuário alterado para ${roleLabels[newRole] || newRole}.` });
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      );
    }
    setUpdating(null);
  };

  const handleToggleActive = async (profileId: string, userId: string, currentActive: boolean) => {
    if (userId === user?.id) {
      toast({ title: "Ação não permitida", description: "Você não pode desativar a si mesmo.", variant: "destructive" });
      return;
    }

    setUpdating(profileId);
    const { error } = await supabase
      .from("profiles")
      .update({ active: !currentActive })
      .eq("id", profileId);

    if (error) {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentActive ? "Usuário desativado" : "Usuário ativado" });
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, active: !currentActive } : p))
      );
    }
    setUpdating(null);
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.display_name || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.full_name || "").toLowerCase().includes(q)
    );
  });

  if (!isMaster && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <h2 className="text-base font-medium text-foreground">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Apenas administradores podem gerenciar usuários.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Usuários</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie os usuários e permissões do sistema
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{profiles.length} usuário{profiles.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm bg-card border-border"
        />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "280px" }} />
                <col style={{ width: "240px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "140px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
                    Usuário
                  </th>
                  <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
                    Email
                  </th>
                  <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((profile) => {
                    const isCurrentUser = profile.user_id === user?.id;
                    const initials = (profile.display_name || profile.email || "?")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={profile.id}
                        className={`border-b border-border/50 transition-colors hover:bg-accent/30 ${
                          !profile.active ? "opacity-50" : ""
                        }`}
                      >
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[11px] font-semibold text-primary">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {profile.display_name || profile.full_name || "Sem nome"}
                              </p>
                              {isCurrentUser && (
                                <span className="text-[10px] text-primary">Você</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground truncate block">
                            {profile.email || "—"}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md ${
                              roleBadgeClass[profile.role] || roleBadgeClass.user
                            }`}
                          >
                            {profile.role === "master" ? (
                              <ShieldCheck className="h-3 w-3" />
                            ) : (
                              <Shield className="h-3 w-3" />
                            )}
                            {roleLabels[profile.role] || profile.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              profile.active ? "bg-emerald-500" : "bg-red-400"
                            }`}
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isCurrentUser ? (
                              <>
                                <Select
                                  value={profile.role}
                                  onValueChange={(v) =>
                                    handleRoleChange(profile.id, profile.user_id, v)
                                  }
                                  disabled={updating === profile.id}
                                >
                                  <SelectTrigger className="h-7 w-[90px] text-[11px] bg-card border-border">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">Usuário</SelectItem>
                                    <SelectItem value="master">Admin</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        handleToggleActive(
                                          profile.id,
                                          profile.user_id,
                                          profile.active
                                        )
                                      }
                                      disabled={updating === profile.id}
                                    >
                                      {profile.active ? (
                                        <ShieldOff className="h-3.5 w-3.5 text-muted-foreground" />
                                      ) : (
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {profile.active ? "Desativar" : "Ativar"}
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Usuarios;
