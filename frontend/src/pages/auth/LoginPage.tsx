import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button, FormError, Input, Label } from '../../components/ui/Primitives'

export function LoginPage() {
  const { user, login, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      // error state already surfaced via context
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ucl-navy px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Sparkles className="h-8 w-8 text-ucl-blue" aria-hidden />
          <h1 className="text-xl font-bold text-slate-900">UCL ONE</h1>
          <p className="text-sm text-slate-500">Sign in to your campus hub</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" onFocus={clearError}>
          <FormError message={error} />
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          New student?{' '}
          <Link to="/signup" className="font-medium text-ucl-blue hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
