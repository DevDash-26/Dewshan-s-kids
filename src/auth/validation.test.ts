import { describe, expect, it } from 'vitest';
import { isUclEmail, validatePassword } from './validation';

describe('UCL email validation', () => {
  it('accepts the exact UCL domain case-insensitively', () => {
    expect(isUclEmail('Student@UCL.LK')).toBe(true);
    expect(isUclEmail('john.perera@ucl.lk')).toBe(true);
  });
  it('rejects lookalike or external domains', () => {
    expect(isUclEmail('student@gmail.com')).toBe(false);
    expect(isUclEmail('student@ucl.lk.fake.com')).toBe(false);
    expect(isUclEmail('student@ucl.com')).toBe(false);
  });
});

describe('password validation', () => {
  it('requires a strong password', () => {
    expect(validatePassword('password')).toContain('uppercase');
    expect(validatePassword('UclPass123')).toBeNull();
  });
});
