import { useEffect, useState } from 'react'
import { CheckCircle2, Users } from 'lucide-react'
import { useContentItems } from '../../hooks/useContentItems'
import { useAuth } from '../../context/AuthContext'
import { getMySocietyInterestIds, joinSociety } from '../../lib/collections'
import { ContentCard } from '../../components/content/ContentCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Primitives'
import { EmptyState, ServiceUnavailable, Spinner } from '../../components/ui/Feedback'

export function SocietiesPage() {
  const { items, loading, cmsUnavailable } = useContentItems('SOCIETY')
  const { profile } = useAuth()
  const [joined, setJoined] = useState<Set<number>>(new Set())
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    if (profile) getMySocietyInterestIds(profile.uid).then(setJoined)
  }, [profile])

  async function handleJoin(contentItemId: number) {
    if (!profile || joined.has(contentItemId)) return
    setBusyId(contentItemId)
    try {
      await joinSociety({ contentItemId, studentId: profile.uid, studentName: profile.displayName, message: null })
      setJoined((prev) => new Set(prev).add(contentItemId))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner label="Loading societies…" />
  if (cmsUnavailable) return <ServiceUnavailable service="Campus content" />

  return (
    <div>
      <PageHeader title="Societies" description="Discover student societies and express your interest in joining." />
      {items.length === 0 ? (
        <EmptyState title="No societies listed yet" icon={<Users className="h-8 w-8 text-slate-300" />} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              actions={
                <Button
                  variant={joined.has(item.id) ? 'secondary' : 'primary'}
                  disabled={busyId === item.id || !profile || joined.has(item.id)}
                  onClick={() => handleJoin(item.id)}
                >
                  {joined.has(item.id) ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Interest sent
                    </>
                  ) : (
                    'Express interest'
                  )}
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
