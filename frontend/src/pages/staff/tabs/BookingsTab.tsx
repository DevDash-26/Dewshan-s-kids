import { useEffect, useState } from 'react'
import { decideBooking, watchAllBookings } from '../../../lib/collections'
import type { RoomBooking } from '../../../types/models'
import { Badge, Button, Card, FormError } from '../../../components/ui/Primitives'
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
  const [error, setError] = useState<string | null>(null)
  const [decidingId, setDecidingId] = useState<string | null>(null)

  useEffect(() => {
    const unsub = watchAllBookings((data) => {
      setBookings(data)
      setLoading(false)
    })
    return unsub
  }, [])

  async function handleDecide(bookingId: string, status: 'APPROVED' | 'REJECTED') {
    setError(null)
    setDecidingId(bookingId)
    try {
      await decideBooking(bookingId, status, decidedBy)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this booking. Please try again.')
    } finally {
      setDecidingId(null)
    }
  }

  if (loading) return <Spinner />
  if (bookings.length === 0) return <EmptyState title="No booking requests yet" />

  const pending = bookings.filter((b) => b.status === 'PENDING')
  const decided = bookings.filter((b) => b.status !== 'PENDING')

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 font-semibold text-slate-800">Pending ({pending.length})</h2>
        <div className="mb-3">
          <FormError message={error} />
        </div>
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
                  <Button disabled={decidingId === b.id} onClick={() => handleDecide(b.id, 'APPROVED')}>
                    {decidingId === b.id ? 'Checking…' : 'Approve'}
                  </Button>
                  <Button variant="danger" disabled={decidingId === b.id} onClick={() => handleDecide(b.id, 'REJECTED')}>
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
