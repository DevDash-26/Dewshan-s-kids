import { describe, expect, it } from 'vitest'
import { hasPermission, isStaffOrAdmin } from './permissions'

describe('permissions', () => {
  it('denies students every management permission', () => {
    expect(hasPermission('STUDENT', 'content:manage')).toBe(false)
    expect(hasPermission('STUDENT', 'room:manage')).toBe(false)
    expect(hasPermission('STUDENT', 'booking:decide')).toBe(false)
  })

  it('grants staff content and booking permissions but not room or user management', () => {
    expect(hasPermission('STAFF', 'content:manage')).toBe(true)
    expect(hasPermission('STAFF', 'booking:decide')).toBe(true)
    expect(hasPermission('STAFF', 'room:manage')).toBe(false)
    expect(hasPermission('STAFF', 'user:manage')).toBe(false)
  })

  it('grants admin every permission', () => {
    expect(hasPermission('ADMIN', 'room:manage')).toBe(true)
    expect(hasPermission('ADMIN', 'user:manage')).toBe(true)
  })

  it('treats an undefined role as having no permissions', () => {
    expect(hasPermission(undefined, 'content:manage')).toBe(false)
  })

  it('isStaffOrAdmin distinguishes staff/admin from students', () => {
    expect(isStaffOrAdmin('STUDENT')).toBe(false)
    expect(isStaffOrAdmin('STAFF')).toBe(true)
    expect(isStaffOrAdmin('ADMIN')).toBe(true)
    expect(isStaffOrAdmin(undefined)).toBe(false)
  })
})
