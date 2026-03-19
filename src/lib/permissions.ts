export type AppRole = "master" | "admin" | "user";

export type AppPermission =
  | "dashboard.view"
  | "historico.view"
  | "andamento.view"
  | "conciliacao.view"
  | "clientes.view"
  | "configuracoes.view"
  | "cliente.martin-brower.view"
  | "cliente.minerva.view"
  | "cliente.danone.view"
  | "cliente.platlog.view"
  | "cliente.jbs.view"
  | "cliente.natura.view";

export const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  master: [
    "dashboard.view",
    "historico.view",
    "andamento.view",
    "conciliacao.view",
    "clientes.view",
    "configuracoes.view",
    "cliente.martin-brower.view",
    "cliente.minerva.view",
    "cliente.danone.view",
    "cliente.platlog.view",
    "cliente.jbs.view",
    "cliente.natura.view",
  ],
  admin: [
    "dashboard.view",
    "historico.view",
    "andamento.view",
    "conciliacao.view",
    "clientes.view",
    "configuracoes.view",
    "cliente.martin-brower.view",
    "cliente.minerva.view",
    "cliente.danone.view",
    "cliente.platlog.view",
    "cliente.jbs.view",
    "cliente.natura.view",
  ],
  user: [
    "dashboard.view",
    "historico.view",
    "andamento.view",
    "conciliacao.view",
    "clientes.view",
  ],
};

export const isAppRole = (value: unknown): value is AppRole => {
  return value === "master" || value === "admin" || value === "user";
};

export const isAppPermission = (value: unknown): value is AppPermission => {
  return typeof value === "string";
};

export const normalizePermissions = (permissions: unknown): AppPermission[] => {
  if (!Array.isArray(permissions)) return [];
  return permissions.filter(isAppPermission);
};

export const resolveRolePermissions = (role: AppRole): AppPermission[] => {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.user;
};