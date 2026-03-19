import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  AppPermission,
  AppRole,
  isAppRole,
  normalizePermissions,
  resolveRolePermissions,
} from "@/lib/permissions";

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

const getRoleFromUser = (user: User | null): AppRole => {
  if (!user) return "user";

  const metaRole = user.user_metadata?.role ?? user.app_metadata?.role;

  if (isAppRole(metaRole)) return metaRole;

  return "user";
};

const getPermissionsFromUser = (user: User | null, role: AppRole): AppPermission[] => {
  if (!user) return [];

  const userMetaPermissions = normalizePermissions(user.user_metadata?.permissions);
  const appMetaPermissions = normalizePermissions(user.app_metadata?.permissions);

  const mergedPermissions = [...new Set([...userMetaPermissions, ...appMetaPermissions])];

  if (role === "master") {
    return resolveRolePermissions("master");
  }

  if (mergedPermissions.length > 0) {
    return mergedPermissions;
  }

  return resolveRolePermissions(role);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const role = useMemo(() => getRoleFromUser(user), [user]);
  const permissions = useMemo(() => getPermissionsFromUser(user, role), [user, role]);

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