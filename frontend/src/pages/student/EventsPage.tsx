import { useEffect, useState } from 'react'
import { CheckCircle2, Users } from 'lucide-react'
import { useContentItems } from '../../hooks/useContentItems'
import { useAuth } from '../../context/AuthContext'
import { expressEventInterest, getEventInterestCounts, getMyEventInterestIds, withdrawEventInterest } from '../../lib/collections'
import { ContentCard } from '../../components/content/ContentCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Primitives'
import { EmptyState, ServiceUnavailable, Spinner } from '../../components/ui/Feedback'

export function EventsPage() {
  const { items, loading, cmsUnavailable } = useContentItems('EVENT')
  const { profile } = useAuth()
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [myInterests, setMyInterests] = useState<Set<number>>(new Set())
  const [busyId, setBusyId] = useState<number | null>(null)

  async function refreshInterests() {
    const [countsResult, mineResult] = await Promise.all([
      getEventInterestCounts(),
      profile ? getMyEventInterestIds(profile.uid) : Promise.resolve(new Set<number>()),
    ])
    setCounts(countsResult)
    setMyInterests(mineResult)
  }

  useEffect(() => {
    refreshInterests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid])

  async function toggleInterest(contentItemId: number) {
    if (!profile) return
    setBusyId(contentItemId)
    try {
      if (myInterests.has(contentItemId)) {
        await withdrawEventInterest(contentItemId, profile.uid)
      } else {
        await expressEventInterest(contentItemId, profile.uid)
      }
      await refreshInterests()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner label="Loading events…" />
  if (cmsUnavailable) return <ServiceUnavailable service="Campus content" />

  const sorted = [...items].sort((a, b) => (a.eventDate ?? '').localeCompare(b.eventDate ?? ''))

  return (
    <div>
      <PageHeader title="Events" description="University and student-organised events. Register your interest so organisers can estimate turnout." />
      {sorted.length === 0 ? (
        <EmptyState title="No events scheduled" icon={<Users className="h-8 w-8 text-slate-300" />} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sorted.map((item) => {
            const interested = myInterests.has(item.id)
            return (
              <ContentCard
                key={item.id}
                item={item}
                actions={
                  <>
                    <Button
                      variant={interested ? 'secondary' : 'primary'}
                      disabled={busyId === item.id}
                      onClick={() => toggleInterest(item.id)}
                    >
                      {interested ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" /> Interested
                        </>
                      ) : (
                        "I'm interested"
                      )}
                    </Button>
                    <span className="flex items-center gap-1 self-center text-sm text-slate-500">
                      <Users className="h-4 w-4" /> {counts[item.id] ?? 0} interested
                    </span>
                  </>
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
