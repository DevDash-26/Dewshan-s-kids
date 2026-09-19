import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isStaffOrAdmin } from '../../lib/permissions'
import { Spinner } from '../ui/Feedback'

export function ProtectedRoute({ children, staffOnly = false }: { children: ReactNode; staffOnly?: boolean }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <Spinner label="Loading your session…" />
  if (!user || !profile) return <Navigate to="/login" replace />
  if (staffOnly && !isStaffOrAdmin(profile?.role)) return <Navigate to="/" replace />

  return <>{children}</>
}
