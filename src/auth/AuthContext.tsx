import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../types';
import { demoUser } from '../data/demo';
import { hasAnyRole, hasPermission as roleHasPermission, type Permission } from './permissions';
import { firebaseAuthMessage, validatePassword } from './validation';
import { getUserProfile } from '../services/userService';
import { loginUser, logoutUser, registerUser, resetPassword, subscribeToAuth } from '../services/authService';
import { isFirebaseConfigured } from '../services/firebase';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (details: { displayName: string; email: string; password: string; studentId?: string }) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  hasRole: (...roles: UserProfile['role'][]) => boolean;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => subscribeToAuth(async (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      try { setProfile(await getUserProfile(nextUser)); } catch (error) { console.error('Unable to load user profile', error); setProfile(null); }
    } else {
      setProfile(null);
    }
    setLoading(false);
  }), []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    loading,
    isAuthenticated: Boolean(user || profile),
    isDemoMode: !isFirebaseConfigured,
    login: async (email, password) => {
      try {
        if (!isFirebaseConfigured) { setProfile({ ...demoUser, email: email || demoUser.email }); return; }
        const result = await loginUser(email, password);
        setUser(result.user); setProfile(result.profile);
      } catch (error) { throw new Error(firebaseAuthMessage(error)); }
    },
    register: async (details) => {
      const passwordError = validatePassword(details.password);
      if (passwordError) throw new Error(passwordError);
      try {
        if (!isFirebaseConfigured) { setProfile({ ...demoUser, name: details.displayName, displayName: details.displayName, email: details.email }); return; }
        const result = await registerUser(details);
        setUser(result.user); setProfile(result.profile);
      } catch (error) { throw new Error(firebaseAuthMessage(error)); }
    },
    logout: async () => { if (isFirebaseConfigured) await logoutUser(); setUser(null); setProfile(null); },
    sendPasswordReset: async (email) => { try { await resetPassword(email); } catch (error) { throw new Error(firebaseAuthMessage(error)); } },
    hasRole: (...roles) => hasAnyRole(profile?.role, roles),
    hasPermission: (permission) => roleHasPermission(profile?.role, permission),
  }), [loading, profile, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
