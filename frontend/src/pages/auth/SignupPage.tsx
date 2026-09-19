import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
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
    <div className="flex min-h-screen items-center justify-center bg-ucl-navy px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Sparkles className="h-8 w-8 text-ucl-blue" aria-hidden />
          <h1 className="text-xl font-bold text-slate-900">Create your student account</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" onFocus={clearError}>
          <FormError message={error} />
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
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
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
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
            <div className="col-span-2">
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
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-ucl-blue hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
