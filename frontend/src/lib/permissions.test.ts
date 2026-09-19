import { describe, expect, it } from 'vitest'
import { hasPermission, isStaffOrAdmin } from './permissions'

describe('permissions (BR12: staff role/department differentiation)', () => {
  it('denies students every management permission regardless of department', () => {
    expect(hasPermission('STUDENT', null, 'booking:decide')).toBe(false)
    expect(hasPermission('STUDENT', 'ADMINISTRATIVE', 'booking:decide')).toBe(false)
    expect(hasPermission('STUDENT', null, 'room:manage')).toBe(false)
  })

  it('denies staff a permission outside their own department', () => {
    expect(hasPermission('STAFF', 'ACADEMIC', 'booking:decide')).toBe(false)
    expect(hasPermission('STAFF', 'SOCIETY', 'support:manage')).toBe(false)
    expect(hasPermission('STAFF', 'ADMINISTRATIVE', 'support:manage')).toBe(false)
  })

  it('grants staff exactly the permissions their department owns', () => {
    expect(hasPermission('STAFF', 'ACADEMIC', 'support:manage')).toBe(true)
    expect(hasPermission('STAFF', 'SOCIETY', 'society:manage')).toBe(true)
    expect(hasPermission('STAFF', 'ADMINISTRATIVE', 'booking:decide')).toBe(true)
    expect(hasPermission('STAFF', 'ADMINISTRATIVE', 'feedback:manage')).toBe(true)
    expect(hasPermission('STAFF', 'ADMINISTRATIVE', 'facility:manage')).toBe(true)
  })

  it('never grants room or user management to staff, in any department', () => {
    expect(hasPermission('STAFF', 'ADMINISTRATIVE', 'room:manage')).toBe(false)
    expect(hasPermission('STAFF', 'ADMINISTRATIVE', 'user:manage')).toBe(false)
  })

  it('denies staff with no department assigned every department-gated permission', () => {
    expect(hasPermission('STAFF', null, 'booking:decide')).toBe(false)
    expect(hasPermission('STAFF', null, 'support:manage')).toBe(false)
  })

  it('grants admin every permission regardless of department', () => {
    expect(hasPermission('ADMIN', null, 'room:manage')).toBe(true)
    expect(hasPermission('ADMIN', null, 'user:manage')).toBe(true)
    expect(hasPermission('ADMIN', null, 'booking:decide')).toBe(true)
    expect(hasPermission('ADMIN', null, 'support:manage')).toBe(true)
  })

  it('treats an undefined role as having no permissions', () => {
    expect(hasPermission(undefined, undefined, 'booking:decide')).toBe(false)
  })

  it('isStaffOrAdmin distinguishes staff/admin from students', () => {
    expect(isStaffOrAdmin('STUDENT')).toBe(false)
    expect(isStaffOrAdmin('STAFF')).toBe(true)
    expect(isStaffOrAdmin('ADMIN')).toBe(true)
    expect(isStaffOrAdmin(undefined)).toBe(false)
  })
})
