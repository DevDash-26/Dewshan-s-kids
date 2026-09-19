import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

// Runs the actual firestore.rules against the local Firestore emulator, so
// these results are real server-side enforcement, not a UI mock (NFR4, BR12).
// Requires the emulator to be running — see package.json `test:rules` script.

let testEnv: RulesTestEnvironment

const __dirname = dirname(fileURLToPath(import.meta.url))
const RULES_PATH = resolve(__dirname, '../../../firebase/firestore.rules')

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'ucl-one-demo-rules-test',
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  // Seed profiles directly, bypassing rules, so tests exercise one rule at a time.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users', 'student-1'), { uid: 'student-1', role: 'STUDENT' })
    await setDoc(doc(db, 'users', 'student-2'), { uid: 'student-2', role: 'STUDENT' })
    await setDoc(doc(db, 'users', 'staff-1'), { uid: 'staff-1', role: 'STAFF' })
    await setDoc(doc(db, 'users', 'admin-1'), { uid: 'admin-1', role: 'ADMIN' })
  })
})

describe('users collection', () => {
  it('allows public signup to create a STUDENT profile for themselves', async () => {
    const authed = testEnv.authenticatedContext('new-student').firestore()
    await assertSucceeds(setDoc(doc(authed, 'users', 'new-student'), { uid: 'new-student', role: 'STUDENT' }))
  })

  it('rejects self-signup with an elevated role (privilege escalation)', async () => {
    const authed = testEnv.authenticatedContext('sneaky-student').firestore()
    await assertFails(setDoc(doc(authed, 'users', 'sneaky-student'), { uid: 'sneaky-student', role: 'ADMIN' }))
  })

  it('rejects a student promoting their own role via update', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(updateDoc(doc(authed, 'users', 'student-1'), { role: 'STAFF' }))
  })

  it('allows a student to read their own profile but not another student\'s', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertSucceeds(getDoc(doc(authed, 'users', 'student-1')))
    await assertFails(getDoc(doc(authed, 'users', 'student-2')))
  })

  it('allows staff to read any student profile', async () => {
    const staffDb = testEnv.authenticatedContext('staff-1').firestore()
    await assertSucceeds(getDoc(doc(staffDb, 'users', 'student-1')))
  })
})

describe('rooms collection (room:manage)', () => {
  it('rejects a student writing a room', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(setDoc(doc(authed, 'rooms', 'r1'), { name: 'Room 1', building: 'A', capacity: 10, features: [] }))
  })

  it('rejects staff (non-admin) writing a room', async () => {
    const staffDb = testEnv.authenticatedContext('staff-1').firestore()
    await assertFails(setDoc(doc(staffDb, 'rooms', 'r1'), { name: 'Room 1', building: 'A', capacity: 10, features: [] }))
  })

  it('allows admin to create a room', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1').firestore()
    await assertSucceeds(setDoc(doc(adminDb, 'rooms', 'r1'), { name: 'Room 1', building: 'A', capacity: 10, features: [] }))
  })
})

describe('roomBookings collection (BR8)', () => {
  it('allows a student to create their own PENDING booking request', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertSucceeds(
      setDoc(doc(authed, 'roomBookings', 'b1'), {
        roomId: 'r1',
        roomName: 'Room 1',
        requestedBy: 'student-1',
        requestedByName: 'Student One',
        purpose: 'Study',
        date: '2026-10-01',
        startTime: '09:00',
        endTime: '10:00',
        status: 'PENDING',
        decidedBy: null,
        decidedAt: null,
      }),
    )
  })

  it('rejects a student creating a booking on someone else\'s behalf', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(
      setDoc(doc(authed, 'roomBookings', 'b2'), {
        roomId: 'r1',
        requestedBy: 'student-2',
        status: 'PENDING',
      }),
    )
  })

  it('rejects a student self-approving a booking (must stay a staff-only action)', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'roomBookings', 'b3'), {
        roomId: 'r1',
        requestedBy: 'student-1',
        status: 'PENDING',
      }),
    )
    await assertFails(updateDoc(doc(authed, 'roomBookings', 'b3'), { status: 'APPROVED' }))
  })

  it('allows staff to approve a pending booking', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'roomBookings', 'b4'), {
        roomId: 'r1',
        requestedBy: 'student-1',
        status: 'PENDING',
      }),
    )
    const staffDb = testEnv.authenticatedContext('staff-1').firestore()
    await assertSucceeds(updateDoc(doc(staffDb, 'roomBookings', 'b4'), { status: 'APPROVED', decidedBy: 'staff-1' }))
  })

  it('allows any signed-in student to read booking records (needed to check room availability, BR8)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'roomBookings', 'b5'), { requestedBy: 'student-2', status: 'PENDING' }),
    )
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertSucceeds(getDoc(doc(authed, 'roomBookings', 'b5')))
  })
})

describe('eventInterests collection (BR4)', () => {
  it('allows a student to record interest in an event under their own id', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertSucceeds(setDoc(doc(authed, 'eventInterests', '5_student-1'), { contentItemId: 5, studentId: 'student-1' }))
  })

  it('rejects a student recording interest on behalf of someone else (deterministic id also prevents duplicates)', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(setDoc(doc(authed, 'eventInterests', '5_student-2'), { contentItemId: 5, studentId: 'student-2' }))
  })
})

describe('societyInterests collection (BR6)', () => {
  it('allows a student to submit their own society sign-up', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertSucceeds(
      setDoc(doc(authed, 'societyInterests', 'si1'), { contentItemId: 9, studentId: 'student-1', studentName: 'Student One', message: null }),
    )
  })

  it('prevents a student reading another student\'s society sign-up', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'societyInterests', 'si2'), { contentItemId: 9, studentId: 'student-2' }),
    )
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(getDoc(doc(authed, 'societyInterests', 'si2')))
  })

  it('allows staff to read any society sign-up', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'societyInterests', 'si3'), { contentItemId: 9, studentId: 'student-2' }),
    )
    const staffDb = testEnv.authenticatedContext('staff-1').firestore()
    await assertSucceeds(getDoc(doc(staffDb, 'societyInterests', 'si3')))
  })
})

describe('lostFoundItems collection (BR7)', () => {
  it('allows any signed-in user to browse reports', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'lostFoundItems', 'lf1'), { reportedBy: 'student-2', status: 'OPEN' }),
    )
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertSucceeds(getDoc(doc(authed, 'lostFoundItems', 'lf1')))
  })

  it('rejects reporting an item under someone else\'s id', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(setDoc(doc(authed, 'lostFoundItems', 'lf2'), { reportedBy: 'student-2', status: 'OPEN' }))
  })

  it('rejects a student resolving someone else\'s report (only owner or staff may)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'lostFoundItems', 'lf3'), { reportedBy: 'student-2', status: 'OPEN' }),
    )
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(updateDoc(doc(authed, 'lostFoundItems', 'lf3'), { status: 'RESOLVED' }))
  })
})

describe('unauthenticated access', () => {
  it('rejects any read without signing in', async () => {
    const anon = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(anon, 'rooms', 'r1')))
  })
})
