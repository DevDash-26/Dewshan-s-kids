import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { BookingsTab } from './tabs/BookingsTab'
import { SupportRequestsTab } from './tabs/SupportRequestsTab'
import { FeedbackTab } from './tabs/FeedbackTab'
import { FacilityIssuesTab } from './tabs/FacilityIssuesTab'
import { RoomsTab } from './tabs/RoomsTab'

const TABS = ['Room Bookings', 'Academic Support', 'Feedback', 'Facility Issues', 'Rooms'] as const
type Tab = (typeof TABS)[number]

export function StaffConsolePage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('Room Bookings')

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
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
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
    </div>
  )
}
