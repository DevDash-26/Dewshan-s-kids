import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { hasPermission, type Permission } from '../../lib/permissions'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/Feedback'
import { BookingsTab } from './tabs/BookingsTab'
import { SupportRequestsTab } from './tabs/SupportRequestsTab'
import { FeedbackTab } from './tabs/FeedbackTab'
import { FacilityIssuesTab } from './tabs/FacilityIssuesTab'
import { RoomsTab } from './tabs/RoomsTab'
import { SocietySignupsTab } from './tabs/SocietySignupsTab'

// BR12: which tab a staff member can see depends on their department (an
// ADMIN always sees every tab). This is a UI convenience only - the actual
// enforcement is server-side in firestore.rules (isAdminOrDepartment), so a
// staff member who somehow reached a tab outside their department would
// still have every write rejected there.
const TAB_DEFINITIONS: { label: string; permission: Permission }[] = [
  { label: 'Room Bookings', permission: 'booking:decide' },
  { label: 'Academic Support', permission: 'support:manage' },
  { label: 'Feedback', permission: 'feedback:manage' },
  { label: 'Facility Issues', permission: 'facility:manage' },
  { label: 'Society Sign-ups', permission: 'society:manage' },
  { label: 'Rooms', permission: 'room:manage' },
]

export function StaffConsolePage() {
  const { profile } = useAuth()
  const visibleTabs = TAB_DEFINITIONS.filter((t) => hasPermission(profile?.role, profile?.staffDepartment ?? null, t.permission))
  const [tab, setTab] = useState<string | null>(visibleTabs[0]?.label ?? null)

  const STRAPI_URL = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'

  return (
    <div>
      <PageHeader
        title="Staff Console"
        description={
          profile?.role === 'STAFF'
            ? `Department: ${profile.staffDepartment ?? 'unassigned'}. You can only manage requests within your department; an administrator can manage all of them.`
            : 'Manage transactional student requests. Announcements, events, societies and other informational content are published in the CMS admin panel.'
        }
      />

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        Manage announcements, events, societies, FAQs and other campus content in{' '}
        <a href={`${STRAPI_URL}/admin`} target="_blank" rel="noreferrer" className="font-medium underline">
          the CMS admin panel
        </a>
        .
      </div>

      {visibleTabs.length === 0 ? (
        <EmptyState
          title="No actions available for your department"
          description="Your staff account isn't assigned to a department with a matching action yet. Ask an administrator to assign one."
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
            {visibleTabs.map(({ label }) => (
              <button
                key={label}
                onClick={() => setTab(label)}
                className={`border-b-2 px-3 py-2 text-sm font-medium ${
                  tab === label ? 'border-ucl-blue text-ucl-blue' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'Room Bookings' && <BookingsTab decidedBy={profile?.uid ?? ''} />}
          {tab === 'Academic Support' && <SupportRequestsTab />}
          {tab === 'Feedback' && <FeedbackTab />}
          {tab === 'Facility Issues' && <FacilityIssuesTab />}
          {tab === 'Society Sign-ups' && <SocietySignupsTab />}
          {tab === 'Rooms' && <RoomsTab />}
        </>
      )}
    </div>
  )
}
