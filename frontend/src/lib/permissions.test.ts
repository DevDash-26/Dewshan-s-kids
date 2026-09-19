import { describe, expect, it } from 'vitest'
import { hasPermission, isStaffOrAdmin } from './permissions'

describe('permissions', () => {
  it('denies students every management permission', () => {
    expect(hasPermission('STUDENT', 'content:manage')).toBe(false)
    expect(hasPermission('STUDENT', 'room:manage')).toBe(false)
    expect(hasPermission('STUDENT', 'booking:decide')).toBe(false)
  })

  it('grants domain permissions only to the matching staff role', () => {
    expect(hasPermission('ACADEMIC', 'support:manage')).toBe(true)
    expect(hasPermission('ACADEMIC', 'room:manage')).toBe(false)
    expect(hasPermission('FACILITIES', 'room:manage')).toBe(true)
    expect(hasPermission('FINANCE', 'event:manage')).toBe(false)
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
    expect(isStaffOrAdmin('ACADEMIC')).toBe(true)
    expect(isStaffOrAdmin('ADMIN')).toBe(true)
    expect(isStaffOrAdmin(undefined)).toBe(false)
  })
})
