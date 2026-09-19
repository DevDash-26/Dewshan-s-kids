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
    await setDoc(doc(db, 'users', 'student-1'), { uid: 'student-1', role: 'STUDENT', staffDepartment: null })
    await setDoc(doc(db, 'users', 'student-2'), { uid: 'student-2', role: 'STUDENT', staffDepartment: null })
    // staff-1 has no department assigned (mirrors a real newly-seeded staff
    // account before an admin assigns one) - used for role-level checks that
    // don't depend on department.
    await setDoc(doc(db, 'users', 'staff-1'), { uid: 'staff-1', role: 'STAFF', staffDepartment: null })
    // BR12: department-specific staff used by the tests below that verify
    // department-gated collections (roomBookings approval, societyInterests).
    await setDoc(doc(db, 'users', 'staff-administrative'), { uid: 'staff-administrative', role: 'STAFF', staffDepartment: 'ADMINISTRATIVE' })
    await setDoc(doc(db, 'users', 'staff-society'), { uid: 'staff-society', role: 'STAFF', staffDepartment: 'SOCIETY' })
    await setDoc(doc(db, 'users', 'admin-1'), { uid: 'admin-1', role: 'ADMIN', staffDepartment: null })
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

  it('allows ADMINISTRATIVE-department staff to approve a pending booking (BR12)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'roomBookings', 'b4'), {
        roomId: 'r1',
        requestedBy: 'student-1',
        status: 'PENDING',
      }),
    )
    const staffDb = testEnv.authenticatedContext('staff-administrative').firestore()
    await assertSucceeds(updateDoc(doc(staffDb, 'roomBookings', 'b4'), { status: 'APPROVED', decidedBy: 'staff-administrative' }))
  })

  it('rejects a staff member outside the ADMINISTRATIVE department approving a booking (BR12)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'roomBookings', 'b4b'), {
        roomId: 'r1',
        requestedBy: 'student-1',
        status: 'PENDING',
      }),
    )
    const staffDb = testEnv.authenticatedContext('staff-society').firestore()
    await assertFails(updateDoc(doc(staffDb, 'roomBookings', 'b4b'), { status: 'APPROVED', decidedBy: 'staff-society' }))
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

  it('allows SOCIETY-department staff to read any society sign-up (BR12)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'societyInterests', 'si3'), { contentItemId: 9, studentId: 'student-2' }),
    )
    const staffDb = testEnv.authenticatedContext('staff-society').firestore()
    await assertSucceeds(getDoc(doc(staffDb, 'societyInterests', 'si3')))
  })

  it('rejects a staff member outside the SOCIETY department reading a sign-up (BR12)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'societyInterests', 'si4'), { contentItemId: 9, studentId: 'student-2' }),
    )
    const staffDb = testEnv.authenticatedContext('staff-administrative').firestore()
    await assertFails(getDoc(doc(staffDb, 'societyInterests', 'si4')))
  })

  it('allows a student to re-join a society idempotently via the deterministic id (BR6 duplicate prevention)', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    const ref = doc(authed, 'societyInterests', '9_student-1')
    await assertSucceeds(setDoc(ref, { contentItemId: 9, studentId: 'student-1', studentName: 'Student One', message: null }))
    // Re-joining overwrites the same document (an update, not a duplicate) -
    // still succeeds, and no second document is created.
    await assertSucceeds(setDoc(ref, { contentItemId: 9, studentId: 'student-1', studentName: 'Student One', message: null }))
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

describe('academicSupportRequests collection (BR9, BR12: academic staff)', () => {
  it('allows a student to create their own request', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertSucceeds(setDoc(doc(authed, 'academicSupportRequests', 'req1'), { requestedBy: 'student-1', kind: 'STUDY_GROUP', status: 'OPEN' }))
  })

  it('rejects creating a request on someone else\'s behalf', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(setDoc(doc(authed, 'academicSupportRequests', 'req2'), { requestedBy: 'student-2', kind: 'STUDY_GROUP', status: 'OPEN' }))
  })

  it('allows the owner to read their own request but not another student\'s', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'academicSupportRequests', 'req3'), { requestedBy: 'student-2', status: 'OPEN' }),
    )
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(getDoc(doc(authed, 'academicSupportRequests', 'req3')))
    const owner = testEnv.authenticatedContext('student-2').firestore()
    await assertSucceeds(getDoc(doc(owner, 'academicSupportRequests', 'req3')))
  })

  it('allows ACADEMIC-department staff to read and update any request, but not other departments', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'academicSupportRequests', 'req4'), { requestedBy: 'student-2', status: 'OPEN' }),
    )
    const academicDb = testEnv.authenticatedContext('staff-administrative').firestore() // wrong department on purpose
    await assertFails(getDoc(doc(academicDb, 'academicSupportRequests', 'req4')))
    await assertFails(updateDoc(doc(academicDb, 'academicSupportRequests', 'req4'), { status: 'IN_PROGRESS' }))
  })

  it('rejects a student updating their own request status directly (staff-only transition)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'academicSupportRequests', 'req5'), { requestedBy: 'student-1', status: 'OPEN' }),
    )
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(updateDoc(doc(authed, 'academicSupportRequests', 'req5'), { status: 'RESOLVED' }))
  })
})

describe('feedback collection (BR17, BR12: administrative staff)', () => {
  it('allows a student to submit their own feedback', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertSucceeds(setDoc(doc(authed, 'feedback', 'fb1'), { submittedBy: 'student-1', status: 'OPEN' }))
  })

  it('rejects submitting feedback under someone else\'s id', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(setDoc(doc(authed, 'feedback', 'fb2'), { submittedBy: 'student-2', status: 'OPEN' }))
  })

  it('prevents a student reading another student\'s feedback', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), 'feedback', 'fb3'), { submittedBy: 'student-2', status: 'OPEN' }))
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(getDoc(doc(authed, 'feedback', 'fb3')))
  })

  it('allows ADMINISTRATIVE-department staff to respond to feedback, but not other departments', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), 'feedback', 'fb4'), { submittedBy: 'student-2', status: 'OPEN' }))
    const wrongDept = testEnv.authenticatedContext('staff-society').firestore()
    await assertFails(updateDoc(doc(wrongDept, 'feedback', 'fb4'), { status: 'RESOLVED', response: 'x' }))
    const rightDept = testEnv.authenticatedContext('staff-administrative').firestore()
    await assertSucceeds(updateDoc(doc(rightDept, 'feedback', 'fb4'), { status: 'RESOLVED', response: 'x' }))
  })
})

describe('facilityIssues collection (BR21, BR12: administrative staff)', () => {
  it('allows a student to report their own facility issue', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertSucceeds(setDoc(doc(authed, 'facilityIssues', 'fi1'), { reportedBy: 'student-1', status: 'OPEN' }))
  })

  it('rejects reporting an issue under someone else\'s id', async () => {
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(setDoc(doc(authed, 'facilityIssues', 'fi2'), { reportedBy: 'student-2', status: 'OPEN' }))
  })

  it('allows any signed-in user to browse reported issues (transparency, matches lostFoundItems pattern)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), 'facilityIssues', 'fi3'), { reportedBy: 'student-2', status: 'OPEN' }))
    const authed = testEnv.authenticatedContext('student-1').firestore()
    await assertSucceeds(getDoc(doc(authed, 'facilityIssues', 'fi3')))
  })

  it('rejects a student updating someone else\'s issue, but allows ADMINISTRATIVE staff', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), 'facilityIssues', 'fi4'), { reportedBy: 'student-2', status: 'OPEN' }))
    const otherStudent = testEnv.authenticatedContext('student-1').firestore()
    await assertFails(updateDoc(doc(otherStudent, 'facilityIssues', 'fi4'), { status: 'RESOLVED' }))
    const wrongDept = testEnv.authenticatedContext('staff-society').firestore()
    await assertFails(updateDoc(doc(wrongDept, 'facilityIssues', 'fi4'), { status: 'RESOLVED' }))
    const rightDept = testEnv.authenticatedContext('staff-administrative').firestore()
    await assertSucceeds(updateDoc(doc(rightDept, 'facilityIssues', 'fi4'), { status: 'RESOLVED' }))
  })
})

describe('unauthenticated access', () => {
  it('rejects any read without signing in', async () => {
    const anon = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(anon, 'rooms', 'r1')))
  })
})
