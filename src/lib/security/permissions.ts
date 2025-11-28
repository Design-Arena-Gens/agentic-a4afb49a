export const PERMISSIONS = {
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_ROLES: 'MANAGE_ROLES',
  MANAGE_PRODUCTS: 'MANAGE_PRODUCTS',
  VIEW_PRODUCTS: 'VIEW_PRODUCTS',
  CREATE_SALE: 'CREATE_SALE',
  VIEW_SALES: 'VIEW_SALES',
  DELETE_SALE: 'DELETE_SALE',
  CREATE_PURCHASE: 'CREATE_PURCHASE',
  VIEW_PURCHASES: 'VIEW_PURCHASES',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_LABELS: Record<string, string> = {
  SUPER_USER: 'Super User',
  ADMIN: 'Administrator',
  NORMAL_USER: 'Normal User',
  CASHIER: 'Cashier',
};

export const ROLE_COLORS: Record<string, string> = {
  SUPER_USER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  NORMAL_USER: 'bg-green-100 text-green-800',
  CASHIER: 'bg-amber-100 text-amber-800',
};

export const DEFAULT_ROLE_ORDER = ['SUPER_USER', 'ADMIN', 'NORMAL_USER', 'CASHIER'];
