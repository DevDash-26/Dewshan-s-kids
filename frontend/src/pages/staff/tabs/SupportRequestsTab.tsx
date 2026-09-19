import { useEffect, useState } from 'react'
import { updateSupportRequestStatus, watchAllSupportRequests } from '../../../lib/collections'
import type { AcademicSupportRequest, RequestStatus } from '../../../types/models'
import { Badge, Card, Select } from '../../../components/ui/Primitives'
import { EmptyState, Spinner } from '../../../components/ui/Feedback'

const STATUS_COLOR: Record<RequestStatus, 'amber' | 'blue' | 'green'> = { OPEN: 'amber', IN_PROGRESS: 'blue', RESOLVED: 'green' }

export function SupportRequestsTab() {
  const [requests, setRequests] = useState<AcademicSupportRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = watchAllSupportRequests((data) => {
      setRequests(data)
      setLoading(false)
    })
    return unsub
  }, [])

  if (loading) return <Spinner />
  if (requests.length === 0) return <EmptyState title="No academic support requests yet" />

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex gap-2">
              <Badge color="neutral">{r.kind.replace('_', ' ')}</Badge>
              <Badge color={STATUS_COLOR[r.status]}>{r.status.replace('_', ' ')}</Badge>
            </div>
            <p className="font-medium text-slate-800">{r.subject}</p>
            <p className="text-sm text-slate-500">
              {r.requestedByName}: {r.details}
            </p>
          </div>
          <Select
            className="w-40"
            value={r.status}
            onChange={(e) => updateSupportRequestStatus(r.id, e.target.value as RequestStatus)}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
        </Card>
      ))}
    </div>
  )
}
