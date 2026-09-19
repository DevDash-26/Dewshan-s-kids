import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../types';
import { demoUser } from '../data/demo';
import { firestore } from './firebase';

export async function createUserProfile(user: User, details: { displayName: string; studentId?: string }): Promise<UserProfile> {
  const profile: UserProfile = {
    id: user.uid,
    uid: user.uid,
    name: details.displayName,
    displayName: details.displayName,
    email: user.email || '',
    role: 'student',
    studentId: details.studentId,
    isActive: true,
    faculty: '',
    programme: '',
    year: 1,
  };
  if (firestore) {
    await setDoc(doc(firestore, 'users', user.uid), { ...profile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
  return profile;
}

export async function getUserProfile(user: User): Promise<UserProfile> {
  if (!firestore) return { ...demoUser, id: user.uid, uid: user.uid, email: user.email || demoUser.email, displayName: demoUser.name, isActive: true };
  const snapshot = await getDoc(doc(firestore, 'users', user.uid));
  if (!snapshot.exists()) return createUserProfile(user, { displayName: user.displayName || user.email?.split('@')[0] || 'UCL student' });
  const data = snapshot.data() as Partial<UserProfile>;
  return { ...demoUser, ...data, id: user.uid, uid: user.uid, email: user.email || data.email || '', displayName: data.displayName || data.name || 'UCL student' };
}

export async function updateOwnProfile(userId: string, updates: Pick<UserProfile, 'displayName' | 'phone' | 'photoURL' | 'department' | 'studentId' | 'staffId'>) {
  if (!firestore) return;
  await updateDoc(doc(firestore, 'users', userId), { ...updates, updatedAt: serverTimestamp() });
}
