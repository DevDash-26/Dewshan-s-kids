import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from './firebase';
import { events, rooms, societies } from '../data/demo';
import { validateBooking } from '../utils/validation';

export async function getEvents() { return events; }
export async function getSocieties() { return societies; }
export async function getRooms() { return rooms; }
export async function createEventInterest(userId: string, eventId: string) {
  if (!firestore) return { id: `demo-interest-${userId}-${eventId}` };
  const interests = collection(firestore, 'eventInterests');
  const existing = await getDocs(query(interests, where('userId', '==', userId), where('eventId', '==', eventId)));
  if (!existing.empty) throw new Error('You have already expressed interest in this event.');
  return addDoc(interests, { userId, eventId, createdAt: new Date().toISOString() });
}

export async function createBooking(userId: string, roomId: string, date: string, startTime: string, endTime: string) {
  const validationError = validateBooking(date, startTime, endTime);
  if (validationError) throw new Error(validationError);
  if (!firestore) return { id: `demo-booking-${Date.now()}` };
  const bookings = collection(firestore, 'bookings');
  const existing = await getDocs(query(bookings, where('userId', '==', userId), where('roomId', '==', roomId), where('date', '==', date), where('startTime', '==', startTime), where('endTime', '==', endTime)));
  if (!existing.empty) throw new Error('You already have a booking for this room and time.');
  return addDoc(bookings, { userId, roomId, date, startTime, endTime, status: 'pending', createdAt: new Date().toISOString() });
}

export async function joinSociety(userId: string, societyId: string) {
  if (!firestore) return { id: `demo-member-${userId}-${societyId}` };
  return addDoc(collection(firestore, 'societyMembers'), { userId, societyId, createdAt: new Date().toISOString() });
}
