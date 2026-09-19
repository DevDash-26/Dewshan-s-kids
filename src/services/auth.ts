import type { UserProfile, UserRole } from '../types';
import { demoUser } from '../data/demo';
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { firebaseApp, isFirebaseConfigured } from './firebase';

export const demoCredentials = { email: demoUser.email, password: 'DemoPass123!' };

export function canAccess(role: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(role);
}

export async function signIn(email: string, password: string): Promise<UserProfile> {
  if (isFirebaseConfigured && firebaseApp) {
    const credential = await signInWithEmailAndPassword(getAuth(firebaseApp), email, password);
    return { ...demoUser, id: credential.user.uid, email: credential.user.email || email };
  }
  return { ...demoUser, email: email || demoUser.email };
}

export async function signOut() {
  if (isFirebaseConfigured && firebaseApp) return firebaseSignOut(getAuth(firebaseApp));
  return Promise.resolve();
}
