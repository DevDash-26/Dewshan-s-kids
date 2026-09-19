import { useState, type FormEvent } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import uclLogo from '../../../images/ucl_logo.jpeg'
import { useAuth } from '../../context/AuthContext'
import { Button, FormError, Input, Label, Select } from '../../components/ui/Primitives'
import { FACULTIES, PROGRAMMES_BY_FACULTY, YEAR_GROUPS } from '../../lib/academicOptions'

export function SignupPage() {
  const { firebaseUser, signup, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [faculty, setFaculty] = useState<string>(FACULTIES[0])
  const [programme, setProgramme] = useState(PROGRAMMES_BY_FACULTY[FACULTIES[0]][0])
  const [yearGroup, setYearGroup] = useState<number>(1)
  const [submitting, setSubmitting] = useState(false)

  if (firebaseUser) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await signup({ email, password, displayName, faculty, programme, yearGroup })
      navigate('/')
    } catch {
      // error already surfaced via context
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),transparent_30%),linear-gradient(135deg,#09182d_0%,#0f2557_38%,#123d7a_100%)] px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/10 bg-white/8 shadow-[0_30px_80px_rgba(6,15,32,0.45)] backdrop-blur-sm lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[680px] overflow-hidden bg-[linear-gradient(180deg,rgba(0,0,0,0.16),rgba(0,0,0,0.8)),url('https://images.unsplash.com/photo-1562771382-15d9f1f4f8b7?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-4">
            <img src={uclLogo} alt="UCL logo" className="h-28 w-72 rounded-xl object-cover shadow-lg" />
          </div>

          <div className="max-w-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">New student account</p>
            <h1 className="mt-4 text-5xl font-black leading-none tracking-[-0.08em] text-white">Join the UCL community.</h1>
            <p className="mt-5 text-lg text-slate-200">Create your profile to access campus life, academic support and student services in one place.</p>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ucl-blue">Create account</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] text-ucl-ink">Register</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ucl-red/10 text-ucl-red">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" onFocus={clearError}>
            <FormError message={error} />
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@ucl.lk" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="faculty">Faculty</Label>
                <Select
                  id="faculty"
                  value={faculty}
                  onChange={(e) => {
                    setFaculty(e.target.value)
                    setProgramme(PROGRAMMES_BY_FACULTY[e.target.value][0])
                  }}
                >
                  {FACULTIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="programme">Programme</Label>
                <Select id="programme" value={programme} onChange={(e) => setProgramme(e.target.value)}>
                  {PROGRAMMES_BY_FACULTY[faculty].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="year">Year group</Label>
                <Select id="year" value={yearGroup} onChange={(e) => setYearGroup(Number(e.target.value))}>
                  {YEAR_GROUPS.map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create my account'} <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-ucl-blue hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
