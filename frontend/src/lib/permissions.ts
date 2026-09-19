import type { Role } from '../types/models'

// Centralized authorization map. Server-side enforcement lives in
// firestore.rules — this module is the single source of truth the UI reads
// from, so a permission is never "hidden" in one screen but reachable from
// another. See NFR4 / BR12.
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
  STAFF: ['content:manage', 'announcement:publish', 'event:manage', 'society:manage', 'lostfound:manage', 'support:manage', 'booking:decide'],
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
  return role === 'STAFF' || role === 'ADMIN'
}
