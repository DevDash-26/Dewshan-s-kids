import { useEffect, useState, type FormEvent } from 'react'
import { AlertOctagon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { reportFacilityIssue, watchFacilityIssues } from '../../lib/collections'
import type { FacilityIssue, FacilityIssueType, RequestStatus } from '../../types/models'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button, Card, FormError, Input, Label, Select, Textarea } from '../../components/ui/Primitives'
import { EmptyState, Spinner } from '../../components/ui/Feedback'

const TYPE_LABELS: Record<FacilityIssueType, string> = {
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  FURNITURE: 'Furniture',
  CLEANLINESS: 'Cleanliness',
  IT_EQUIPMENT: 'IT Equipment',
  OTHER: 'Other',
}

const STATUS_COLOR: Record<RequestStatus, 'amber' | 'blue' | 'green'> = { OPEN: 'amber', IN_PROGRESS: 'blue', RESOLVED: 'green' }

export function FacilityIssuesPage() {
  const { profile } = useAuth()
  const [issues, setIssues] = useState<FacilityIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [issueType, setIssueType] = useState<FacilityIssueType>('ELECTRICAL')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [onlyMine, setOnlyMine] = useState(false)

  useEffect(() => {
    const unsub = watchFacilityIssues((data) => {
      setIssues(data)
      setLoading(false)
    })
    return unsub
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    if (!location.trim() || !description.trim()) {
      setError('Please describe the location and issue.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await reportFacilityIssue({ issueType, location: location.trim(), description: description.trim(), reportedBy: profile.uid, reportedByName: profile.displayName })
      setLocation('')
      setDescription('')
    } catch {
      setError('Could not submit your report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const visible = onlyMine ? issues.filter((i) => i.reportedBy === profile?.uid) : issues

  return (
    <div>
      <PageHeader title="Report a Facility Issue" description="Report maintenance or facility problems around campus." />

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <FormError message={error} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="issueType">Issue type</Label>
              <Select id="issueType" value={issueType} onChange={(e) => setIssueType(e.target.value as FacilityIssueType)}>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Block B, Room 105" />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit report'}
          </Button>
        </form>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Reported issues</h2>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> Only mine
        </label>
      </div>

      {loading ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <EmptyState title="No issues reported" icon={<AlertOctagon className="h-8 w-8 text-slate-300" />} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((issue) => (
            <Card key={issue.id}>
              <div className="mb-1 flex flex-wrap gap-2">
                <Badge color="neutral">{TYPE_LABELS[issue.issueType]}</Badge>
                <Badge color={STATUS_COLOR[issue.status]}>{issue.status.replace('_', ' ')}</Badge>
              </div>
              <h3 className="font-semibold text-slate-900">{issue.location}</h3>
              <p className="mt-1 text-sm text-slate-600">{issue.description}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
