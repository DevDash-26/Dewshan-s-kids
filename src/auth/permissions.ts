import type { UserRole } from '../types';

export type Permission =
  | 'view_campus'
  | 'use_ai'
  | 'submit_requests'
  | 'manage_academic'
  | 'manage_societies'
  | 'manage_finance'
  | 'manage_administration'
  | 'manage_facilities'
  | 'manage_users';

const studentPermissions: Permission[] = ['view_campus', 'use_ai', 'submit_requests'];

export const rolePermissions: Record<UserRole, Permission[]> = {
  student: studentPermissions,
  academic: [...studentPermissions, 'manage_academic'],
  society_manager: [...studentPermissions, 'manage_societies'],
  finance: [...studentPermissions, 'manage_finance'],
  administrative: [...studentPermissions, 'manage_administration'],
  facilities: [...studentPermissions, 'manage_facilities'],
  admin: [...studentPermissions, 'manage_academic', 'manage_societies', 'manage_finance', 'manage_administration', 'manage_facilities', 'manage_users'],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  return Boolean(role && rolePermissions[role]?.includes(permission));
}

export function hasAnyRole(role: UserRole | undefined, roles: UserRole[]): boolean {
  return Boolean(role && roles.includes(role));
}

export const staffRoles: UserRole[] = ['academic', 'society_manager', 'finance', 'administrative', 'facilities', 'admin'];
