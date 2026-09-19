import { describe, expect, it } from 'vitest';
import { validateBooking, validateRequired } from './validation';

describe('booking validation', () => {
  it('rejects reversed time ranges', () => expect(validateBooking('2026-09-24', '16:00', '14:00')).toContain('after'));
  it('rejects dates in the past', () => expect(validateBooking('2026-09-18', '14:00', '16:00', '2026-09-19')).toContain('future'));
  it('accepts a valid future booking', () => expect(validateBooking('2026-09-24', '14:00', '16:00', '2026-09-19')).toBeNull());
});

describe('required field validation', () => {
  it('rejects empty fields', () => expect(validateRequired(' ', 'Title')).toContain('required'));
  it('accepts a concise field', () => expect(validateRequired('Study group', 'Title')).toBeNull());
});
