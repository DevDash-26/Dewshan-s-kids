import { describe, expect, it } from 'vitest';
import { hasAnyRole, hasPermission } from './permissions';

describe('role permissions', () => {
  it('keeps students out of management permissions', () => {
    expect(hasPermission('student', 'manage_users')).toBe(false);
    expect(hasPermission('student', 'manage_finance')).toBe(false);
    expect(hasPermission('student', 'submit_requests')).toBe(true);
  });

  it('gives each staff role only its domain management permission', () => {
    expect(hasPermission('academic', 'manage_academic')).toBe(true);
    expect(hasPermission('academic', 'manage_finance')).toBe(false);
    expect(hasPermission('society_manager', 'manage_societies')).toBe(true);
    expect(hasPermission('facilities', 'manage_facilities')).toBe(true);
  });

  it('gives admin all management permissions', () => {
    expect(hasPermission('admin', 'manage_users')).toBe(true);
    expect(hasAnyRole('admin', ['admin'])).toBe(true);
  });
});
