import { useEffect, useState, type FormEvent } from 'react'
import { BookOpen } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createSupportRequest, watchMySupportRequests } from '../../lib/collections'
import type { AcademicSupportRequest, RequestStatus, SupportKind } from '../../types/models'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button, Card, FormError, Input, Label, Select, Textarea } from '../../components/ui/Primitives'
import { EmptyState, Spinner } from '../../components/ui/Feedback'

const KIND_LABELS: Record<SupportKind, string> = {
  STUDY_GROUP: 'Study group',
  PEER_TUTORING: 'Peer tutoring',
  MENTORSHIP: 'Mentorship',
}

const STATUS_COLOR: Record<RequestStatus, 'amber' | 'blue' | 'green'> = {
  OPEN: 'amber',
  IN_PROGRESS: 'blue',
  RESOLVED: 'green',
}

export function AcademicSupportPage() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<AcademicSupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [kind, setKind] = useState<SupportKind>('STUDY_GROUP')
  const [subject, setSubject] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!profile) return
    const unsub = watchMySupportRequests(profile.uid, (data) => {
      setRequests(data)
      setLoading(false)
    })
    return unsub
  }, [profile])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) {
      setError('Your session hasn\'t finished loading yet — please wait a moment and try again.')
      return
    }
    if (!subject.trim() || !details.trim()) {
      setError('Please fill in the subject and details.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await createSupportRequest({ kind, subject: subject.trim(), details: details.trim(), requestedBy: profile.uid, requestedByName: profile.displayName })
      setSubject('')
      setDetails('')
    } catch {
      setError('Could not submit your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Academic Support" description="Request a study group, peer tutoring, or mentorship." />

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <FormError message={error} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="kind">Type of support</Label>
              <Select id="kind" value={kind} onChange={(e) => setKind(e.target.value as SupportKind)}>
                {Object.entries(KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Subject / module</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Data Structures" />
            </div>
          </div>
          <div>
            <Label htmlFor="details">What do you need help with?</Label>
            <Textarea id="details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit request'}
          </Button>
        </form>
      </Card>

      <h2 className="mb-3 text-lg font-semibold text-slate-800">Your requests</h2>
      {loading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <EmptyState title="No requests yet" icon={<BookOpen className="h-8 w-8 text-slate-300" />} />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge color="neutral">{KIND_LABELS[r.kind]}</Badge>
                <Badge color={STATUS_COLOR[r.status]}>{r.status.replace('_', ' ')}</Badge>
              </div>
              <h3 className="font-semibold text-slate-900">{r.subject}</h3>
              <p className="mt-1 text-sm text-slate-600">{r.details}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
