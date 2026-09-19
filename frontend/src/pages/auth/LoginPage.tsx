import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import uclLogo from '../../../images/ucl_logo.jpeg'
import { useAuth } from '../../context/AuthContext'
import { Button, FormError, Input, Label } from '../../components/ui/Primitives'

export function LoginPage() {
  const { firebaseUser, login, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (firebaseUser) return <Navigate to="/" replace />

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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),transparent_30%),linear-gradient(135deg,#09182d_0%,#0f2557_38%,#123d7a_100%)] px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/10 bg-white/8 shadow-[0_30px_80px_rgba(6,15,32,0.45)] backdrop-blur-sm lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden min-h-[620px] overflow-hidden bg-[linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.76)),url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-4">
            <img src={uclLogo} alt="UCL logo" className="h-28 w-72 rounded-xl object-cover shadow-lg" />
          </div>

          <div className="max-w-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">Your campus. One place.</p>
            <h1 className="mt-4 text-5xl font-black leading-none tracking-[-0.08em] text-white">Your campus.<br />One place.</h1>
            <p className="mt-5 text-lg text-slate-200">Access announcements, services, events and support through one trusted student experience.</p>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ucl-blue">Welcome back</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] text-ucl-ink">Sign in</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ucl-red/10 text-ucl-red">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" onFocus={clearError}>
            <FormError message={error} />
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@ucl.lk" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Continue to UCL ONE'} <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            New student?{' '}
            <Link to="/signup" className="font-semibold text-ucl-blue hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
