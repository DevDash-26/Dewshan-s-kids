import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PackageSearch, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createLostFoundItem, resolveLostFoundItem, watchLostFoundItems } from '../../lib/collections'
import type { LostFoundItem, LostFoundKind } from '../../types/models'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button, Card, FormError, Input, Label, Select, Textarea } from '../../components/ui/Primitives'
import { EmptyState, Spinner } from '../../components/ui/Feedback'

const emptyForm = { kind: 'LOST' as LostFoundKind, itemName: '', description: '', location: '', contact: '' }

export function LostFoundPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState<LostFoundItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | LostFoundKind>('ALL')
  const [keyword, setKeyword] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const unsub = watchLostFoundItems((data) => {
      setItems(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filter !== 'ALL' && item.kind !== filter) return false
      if (!keyword.trim()) return true
      const haystack = `${item.itemName} ${item.description} ${item.location}`.toLowerCase()
      return haystack.includes(keyword.trim().toLowerCase())
    })
  }, [items, filter, keyword])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    if (!form.itemName.trim() || !form.description.trim() || !form.location.trim() || !form.contact.trim()) {
      setError('Please fill in every field.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await createLostFoundItem({ ...form, reportedBy: profile.uid, reportedByName: profile.displayName })
      setForm(emptyForm)
      setShowForm(false)
    } catch {
      setError('Could not submit your report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Lost & Found"
        description="Report a lost or found item, or search what others have reported."
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> Report an item
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <FormError message={error} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="kind">Type</Label>
                <Select id="kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as LostFoundKind })}>
                  <option value="LOST">I lost something</option>
                  <option value="FOUND">I found something</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="itemName">Item name</Label>
                <Input id="itemName" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="contact">Contact info</Label>
                <Input id="contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              </div>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit report'}
            </Button>
          </form>
        </Card>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search by item, description or location…" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="flex-1" />
        <Select value={filter} onChange={(e) => setFilter(e.target.value as 'ALL' | LostFoundKind)} className="sm:w-48">
          <option value="ALL">All items</option>
          <option value="LOST">Lost</option>
          <option value="FOUND">Found</option>
        </Select>
      </div>

      {loading ? (
        <Spinner label="Loading reports…" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No items match" icon={<PackageSearch className="h-8 w-8 text-slate-300" />} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((item) => (
            <Card key={item.id}>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge color={item.kind === 'LOST' ? 'amber' : 'blue'}>{item.kind}</Badge>
                <Badge color={item.status === 'OPEN' ? 'green' : 'neutral'}>{item.status}</Badge>
              </div>
              <h3 className="font-semibold text-slate-900">{item.itemName}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                📍 {item.location} · Contact: {item.contact}
              </p>
              {item.status === 'OPEN' && (item.reportedBy === profile?.uid) && (
                <Button variant="secondary" className="mt-3" onClick={() => resolveLostFoundItem(item.id)}>
                  Mark as resolved
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
