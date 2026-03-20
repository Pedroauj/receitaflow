import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { type AppPermission, type AppRole, resolveRolePermissions } from "@/lib/permissions";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole;
  permissions: AppPermission[];
  hasPermission: (permission: AppPermission) => boolean;
  hasAnyPermission: (permissions: AppPermission[]) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: "user",
  permissions: [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  active: boolean | null;
};

type PermissionRow = {
  user_id: string;
  module_key: string;
  can_view: boolean | null;
  can_edit: boolean | null;
};

const parseRole = (value: string | null | undefined): AppRole => {
  if (value === "master" || value === "admin" || value === "user") {
    return value;
  }

  return "user";
};

const buildPermissions = (rows: PermissionRow[]): AppPermission[] => {
  const result = new Set<string>();

  for (const row of rows) {
    const moduleKey = row.module_key?.trim();

    if (!moduleKey) continue;

    if (row.can_view) {
      result.add(`${moduleKey}.view`);
    }

    if (row.can_edit) {
      result.add(`${moduleKey}.edit`);
    }
  }

  return Array.from(result) as AppPermission[];
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole>("user");
  const [permissions, setPermissions] = useState<AppPermission[]>([]);

  const loadAuthorizationData = async (currentUser: User | null) => {
    if (!currentUser) {
      setRole("user");
      setPermissions([]);
      return;
    }

    const profileResult = await supabase
      .from("profiles")
      .select("id, email, full_name, role, active")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileResult.error) {
      console.error("Erro ao buscar perfil do usuário:", profileResult.error);
      setRole("user");
      setPermissions([]);
      return;
    }

    const permissionsResult = await supabase
      .from("user_module_permissions")
      .select("user_id, module_key, can_view, can_edit")
      .eq("user_id", currentUser.id);

    if (permissionsResult.error) {
      console.error("Erro ao buscar permissões do usuário:", permissionsResult.error);
    }

    const profile = (profileResult.data ?? null) as ProfileRow | null;
    const permissionRows = (permissionsResult.data ?? []) as PermissionRow[];

    const nextRole = parseRole(profile?.role);

    setRole(nextRole);

    if (nextRole === "master") {
      setPermissions(resolveRolePermissions("master"));
      return;
    }

    setPermissions(buildPermissions(permissionRows));
  };

  useEffect(() => {
    let mounted = true;

    const syncSession = async (nextSession: Session | null) => {
      if (!mounted) return;

      setLoading(true);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      await loadAuthorizationData(nextSession?.user ?? null);

      if (!mounted) return;
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    void supabase.auth.getSession().then(({ data }) => {
      void syncSession(data.session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const hasPermission = (permission: AppPermission) => {
    if (!user) return false;
    if (role === "master") return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: AppPermission[]) => {
    if (!user) return false;
    if (role === "master") return true;
    return requiredPermissions.some((permission) => permissions.includes(permission));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole("user");
    setPermissions([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        permissions,
        hasPermission,
        hasAnyPermission,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};