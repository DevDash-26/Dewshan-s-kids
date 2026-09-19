import type { Role } from '../types/models'

// Centralized authorization map. Server-side enforcement lives in
// The local backend repeats these checks server-side; this map keeps navigation
// and route visibility consistent with the API authorization boundary.
export type Permission =
  | 'content:manage'
  | 'announcement:publish'
  | 'event:manage'
  | 'society:manage'
  | 'room:manage'
  | 'lostfound:manage'
  | 'support:manage'
  | 'user:manage'
  | 'booking:decide'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  STUDENT: [],
  ACADEMIC: ['content:manage', 'announcement:publish', 'support:manage', 'booking:decide'],
  SOCIETY_MANAGER: ['content:manage', 'event:manage', 'society:manage'],
  FINANCE: ['content:manage', 'announcement:publish'],
  ADMINISTRATIVE: ['content:manage', 'announcement:publish', 'event:manage', 'booking:decide'],
  FACILITIES: ['content:manage', 'room:manage', 'lostfound:manage', 'booking:decide'],
  ADMIN: [
    'content:manage',
    'announcement:publish',
    'event:manage',
    'society:manage',
    'room:manage',
    'lostfound:manage',
    'support:manage',
    'user:manage',
    'booking:decide',
  ],
}

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function isStaffOrAdmin(role: Role | undefined): boolean {
  return role !== undefined && role !== 'STUDENT'
}
