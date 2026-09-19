import { useEffect, useState, type FormEvent } from 'react'
import { MessageSquareText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { submitFeedback, watchMyFeedback } from '../../lib/collections'
import type { Feedback, RequestStatus } from '../../types/models'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button, Card, FormError, Input, Label, Textarea } from '../../components/ui/Primitives'
import { EmptyState, Spinner } from '../../components/ui/Feedback'

const STATUS_COLOR: Record<RequestStatus, 'amber' | 'blue' | 'green'> = { OPEN: 'amber', IN_PROGRESS: 'blue', RESOLVED: 'green' }

export function FeedbackPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!profile) return
    const unsub = watchMyFeedback(profile.uid, (data) => {
      setItems(data)
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
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in both fields.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await submitFeedback({ subject: subject.trim(), message: message.trim(), submittedBy: profile.uid, submittedByName: profile.displayName })
      setSubject('')
      setMessage('')
    } catch {
      setError('Could not submit your feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Feedback & Questions" description="Raise something not already covered elsewhere on UCL ONE." />

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <FormError message={error} />
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send feedback'}
          </Button>
        </form>
      </Card>

      <h2 className="mb-3 text-lg font-semibold text-slate-800">Your submissions</h2>
      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="No feedback submitted yet" icon={<MessageSquareText className="h-8 w-8 text-slate-300" />} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="mb-1 flex items-center gap-2">
                <Badge color={STATUS_COLOR[item.status]}>{item.status}</Badge>
              </div>
              <h3 className="font-semibold text-slate-900">{item.subject}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.message}</p>
              {item.response && (
                <div className="mt-2 rounded-md bg-blue-50 p-2 text-sm text-blue-800">
                  <span className="font-medium">Staff response: </span>
                  {item.response}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
