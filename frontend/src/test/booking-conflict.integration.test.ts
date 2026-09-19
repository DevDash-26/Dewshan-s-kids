import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc, type Firestore } from 'firebase/firestore'
import { decideBooking } from '../lib/collections'

// Exercises the ACTUAL decideBooking function (not a reimplementation) with
// its Firestore instance swapped for an isolated rules-unit-testing project,
// against the real Firestore emulator - so this is real transaction and
// rules behaviour, not a mock. Covers BR8's approval-time conflict gap
// found during audit: previously, two overlapping PENDING bookings for the
// same room/time could both be approved with zero warning.

let testEnv: RulesTestEnvironment
let staffDb: Firestore

const __dirname = dirname(fileURLToPath(import.meta.url))
const RULES_PATH = resolve(__dirname, '../../../firebase/firestore.rules')

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'ucl-one-demo-booking-test',
    firestore: { rules: readFileSync(RULES_PATH, 'utf8'), host: '127.0.0.1', port: 8080 },
  })
  staffDb = testEnv.authenticatedContext('staff-admin').firestore() as unknown as Firestore
})

afterAll(async () => {
  await testEnv.cleanup()
})

async function seedBooking(id: string, overrides: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'roomBookings', id), {
      roomId: 'r1',
      roomName: 'Room 1',
      requestedBy: 'student-1',
      requestedByName: 'Student One',
      purpose: 'Study',
      date: '2026-10-01',
      status: 'PENDING',
      decidedBy: null,
      decidedAt: null,
      ...overrides,
    })
  })
}

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', 'staff-admin'), { uid: 'staff-admin', role: 'STAFF', staffDepartment: 'ADMINISTRATIVE' })
  })
})

describe('decideBooking approval-time conflict check (BR8)', () => {
  it('approves when there is no conflicting approved booking', async () => {
    await seedBooking('target', { startTime: '09:00', endTime: '10:00' })
    await expect(decideBooking('target', 'APPROVED', 'staff-admin', staffDb)).resolves.toBeUndefined()
  })

  it('blocks approval on an exact time overlap with an already-approved booking', async () => {
    await seedBooking('other', { startTime: '09:00', endTime: '10:00', status: 'APPROVED' })
    await seedBooking('target', { startTime: '09:00', endTime: '10:00' })
    await expect(decideBooking('target', 'APPROVED', 'staff-admin', staffDb)).rejects.toThrow(/overlaps/i)
  })

  it('blocks approval on a partial time overlap with an already-approved booking', async () => {
    await seedBooking('other', { startTime: '09:00', endTime: '10:00', status: 'APPROVED' })
    await seedBooking('target', { startTime: '09:30', endTime: '10:30' })
    await expect(decideBooking('target', 'APPROVED', 'staff-admin', staffDb)).rejects.toThrow(/overlaps/i)
  })

  it('approves an adjacent, non-overlapping booking (back-to-back is not a conflict)', async () => {
    await seedBooking('other', { startTime: '09:00', endTime: '10:00', status: 'APPROVED' })
    await seedBooking('target', { startTime: '10:00', endTime: '11:00' })
    await expect(decideBooking('target', 'APPROVED', 'staff-admin', staffDb)).resolves.toBeUndefined()
  })

  it('approves an overlapping time in a different room (no cross-room conflict)', async () => {
    await seedBooking('other', { roomId: 'r2', startTime: '09:00', endTime: '10:00', status: 'APPROVED' })
    await seedBooking('target', { roomId: 'r1', startTime: '09:00', endTime: '10:00' })
    await expect(decideBooking('target', 'APPROVED', 'staff-admin', staffDb)).resolves.toBeUndefined()
  })

  it('rejects approval by staff outside the ADMINISTRATIVE department (BR12 + BR8 combined enforcement)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'staff-academic'), { uid: 'staff-academic', role: 'STAFF', staffDepartment: 'ACADEMIC' })
    })
    const academicDb = testEnv.authenticatedContext('staff-academic').firestore() as unknown as Firestore
    await seedBooking('target', { startTime: '09:00', endTime: '10:00' })
    await expect(decideBooking('target', 'APPROVED', 'staff-academic', academicDb)).rejects.toThrow()
  })
})
