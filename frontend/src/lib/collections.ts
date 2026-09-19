import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  AcademicSupportRequest,
  BookingStatus,
  EventInterest,
  FacilityIssue,
  Feedback,
  LostFoundItem,
  Room,
  RoomBooking,
  SocietyInterest,
} from '../types/models'

// Thin, typed wrappers around Firestore for each transactional collection in
// the data model. Kept intentionally simple (no generic repository
// abstraction) — each collection's shape and rules differ enough that a
// shared abstraction would hide more than it saves.

// ---------- Rooms ----------
export async function listRooms(): Promise<Room[]> {
  const snap = await getDocs(collection(db, 'rooms'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Room)
}

export function watchRooms(cb: (rooms: Room[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'rooms'), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Room))
  })
}

// ---------- Room bookings ----------
export async function listBookingsForRoomAndDate(roomId: string, date: string): Promise<RoomBooking[]> {
  const q = query(
    collection(db, 'roomBookings'),
    where('roomId', '==', roomId),
    where('date', '==', date),
    where('status', 'in', ['PENDING', 'APPROVED']),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RoomBooking)
}

export function timeRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd
}

export async function createBooking(input: Omit<RoomBooking, 'id' | 'createdAt' | 'decidedBy' | 'decidedAt'>) {
  return addDoc(collection(db, 'roomBookings'), {
    ...input,
    createdAt: serverTimestamp(),
    decidedBy: null,
    decidedAt: null,
  })
}

export function watchMyBookings(uid: string, cb: (bookings: RoomBooking[]) => void): Unsubscribe {
  const q = query(collection(db, 'roomBookings'), where('requestedBy', '==', uid))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RoomBooking)))
}

export function watchAllBookings(cb: (bookings: RoomBooking[]) => void): Unsubscribe {
  const q = query(collection(db, 'roomBookings'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RoomBooking)))
}

// Rejecting/cancelling never conflicts with anything, so it's a plain write.
// Approving is the case that matters: two PENDING requests for the same
// room/time could previously both be approved with no check at all
// (confirmed during audit - BookingsTab had no cross-referencing between
// pending requests). This re-validates against every other APPROVED booking
// for the same room/date inside a Firestore transaction: both the target
// booking and each candidate are re-read fresh at commit time, so if another
// approval slips in between the initial query and this transaction
// committing, Firestore's optimistic-concurrency check on the re-read
// documents forces a retry rather than silently double-booking the room.
// This is not a full pessimistic lock (a booking created by a brand-new
// document after the initial query, in the same instant, is not covered),
// but it closes the gap that existed - zero conflict awareness at approval.
//
// `firestoreInstance` defaults to the app's shared client and only exists so
// tests can exercise this exact function against an isolated emulator
// project (via @firebase/rules-unit-testing) without touching real data.
export async function decideBooking(bookingId: string, status: BookingStatus, decidedBy: string, firestoreInstance: Firestore = db) {
  if (status !== 'APPROVED') {
    return updateDoc(doc(firestoreInstance, 'roomBookings', bookingId), { status, decidedBy, decidedAt: serverTimestamp() })
  }

  const bookingRef = doc(firestoreInstance, 'roomBookings', bookingId)
  const bookingSnap = await getDoc(bookingRef)
  if (!bookingSnap.exists()) throw new Error('Booking not found.')
  const booking = bookingSnap.data() as RoomBooking

  const candidatesSnap = await getDocs(
    query(
      collection(firestoreInstance, 'roomBookings'),
      where('roomId', '==', booking.roomId),
      where('date', '==', booking.date),
      where('status', '==', 'APPROVED'),
    ),
  )
  const candidateRefs = candidatesSnap.docs.map((d) => d.ref).filter((ref) => ref.id !== bookingId)

  await runTransaction(firestoreInstance, async (tx) => {
    const freshBooking = await tx.get(bookingRef)
    if (!freshBooking.exists() || (freshBooking.data() as RoomBooking).status !== 'PENDING') {
      throw new Error('This booking is no longer pending — it may have already been decided.')
    }

    for (const ref of candidateRefs) {
      const snap = await tx.get(ref)
      if (!snap.exists()) continue
      const other = snap.data() as RoomBooking
      if (other.status === 'APPROVED' && timeRangesOverlap(booking.startTime, booking.endTime, other.startTime, other.endTime)) {
        throw new Error(`Cannot approve — overlaps with an already-approved booking for ${booking.roomName} (${other.startTime}–${other.endTime}).`)
      }
    }

    tx.update(bookingRef, { status: 'APPROVED', decidedBy, decidedAt: serverTimestamp() })
  })
}

export async function cancelBooking(bookingId: string) {
  return updateDoc(doc(db, 'roomBookings', bookingId), { status: 'CANCELLED' })
}

// ---------- Event interest (BR4) ----------
export function eventInterestDocId(contentItemId: number, studentId: string) {
  return `${contentItemId}_${studentId}`
}

export async function expressEventInterest(contentItemId: number, studentId: string) {
  const id = eventInterestDocId(contentItemId, studentId)
  await setDoc(doc(db, 'eventInterests', id), { contentItemId, studentId, createdAt: serverTimestamp() })
}

export async function withdrawEventInterest(contentItemId: number, studentId: string) {
  const id = eventInterestDocId(contentItemId, studentId)
  await deleteDoc(doc(db, 'eventInterests', id))
}

export async function getEventInterestCounts(): Promise<Record<number, number>> {
  const snap = await getDocs(collection(db, 'eventInterests'))
  const counts: Record<number, number> = {}
  snap.docs.forEach((d) => {
    const data = d.data() as EventInterest
    counts[data.contentItemId] = (counts[data.contentItemId] ?? 0) + 1
  })
  return counts
}

export async function getMyEventInterestIds(studentId: string): Promise<Set<number>> {
  const q = query(collection(db, 'eventInterests'), where('studentId', '==', studentId))
  const snap = await getDocs(q)
  return new Set(snap.docs.map((d) => (d.data() as EventInterest).contentItemId))
}

// ---------- Society interest / sign-up (BR6) ----------
// Deterministic {contentItemId}_{studentId} id, same pattern as event
// interest: re-joining overwrites the same document instead of creating a
// second one, so duplicate prevention is a structural property of the data
// model rather than something that relies on client-held state (which a
// second tab or a stale reload could bypass with the old addDoc approach).
export function societyInterestDocId(contentItemId: number, studentId: string): string {
  return `${contentItemId}_${studentId}`
}

export async function joinSociety(input: Omit<SocietyInterest, 'id' | 'createdAt'>) {
  const id = societyInterestDocId(input.contentItemId, input.studentId)
  return setDoc(doc(db, 'societyInterests', id), { ...input, createdAt: serverTimestamp() })
}

export async function getMySocietyInterestIds(studentId: string): Promise<Set<number>> {
  const q = query(collection(db, 'societyInterests'), where('studentId', '==', studentId))
  const snap = await getDocs(q)
  return new Set(snap.docs.map((d) => (d.data() as SocietyInterest).contentItemId))
}

// BR12: readable only by the SOCIETY department (or admin) - see firestore.rules.
export function watchAllSocietyInterests(cb: (interests: SocietyInterest[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'societyInterests'), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SocietyInterest))
  })
}

// ---------- Lost & Found (BR7) ----------
export async function createLostFoundItem(input: Omit<LostFoundItem, 'id' | 'createdAt' | 'status'>) {
  return addDoc(collection(db, 'lostFoundItems'), { ...input, status: 'OPEN', createdAt: serverTimestamp() })
}

export function watchLostFoundItems(cb: (items: LostFoundItem[]) => void): Unsubscribe {
  const q = query(collection(db, 'lostFoundItems'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LostFoundItem)))
}

export async function resolveLostFoundItem(id: string) {
  return updateDoc(doc(db, 'lostFoundItems', id), { status: 'RESOLVED' })
}

// ---------- Academic support (BR9) ----------
export async function createSupportRequest(input: Omit<AcademicSupportRequest, 'id' | 'createdAt' | 'status'>) {
  return addDoc(collection(db, 'academicSupportRequests'), { ...input, status: 'OPEN', createdAt: serverTimestamp() })
}

export function watchMySupportRequests(uid: string, cb: (r: AcademicSupportRequest[]) => void): Unsubscribe {
  const q = query(collection(db, 'academicSupportRequests'), where('requestedBy', '==', uid))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AcademicSupportRequest)))
}

export function watchAllSupportRequests(cb: (r: AcademicSupportRequest[]) => void): Unsubscribe {
  const q = query(collection(db, 'academicSupportRequests'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AcademicSupportRequest)))
}

export async function updateSupportRequestStatus(id: string, status: AcademicSupportRequest['status']) {
  return updateDoc(doc(db, 'academicSupportRequests', id), { status })
}

// ---------- Feedback (BR17) ----------
export async function submitFeedback(input: Omit<Feedback, 'id' | 'createdAt' | 'status' | 'response'>) {
  return addDoc(collection(db, 'feedback'), { ...input, status: 'OPEN', response: null, createdAt: serverTimestamp() })
}

export function watchMyFeedback(uid: string, cb: (f: Feedback[]) => void): Unsubscribe {
  const q = query(collection(db, 'feedback'), where('submittedBy', '==', uid))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Feedback)))
}

export function watchAllFeedback(cb: (f: Feedback[]) => void): Unsubscribe {
  const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Feedback)))
}

export async function respondToFeedback(id: string, response: string) {
  return updateDoc(doc(db, 'feedback', id), { response, status: 'RESOLVED' })
}

// ---------- Facility issues (BR21) ----------
export async function reportFacilityIssue(input: Omit<FacilityIssue, 'id' | 'createdAt' | 'status'>) {
  return addDoc(collection(db, 'facilityIssues'), { ...input, status: 'OPEN', createdAt: serverTimestamp() })
}

export function watchFacilityIssues(cb: (issues: FacilityIssue[]) => void): Unsubscribe {
  const q = query(collection(db, 'facilityIssues'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FacilityIssue)))
}

export async function updateFacilityIssueStatus(id: string, status: FacilityIssue['status']) {
  return updateDoc(doc(db, 'facilityIssues', id), { status })
}
