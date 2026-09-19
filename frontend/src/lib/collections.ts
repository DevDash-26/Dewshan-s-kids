import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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

export async function decideBooking(bookingId: string, status: BookingStatus, decidedBy: string) {
  return updateDoc(doc(db, 'roomBookings', bookingId), { status, decidedBy, decidedAt: serverTimestamp() })
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
export async function joinSociety(input: Omit<SocietyInterest, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'societyInterests'), { ...input, createdAt: serverTimestamp() })
}

export async function getMySocietyInterestIds(studentId: string): Promise<Set<number>> {
  const q = query(collection(db, 'societyInterests'), where('studentId', '==', studentId))
  const snap = await getDocs(q)
  return new Set(snap.docs.map((d) => (d.data() as SocietyInterest).contentItemId))
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
