export const ROLES = [
  'administrator',
  'board',
  'commercial',
  'estimator',
  'contract_manager',
  'finance',
  'viewer',
] as const;

export type RoleSlug = (typeof ROLES)[number];

export const PERMISSIONS = [
  'dashboard.read',
  'customers.read',
  'customers.write',
  'customers.delete',
  'equipment.read',
  'equipment.write',
  'equipment.delete',
  'prices.write',
  'quotes.read',
  'quotes.write',
  'quotes.approve',
  'quotes.delete',
  'contracts.read',
  'contracts.write',
  'contracts.sign',
  'contracts.delete',
  'leads.read',
  'leads.write',
  'finance.read',
  'settings.read',
  'settings.write',
  'users.read',
  'users.write',
  'audit.read',
  'documents.read',
  'documents.write',
  'whatsapp.send',
] as const;

export type PermissionSlug = (typeof PERMISSIONS)[number];

export const ROLE_LABELS: Record<RoleSlug, string> = {
  administrator: 'Administrador',
  board: 'Diretoria',
  commercial: 'Comercial',
  estimator: 'Orçamentista',
  contract_manager: 'Gestor de contratos',
  finance: 'Financeiro',
  viewer: 'Consulta',
};

export const ROLE_PERMISSIONS: Record<RoleSlug, PermissionSlug[]> = {
  administrator: [...PERMISSIONS],
  board: PERMISSIONS.filter((permission) => permission !== 'users.write'),
  commercial: [
    'dashboard.read',
    'customers.read',
    'customers.write',
    'equipment.read',
    'quotes.read',
    'quotes.write',
    'contracts.read',
    'leads.read',
    'leads.write',
    'documents.read',
    'documents.write',
    'whatsapp.send',
  ],
  estimator: [
    'dashboard.read',
    'customers.read',
    'equipment.read',
    'quotes.read',
    'quotes.write',
    'quotes.approve',
    'contracts.read',
    'leads.read',
    'documents.read',
    'documents.write',
    'whatsapp.send',
  ],
  contract_manager: [
    'dashboard.read',
    'customers.read',
    'equipment.read',
    'quotes.read',
    'contracts.read',
    'contracts.write',
    'contracts.sign',
    'documents.read',
    'documents.write',
    'whatsapp.send',
  ],
  finance: [
    'dashboard.read',
    'customers.read',
    'equipment.read',
    'quotes.read',
    'contracts.read',
    'finance.read',
    'documents.read',
  ],
  viewer: [
    'dashboard.read',
    'customers.read',
    'equipment.read',
    'quotes.read',
    'contracts.read',
    'leads.read',
    'documents.read',
  ],
};

export function hasPermission(
  permissions: readonly string[] | null | undefined,
  required: PermissionSlug | PermissionSlug[],
): boolean {
  if (!permissions?.length) return false;
  const needed = Array.isArray(required) ? required : [required];
  return needed.every((permission) => permissions.includes(permission));
}

export function hasAnyPermission(
  permissions: readonly string[] | null | undefined,
  required: PermissionSlug[],
): boolean {
  if (!permissions?.length) return false;
  return required.some((permission) => permissions.includes(permission));
}
