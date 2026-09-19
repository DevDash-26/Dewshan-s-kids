import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, type User } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { firebaseApp, isFirebaseConfigured } from './firebase';
import { createUserProfile, getUserProfile } from './userService';
import { isUclEmail } from '../auth/validation';
import type { UserProfile } from '../types';

function auth() {
  if (!firebaseApp) throw new Error('Firebase Authentication is not configured.');
  return getAuth(firebaseApp);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured || !firebaseApp) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth(), callback);
}

export async function loginUser(email: string, password: string): Promise<{ user: User; profile: UserProfile }> {
  if (!isUclEmail(email)) throw new Error('Use your UCL email address ending in @ucl.lk.');
  const credential = await signInWithEmailAndPassword(auth(), email.trim().toLowerCase(), password);
  const profile = await getUserProfile(credential.user);
  return { user: credential.user, profile };
}

export async function registerUser(details: { displayName: string; email: string; password: string; studentId?: string }): Promise<{ user: User; profile: UserProfile }> {
  if (!isUclEmail(details.email)) throw new Error('Registration is limited to UCL email addresses ending in @ucl.lk.');
  const credential = await createUserWithEmailAndPassword(auth(), details.email.trim().toLowerCase(), details.password);
  await updateProfile(credential.user, { displayName: details.displayName.trim() });
  const profile = await createUserProfile(credential.user, details);
  return { user: credential.user, profile };
}

export async function resetPassword(email: string) {
  if (!isUclEmail(email)) throw new Error('Use your UCL email address ending in @ucl.lk.');
  await sendPasswordResetEmail(auth(), email.trim().toLowerCase());
}

export async function logoutUser() {
  await signOut(auth());
}
