import { createCollectionItem, deleteCollectionItem, getCollection, updateCollectionItem } from './api'
import type { AcademicSupportRequest, BookingStatus, EventInterest, FacilityIssue, Feedback, LostFoundItem, Room, RoomBooking, SocietyInterest } from '../types/models'

export async function listRooms(): Promise<Room[]> { return getCollection<Room>('rooms') }
export function watchRooms(cb: (rooms: Room[]) => void): () => void { let active = true; const refresh = () => getCollection<Room>('rooms').then((rooms) => active && cb(rooms)).catch(() => undefined); refresh(); const timer = window.setInterval(refresh, 5000); return () => { active = false; window.clearInterval(timer) } }
export async function listBookingsForRoomAndDate(roomId: string, date: string): Promise<RoomBooking[]> { return getCollection<RoomBooking>('roomBookings', `?roomId=${encodeURIComponent(roomId)}&date=${encodeURIComponent(date)}`) }
export function timeRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean { return aStart < bEnd && bStart < aEnd }
export async function createBooking(input: Omit<RoomBooking, 'id' | 'createdAt' | 'decidedBy' | 'decidedAt'>) { return createCollectionItem<RoomBooking>('roomBookings', { ...input, decidedBy: null, decidedAt: null }) }
export function watchMyBookings(uid: string, cb: (bookings: RoomBooking[]) => void): () => void { return watchCollection('roomBookings', cb, `?requestedBy=${encodeURIComponent(uid)}`) }
export function watchAllBookings(cb: (bookings: RoomBooking[]) => void): () => void { return watchCollection('roomBookings', cb) }
export async function decideBooking(bookingId: string, status: BookingStatus, decidedBy: string) { return updateCollectionItem<RoomBooking>('roomBookings', bookingId, { status, decidedBy, decidedAt: new Date().toISOString() }) }
export async function cancelBooking(bookingId: string) { return updateCollectionItem<RoomBooking>('roomBookings', bookingId, { status: 'CANCELLED' }) }
export function eventInterestDocId(contentItemId: number, studentId: string) { return `${contentItemId}_${studentId}` }
export async function expressEventInterest(contentItemId: number, studentId: string) { return createCollectionItem<EventInterest>('eventInterests', { id: eventInterestDocId(contentItemId, studentId), contentItemId, studentId }) }
export async function withdrawEventInterest(contentItemId: number, studentId: string) { return deleteCollectionItem('eventInterests', eventInterestDocId(contentItemId, studentId)) }
export async function getEventInterestCounts(): Promise<Record<number, number>> { const items = await getCollection<EventInterest>('eventInterests'); return items.reduce<Record<number, number>>((counts, item) => ({ ...counts, [item.contentItemId]: (counts[item.contentItemId] ?? 0) + 1 }), {}) }
export async function getMyEventInterestIds(studentId: string): Promise<Set<number>> { return new Set((await getCollection<EventInterest>('eventInterests', `?studentId=${encodeURIComponent(studentId)}`)).map((item) => item.contentItemId)) }
export async function joinSociety(input: Omit<SocietyInterest, 'id' | 'createdAt'>) { return createCollectionItem<SocietyInterest>('societyInterests', input) }
export async function getMySocietyInterestIds(studentId: string): Promise<Set<number>> { return new Set((await getCollection<SocietyInterest>('societyInterests', `?studentId=${encodeURIComponent(studentId)}`)).map((item) => item.contentItemId)) }
export async function createLostFoundItem(input: Omit<LostFoundItem, 'id' | 'createdAt' | 'status'>) { return createCollectionItem<LostFoundItem>('lostFoundItems', { ...input, status: 'OPEN' }) }
export function watchLostFoundItems(cb: (items: LostFoundItem[]) => void): () => void { return watchCollection('lostFoundItems', cb) }
export async function resolveLostFoundItem(id: string) { return updateCollectionItem<LostFoundItem>('lostFoundItems', id, { status: 'RESOLVED' }) }
export async function createSupportRequest(input: Omit<AcademicSupportRequest, 'id' | 'createdAt' | 'status'>) { return createCollectionItem<AcademicSupportRequest>('academicSupportRequests', { ...input, status: 'OPEN' }) }
export function watchMySupportRequests(uid: string, cb: (items: AcademicSupportRequest[]) => void): () => void { return watchCollection('academicSupportRequests', cb, `?requestedBy=${encodeURIComponent(uid)}`) }
export function watchAllSupportRequests(cb: (items: AcademicSupportRequest[]) => void): () => void { return watchCollection('academicSupportRequests', cb) }
export async function updateSupportRequestStatus(id: string, status: AcademicSupportRequest['status']) { return updateCollectionItem<AcademicSupportRequest>('academicSupportRequests', id, { status }) }
export async function submitFeedback(input: Omit<Feedback, 'id' | 'createdAt' | 'status' | 'response'>) { return createCollectionItem<Feedback>('feedback', { ...input, status: 'OPEN', response: null }) }
export function watchMyFeedback(uid: string, cb: (items: Feedback[]) => void): () => void { return watchCollection('feedback', cb, `?submittedBy=${encodeURIComponent(uid)}`) }
export function watchAllFeedback(cb: (items: Feedback[]) => void): () => void { return watchCollection('feedback', cb) }
export async function respondToFeedback(id: string, response: string) { return updateCollectionItem<Feedback>('feedback', id, { response, status: 'RESOLVED' }) }
export async function reportFacilityIssue(input: Omit<FacilityIssue, 'id' | 'createdAt' | 'status'>) { return createCollectionItem<FacilityIssue>('facilityIssues', { ...input, status: 'OPEN' }) }
export function watchFacilityIssues(cb: (items: FacilityIssue[]) => void): () => void { return watchCollection('facilityIssues', cb) }
export async function updateFacilityIssueStatus(id: string, status: FacilityIssue['status']) { return updateCollectionItem<FacilityIssue>('facilityIssues', id, { status }) }

function watchCollection<T>(collection: string, callback: (items: T[]) => void, query = '') { let active = true; const refresh = () => getCollection<T>(collection, query).then((items) => active && callback(items)).catch(() => undefined); refresh(); const timer = window.setInterval(refresh, 5000); return () => { active = false; window.clearInterval(timer) } }
