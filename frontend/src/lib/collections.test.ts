import { describe, expect, it } from 'vitest'
import { DEFAULT_ROOMS, timeRangesOverlap } from './collections'

describe('timeRangesOverlap (BR8 classroom booking conflict detection)', () => {
  it('detects a fully overlapping range', () => {
    expect(timeRangesOverlap('09:00', '10:00', '09:30', '09:45')).toBe(true)
  })

  it('detects a partially overlapping range', () => {
    expect(timeRangesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true)
  })

  it('treats back-to-back bookings (no overlap) as free', () => {
    expect(timeRangesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false)
  })

  it('treats fully disjoint ranges as free', () => {
    expect(timeRangesOverlap('09:00', '10:00', '13:00', '14:00')).toBe(false)
  })

  it('detects one range fully containing the other', () => {
    expect(timeRangesOverlap('09:00', '12:00', '10:00', '11:00')).toBe(true)
  })

  it('provides a default room catalogue for availability checks', () => {
    expect(DEFAULT_ROOMS.length).toBeGreaterThan(0)
    expect(DEFAULT_ROOMS.some((room) => room.name.toLowerCase().includes('room'))).toBe(true)
  })
})
