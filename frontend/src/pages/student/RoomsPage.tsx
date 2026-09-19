import { useEffect, useState } from 'react'
import { CheckCircle2, DoorOpen, XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  cancelBooking,
  createBooking,
  listBookingsForRoomAndDate,
  timeRangesOverlap,
  watchMyBookings,
  watchRooms,
} from '../../lib/collections'
import type { Room, RoomBooking } from '../../types/models'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button, Card, FormError, Input, Label, Textarea } from '../../components/ui/Primitives'
import { EmptyState, Spinner } from '../../components/ui/Feedback'

const STATUS_COLOR: Record<RoomBooking['status'], 'neutral' | 'green' | 'red' | 'amber'> = {
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'neutral',
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function RoomsPage() {
  const { profile } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [myBookings, setMyBookings] = useState<RoomBooking[]>([])

  const [date, setDate] = useState(today())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [purpose, setPurpose] = useState('')
  const [availableRoomIds, setAvailableRoomIds] = useState<Set<string> | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittingRoomId, setSubmittingRoomId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const unsub = watchRooms((r) => {
      setRooms(r)
      setLoadingRooms(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!profile) return
    return watchMyBookings(profile.uid, setMyBookings)
  }, [profile])

  async function checkAvailability() {
    setError(null)
    setSuccessMessage(null)
    if (!date || !startTime || !endTime) {
      setError('Please select a date, start time and end time.')
      return
    }
    if (startTime >= endTime) {
      setError('End time must be after start time.')
      return
    }
    setChecking(true)
    try {
      const available = new Set<string>()
      for (const room of rooms) {
        const bookings = await listBookingsForRoomAndDate(room.id, date)
        const conflict = bookings.some((b) => timeRangesOverlap(startTime, endTime, b.startTime, b.endTime))
        if (!conflict) available.add(room.id)
      }
      setAvailableRoomIds(available)
    } finally {
      setChecking(false)
    }
  }

  async function requestRoom(room: Room) {
    if (!profile) return
    if (!purpose.trim()) {
      setError('Please describe the purpose of your booking.')
      return
    }
    setSubmittingRoomId(room.id)
    setError(null)
    try {
      // Re-validate immediately before writing to shrink (not eliminate) the
      // race window; a real deployment would enforce this atomically with a
      // server-side transaction (see README > Known Limitations).
      const bookings = await listBookingsForRoomAndDate(room.id, date)
      const conflict = bookings.some((b) => timeRangesOverlap(startTime, endTime, b.startTime, b.endTime))
      if (conflict) {
        setError(`${room.name} was just booked for an overlapping time. Please check availability again.`)
        setAvailableRoomIds((prev) => {
          const next = new Set(prev)
          next.delete(room.id)
          return next
        })
        return
      }
      await createBooking({
        roomId: room.id,
        roomName: room.name,
        requestedBy: profile.uid,
        requestedByName: profile.displayName,
        purpose: purpose.trim(),
        date,
        startTime,
        endTime,
        status: 'PENDING',
      })
      setSuccessMessage(`Request sent for ${room.name}. You'll see the status below once staff review it.`)
      setAvailableRoomIds(null)
    } finally {
      setSubmittingRoomId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Classroom Booking" description="Check room availability and request a space for study or group work." />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="start">Start time</Label>
            <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="end">End time</Label>
            <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={checkAvailability} disabled={checking || loadingRooms} className="w-full">
              {checking ? 'Checking…' : 'Check availability'}
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="purpose">Purpose</Label>
          <Textarea id="purpose" rows={2} placeholder="e.g. Group project discussion for CS204" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </div>
        <div className="mt-3">
          <FormError message={error} />
          {successMessage && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</p>}
        </div>
      </Card>

      {loadingRooms ? (
        <Spinner label="Loading rooms…" />
      ) : rooms.length === 0 ? (
        <EmptyState title="No rooms configured" icon={<DoorOpen className="h-8 w-8 text-slate-300" />} />
      ) : (
        availableRoomIds && (
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => {
              const isAvailable = availableRoomIds.has(room.id)
              return (
                <Card key={room.id} className={isAvailable ? '' : 'opacity-50'}>
                  <h3 className="font-semibold text-slate-900">{room.name}</h3>
                  <p className="text-sm text-slate-500">
                    {room.building} · Capacity {room.capacity}
                  </p>
                  {room.features.length > 0 && <p className="mt-1 text-xs text-slate-400">{room.features.join(', ')}</p>}
                  <div className="mt-3">
                    {isAvailable ? (
                      <Button onClick={() => requestRoom(room)} disabled={submittingRoomId === room.id}>
                        {submittingRoomId === room.id ? 'Sending…' : 'Request this room'}
                      </Button>
                    ) : (
                      <Badge color="red">Unavailable at this time</Badge>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">My booking requests</h2>
        {myBookings.length === 0 ? (
          <EmptyState title="No booking requests yet" />
        ) : (
          <Card>
            <ul className="divide-y divide-slate-100">
              {myBookings
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium text-slate-800">
                        {b.roomName} — {b.date} {b.startTime}–{b.endTime}
                      </p>
                      <p className="text-sm text-slate-500">{b.purpose}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={STATUS_COLOR[b.status]}>{b.status}</Badge>
                      {b.status === 'PENDING' && (
                        <Button variant="ghost" onClick={() => cancelBooking(b.id)}>
                          <XCircle className="h-4 w-4" /> Cancel
                        </Button>
                      )}
                      {b.status === 'APPROVED' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                  </li>
                ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  )
}
