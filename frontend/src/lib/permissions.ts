import type { Role, StaffDepartment } from '../types/models'

// Centralized authorization map. Server-side enforcement lives in
// firestore.rules — this module mirrors it for UI purposes (which tabs to
// show, which buttons to render) only. A permission denied here but allowed
// there (or vice versa) would be a bug; see firestore.rules.test.ts for the
// tests that actually verify the server-side boundary.
//
// BR12 asks for different staff roles to manage different things. Only
// permissions with a real, demonstrable in-app action are department-gated
// here — see firebase/firestore.rules for why FINANCE has no entry (its
// content lives entirely in the Strapi CMS, which has its own admin auth).
export type Permission = 'room:manage' | 'user:manage' | 'booking:decide' | 'support:manage' | 'feedback:manage' | 'facility:manage' | 'society:manage'

const ADMIN_ONLY: Permission[] = ['room:manage', 'user:manage']

const DEPARTMENT_PERMISSIONS: Record<Exclude<StaffDepartment, null>, Permission[]> = {
  ACADEMIC: ['support:manage'],
  SOCIETY: ['society:manage'],
  ADMINISTRATIVE: ['booking:decide', 'feedback:manage', 'facility:manage'],
  FINANCE: [],
}

export function hasPermission(role: Role | undefined, department: StaffDepartment | undefined, permission: Permission): boolean {
  if (role === 'ADMIN') return true
  if (role !== 'STAFF') return false
  if (ADMIN_ONLY.includes(permission)) return false
  if (!department) return false
  return DEPARTMENT_PERMISSIONS[department].includes(permission)
}

export function isStaffOrAdmin(role: Role | undefined): boolean {
  return role === 'STAFF' || role === 'ADMIN'
}
