import { useEffect, useState, type FormEvent } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { watchRooms } from '../../../lib/collections'
import type { Room } from '../../../types/models'
import { useAuth } from '../../../context/AuthContext'
import { Button, Card, FormError, Input, Label } from '../../../components/ui/Primitives'
import { EmptyState, Spinner } from '../../../components/ui/Feedback'

export function RoomsTab() {
  const { profile } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [building, setBuilding] = useState('')
  const [capacity, setCapacity] = useState(10)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const unsub = watchRooms((data) => {
      setRooms(data)
      setLoading(false)
    })
    return unsub
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !building.trim()) {
      setError('Please fill in room name and building.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const id = name.trim().toLowerCase().replace(/\s+/g, '-')
      await setDoc(doc(db, 'rooms', id), { name: name.trim(), building: building.trim(), capacity, features: [] })
      setName('')
      setBuilding('')
      setCapacity(10)
    } catch {
      setError('Only administrators can manage rooms.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {profile?.role === 'ADMIN' && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label htmlFor="roomName">Room name</Label>
              <Input id="roomName" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="building">Building</Label>
              <Input id="building" value={building} onChange={(e) => setBuilding(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={submitting} className="w-full">
                Add room
              </Button>
            </div>
          </form>
          <div className="mt-2">
            <FormError message={error} />
          </div>
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : rooms.length === 0 ? (
        <EmptyState title="No rooms configured yet" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id}>
              <h3 className="font-semibold text-slate-900">{room.name}</h3>
              <p className="text-sm text-slate-500">
                {room.building} · Capacity {room.capacity}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
