import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { watchAllSocietyInterests } from '../../../lib/collections'
import { fetchContentItems } from '../../../lib/strapi'
import type { ContentItem, SocietyInterest } from '../../../types/models'
import { Card } from '../../../components/ui/Primitives'
import { EmptyState, ServiceUnavailable, Spinner } from '../../../components/ui/Feedback'

// BR12 (SOCIETY department): a read-only roster of who has signed up for
// which society, so a society-department staff member can follow up without
// needing to ask a student directly or dig through the CMS.
export function SocietySignupsTab() {
  const [interests, setInterests] = useState<SocietyInterest[]>([])
  const [societies, setSocieties] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cmsUnavailable, setCmsUnavailable] = useState(false)

  useEffect(() => {
    fetchContentItems({ category: 'SOCIETY' })
      .then(setSocieties)
      .catch(() => setCmsUnavailable(true))
  }, [])

  useEffect(() => {
    const unsub = watchAllSocietyInterests((data) => {
      setInterests(data)
      setLoading(false)
    })
    return unsub
  }, [])

  if (loading) return <Spinner />
  if (cmsUnavailable) return <ServiceUnavailable service="Campus content" />
  if (interests.length === 0) return <EmptyState title="No society sign-ups yet" icon={<Users className="h-8 w-8 text-slate-300" />} />

  const societyTitle = (contentItemId: number) => societies.find((s) => s.id === contentItemId)?.title ?? `Society #${contentItemId}`

  return (
    <Card>
      <ul className="divide-y divide-slate-100">
        {interests
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((interest) => (
            <li key={interest.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium text-slate-800">{societyTitle(interest.contentItemId)}</p>
                <p className="text-sm text-slate-500">{interest.studentName}</p>
              </div>
            </li>
          ))}
      </ul>
    </Card>
  )
}
