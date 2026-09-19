import { useEffect, useState } from 'react'
import { updateFacilityIssueStatus, watchFacilityIssues } from '../../../lib/collections'
import type { FacilityIssue, RequestStatus } from '../../../types/models'
import { Badge, Card, Select } from '../../../components/ui/Primitives'
import { EmptyState, Spinner } from '../../../components/ui/Feedback'

const STATUS_COLOR: Record<RequestStatus, 'amber' | 'blue' | 'green'> = { OPEN: 'amber', IN_PROGRESS: 'blue', RESOLVED: 'green' }

export function FacilityIssuesTab() {
  const [issues, setIssues] = useState<FacilityIssue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = watchFacilityIssues((data) => {
      setIssues(data)
      setLoading(false)
    })
    return unsub
  }, [])

  if (loading) return <Spinner />
  if (issues.length === 0) return <EmptyState title="No facility issues reported" />

  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <Card key={issue.id} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex gap-2">
              <Badge color="neutral">{issue.issueType.replace('_', ' ')}</Badge>
              <Badge color={STATUS_COLOR[issue.status]}>{issue.status.replace('_', ' ')}</Badge>
            </div>
            <p className="font-medium text-slate-800">{issue.location}</p>
            <p className="text-sm text-slate-500">{issue.description}</p>
          </div>
          <Select
            className="w-40"
            value={issue.status}
            onChange={(e) => updateFacilityIssueStatus(issue.id, e.target.value as RequestStatus)}
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
