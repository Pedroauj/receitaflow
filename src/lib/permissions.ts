export type AppRole = "master" | "admin" | "user";

export type AppPermission =
  | "dashboard.view"
  | "dashboard.edit"
  | "historico.view"
  | "historico.edit"
  | "andamento.view"
  | "andamento.edit"
  | "conciliacao.view"
  | "conciliacao.edit"
  | "clientes.view"
  | "clientes.edit"
  | "configuracoes.view"
  | "configuracoes.edit"
  | "cliente.martin-brower.view"
  | "cliente.martin-brower.edit"
  | "cliente.minerva.view"
  | "cliente.minerva.edit"
  | "cliente.danone.view"
  | "cliente.danone.edit"
  | "cliente.platlog.view"
  | "cliente.platlog.edit"
  | "cliente.jbs.view"
  | "cliente.jbs.edit"
  | "cliente.natura.view"
  | "cliente.natura.edit";

export const ALL_PERMISSIONS: AppPermission[] = [
  "dashboard.view",
  "dashboard.edit",
  "historico.view",
  "historico.edit",
  "andamento.view",
  "andamento.edit",
  "conciliacao.view",
  "conciliacao.edit",
  "clientes.view",
  "clientes.edit",
  "configuracoes.view",
  "configuracoes.edit",
  "cliente.martin-brower.view",
  "cliente.martin-brower.edit",
  "cliente.minerva.view",
  "cliente.minerva.edit",
  "cliente.danone.view",
  "cliente.danone.edit",
  "cliente.platlog.view",
  "cliente.platlog.edit",
  "cliente.jbs.view",
  "cliente.jbs.edit",
  "cliente.natura.view",
  "cliente.natura.edit",
];

export const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  master: [...ALL_PERMISSIONS],
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
  return typeof value === "string" && ALL_PERMISSIONS.includes(value as AppPermission);
};

export const normalizePermissions = (permissions: unknown): AppPermission[] => {
  if (!Array.isArray(permissions)) return [];
  return permissions.filter(isAppPermission);
};

export const resolveRolePermissions = (role: AppRole): AppPermission[] => {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.user;
};