import { useEffect, useState } from 'react'
import { respondToFeedback, watchAllFeedback } from '../../../lib/collections'
import type { Feedback, RequestStatus } from '../../../types/models'
import { Badge, Button, Card, Input } from '../../../components/ui/Primitives'
import { EmptyState, Spinner } from '../../../components/ui/Feedback'

const STATUS_COLOR: Record<RequestStatus, 'amber' | 'blue' | 'green'> = { OPEN: 'amber', IN_PROGRESS: 'blue', RESOLVED: 'green' }

export function FeedbackTab() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    const unsub = watchAllFeedback((data) => {
      setItems(data)
      setLoading(false)
    })
    return unsub
  }, [])

  if (loading) return <Spinner />
  if (items.length === 0) return <EmptyState title="No feedback submitted yet" />

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="mb-1 flex items-center gap-2">
            <Badge color={STATUS_COLOR[item.status]}>{item.status}</Badge>
          </div>
          <p className="font-medium text-slate-800">{item.subject}</p>
          <p className="text-sm text-slate-500">
            {item.submittedByName}: {item.message}
          </p>
          {item.response ? (
            <div className="mt-2 rounded-md bg-blue-50 p-2 text-sm text-blue-800">Responded: {item.response}</div>
          ) : (
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Type a response…"
                value={drafts[item.id] ?? ''}
                onChange={(e) => setDrafts({ ...drafts, [item.id]: e.target.value })}
              />
              <Button
                onClick={() => {
                  const text = drafts[item.id]?.trim()
                  if (text) respondToFeedback(item.id, text)
                }}
              >
                Respond
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
