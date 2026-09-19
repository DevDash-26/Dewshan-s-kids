import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiRequest, setApiToken } from '../lib/api'
import type { UserProfile } from '../types/models'

export interface SignupInput { email: string; password: string; displayName: string; faculty?: string; programme?: string; yearGroup?: number }
interface AuthContextValue { user: UserProfile | null; profile: UserProfile | null; loading: boolean; error: string | null; login: (email: string, password: string) => Promise<void>; signup: (input: SignupInput) => Promise<void>; logout: () => Promise<void>; clearError: () => void }
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { apiRequest<{ user: UserProfile }>('/auth/me').then(({ user }) => setProfile(user)).catch(() => { setApiToken(null); setProfile(null) }).finally(() => setLoading(false)) }, [])
  async function login(email: string, password: string) { setError(null); try { const result = await apiRequest<{ token: string; user: UserProfile }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setApiToken(result.token); setProfile(result.user) } catch (err) { const message = err instanceof Error ? err.message : 'Unable to sign in.'; setError(message); throw new Error(message) } }
  async function signup(input: SignupInput) { setError(null); try { const result = await apiRequest<{ token: string; user: UserProfile }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }); setApiToken(result.token); setProfile(result.user) } catch (err) { const message = err instanceof Error ? err.message : 'Unable to create your account.'; setError(message); throw new Error(message) } }
  async function logout() { await apiRequest('/auth/logout', { method: 'POST' }).catch(() => undefined); setApiToken(null); setProfile(null) }
  return <AuthContext.Provider value={{ user: profile, profile, loading, error, login, signup, logout, clearError: () => setError(null) }}>{children}</AuthContext.Provider>
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context }
