import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { hasPermission } from '../../lib/permissions'
import { PageHeader } from '../../components/ui/PageHeader'
import { BookingsTab } from './tabs/BookingsTab'
import { SupportRequestsTab } from './tabs/SupportRequestsTab'
import { FeedbackTab } from './tabs/FeedbackTab'
import { FacilityIssuesTab } from './tabs/FacilityIssuesTab'
import { RoomsTab } from './tabs/RoomsTab'

const TABS = ['Room Bookings', 'Academic Support', 'Feedback', 'Facility Issues', 'Rooms', 'Content'] as const
type Tab = (typeof TABS)[number]

export function StaffConsolePage() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const initialTab = requestedTab === 'rooms' ? 'Rooms' : requestedTab === 'content' ? 'Content' : 'Room Bookings'
  const [tab, setTab] = useState<Tab | 'Content'>(initialTab)

  const STRAPI_URL = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'

  return (
    <div>
      <PageHeader
        title="Staff Console"
        description="Manage transactional student requests. Announcements, events, societies and other informational content are published in the CMS admin panel."
      />

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        Manage announcements, events, societies, FAQs and other campus content in{' '}
        <a href={`${STRAPI_URL}/admin`} target="_blank" rel="noreferrer" className="font-medium underline">
          the CMS admin panel
        </a>
        .
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.filter((t) => t !== 'Rooms' || profile?.role === 'ADMIN' || hasPermission(profile?.role, 'room:manage')).filter((t) => t !== 'Academic Support' || profile?.role === 'ADMIN' || hasPermission(profile?.role, 'support:manage')).filter((t) => t !== 'Facility Issues' || profile?.role === 'ADMIN' || hasPermission(profile?.role, 'lostfound:manage')).filter((t) => t !== 'Content' || profile?.role !== 'STUDENT').map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearchParams(t === 'Rooms' ? { tab: 'rooms' } : {}) }}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t ? 'border-ucl-blue text-ucl-blue' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Room Bookings' && <BookingsTab decidedBy={profile?.uid ?? ''} />}
      {tab === 'Academic Support' && <SupportRequestsTab />}
      {tab === 'Feedback' && <FeedbackTab />}
      {tab === 'Facility Issues' && <FacilityIssuesTab />}
      {tab === 'Rooms' && <RoomsTab />}
      {tab === 'Content' && <div className="rounded-2xl border border-[#e8e8ea] bg-white p-6 text-sm text-[#6e7077]">Content publishing is managed in the Strapi CMS. Use the CMS admin link above to update announcements, events, FAQs and campus services.</div>}
    </div>
  )
}
