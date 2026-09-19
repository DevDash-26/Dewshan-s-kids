import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { UserProfile } from '../types/models'

// Self-service signup only ever creates STUDENT accounts. STAFF and ADMIN
// accounts are provisioned out-of-band (see /cms seed script + README demo
// credentials) — this repository is public, so any "staff signup code"
// embedded client-side would be visible to everyone and worthless as a
// safeguard. Firestore rules additionally reject a client-set role other
// than STUDENT on create (see firestore.rules).
export interface SignupInput {
  email: string
  password: string
  displayName: string
  faculty?: string
  programme?: string
  yearGroup?: number
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid))
          setProfile(snap.exists() ? (snap.data() as UserProfile) : null)
        } catch (err) {
          // Logged (not surfaced to the UI) so a missing/unreadable profile
          // is diagnosable from the console instead of silently presenting
          // as "profile: null" with no trace of why.
          console.error('Failed to load user profile:', err)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  function friendlyAuthError(err: unknown): string {
    const code = (err as { code?: string })?.code ?? ''
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password.'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }

  async function login(email: string, password: string) {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const message = friendlyAuthError(err)
      setError(message)
      throw new Error(message)
    }
  }

  async function signup(input: SignupInput) {
    setError(null)
    try {
      const credential = await createUserWithEmailAndPassword(auth, input.email, input.password)
      await updateProfile(credential.user, { displayName: input.displayName })

      const newProfile: UserProfile = {
        uid: credential.user.uid,
        email: input.email,
        displayName: input.displayName,
        role: 'STUDENT',
        staffDepartment: null,
        faculty: input.faculty ?? null,
        programme: input.programme ?? null,
        yearGroup: input.yearGroup ?? null,
        createdAt: new Date().toISOString(),
      }
      await setDoc(doc(db, 'users', credential.user.uid), { ...newProfile, createdAt: serverTimestamp() })
      setProfile(newProfile)
    } catch (err) {
      const message = friendlyAuthError(err)
      setError(message)
      throw new Error(message)
    }
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ firebaseUser, profile, loading, error, login, signup, logout, clearError: () => setError(null) }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
