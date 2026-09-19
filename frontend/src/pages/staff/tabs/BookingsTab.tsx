import { useEffect, useState } from 'react'
import { decideBooking, watchAllBookings } from '../../../lib/collections'
import type { RoomBooking } from '../../../types/models'
import { Badge, Button, Card } from '../../../components/ui/Primitives'
import { EmptyState, Spinner } from '../../../components/ui/Feedback'

const STATUS_COLOR: Record<RoomBooking['status'], 'neutral' | 'green' | 'red' | 'amber'> = {
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'neutral',
}

export function BookingsTab({ decidedBy }: { decidedBy: string }) {
  const [bookings, setBookings] = useState<RoomBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = watchAllBookings((data) => {
      setBookings(data)
      setLoading(false)
    })
    return unsub
  }, [])

  if (loading) return <Spinner />
  if (bookings.length === 0) return <EmptyState title="No booking requests yet" />

  const pending = bookings.filter((b) => b.status === 'PENDING')
  const decided = bookings.filter((b) => b.status !== 'PENDING')

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 font-semibold text-slate-800">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <EmptyState title="No pending requests" />
        ) : (
          <div className="space-y-3">
            {pending.map((b) => (
              <Card key={b.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800">
                    {b.roomName} — {b.date} {b.startTime}–{b.endTime}
                  </p>
                  <p className="text-sm text-slate-500">
                    {b.requestedByName}: {b.purpose}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => decideBooking(b.id, 'APPROVED', decidedBy)}>Approve</Button>
                  <Button variant="danger" onClick={() => decideBooking(b.id, 'REJECTED', decidedBy)}>
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-slate-800">History</h2>
        <Card>
          <ul className="divide-y divide-slate-100">
            {decided.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  {b.roomName} — {b.date} {b.startTime}–{b.endTime} ({b.requestedByName})
                </span>
                <Badge color={STATUS_COLOR[b.status]}>{b.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  )
}
