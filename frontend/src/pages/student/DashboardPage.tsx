import { Link } from 'react-router-dom'
import { AlertOctagon, BookOpen, CalendarDays, DoorOpen, MessageSquareText, PackageSearch, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useContentItems } from '../../hooks/useContentItems'
import { filterVisibleToStudent, sortByRelevance } from '../../lib/targeting'
import { ContentCard } from '../../components/content/ContentCard'
import { Card } from '../../components/ui/Primitives'
import { EmptyState, ServiceUnavailable, Spinner } from '../../components/ui/Feedback'

const QUICK_ACTIONS = [
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/societies', label: 'Societies', icon: Users },
  { to: '/rooms', label: 'Book a Room', icon: DoorOpen },
  { to: '/lost-found', label: 'Lost & Found', icon: PackageSearch },
  { to: '/academic-support', label: 'Academic Support', icon: BookOpen },
  { to: '/facility-issues', label: 'Report an Issue', icon: AlertOctagon },
  { to: '/feedback', label: 'Feedback', icon: MessageSquareText },
  { to: '/ai', label: 'Ask the AI Assistant', icon: Sparkles },
]

export function DashboardPage() {
  const { profile } = useAuth()
  const { items, loading, cmsUnavailable } = useContentItems()

  if (loading) return <Spinner label="Loading your dashboard…" />
  if (cmsUnavailable) return <ServiceUnavailable service="Campus content" />

  const emergencies = items.filter((i) => i.isEmergency)
  const announcements = sortByRelevance(
    items.filter((i) => i.category === 'ANNOUNCEMENT' && !i.isEmergency),
    profile,
  ).slice(0, 4)
  const events = items
    .filter((i) => i.category === 'EVENT')
    .sort((a, b) => (a.eventDate ?? '').localeCompare(b.eventDate ?? ''))
    .slice(0, 3)
  // BR2: the dashboard is a personalised view, so content targeted
  // exclusively at another faculty/programme/year is excluded here (not
  // just sorted lower) - see lib/targeting.ts. Search & Discover
  // deliberately does not apply this filter, since browsing everything is
  // its whole point.
  const jobs = filterVisibleToStudent(
    items.filter((i) => i.category === 'JOB'),
    profile,
  ).slice(0, 3)
  const calendar = filterVisibleToStudent(
    items.filter((i) => i.category === 'ACADEMIC_CALENDAR'),
    profile,
  )
    .sort((a, b) => (a.eventDate ?? '').localeCompare(b.eventDate ?? ''))
    .slice(0, 3)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {profile?.displayName?.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {profile?.faculty} · {profile?.programme} · Year {profile?.yearGroup}
        </p>
      </div>

      {emergencies.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-red-700">Urgent notices</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {emergencies.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center text-sm font-medium text-slate-700 shadow-sm transition hover:border-ucl-blue hover:text-ucl-blue"
            >
              <Icon className="h-6 w-6" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Announcements for you</h2>
          {announcements.length === 0 ? (
            <EmptyState title="No announcements right now" />
          ) : (
            <div className="space-y-3">
              {announcements.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Upcoming events</h2>
          {events.length === 0 ? (
            <EmptyState title="No upcoming events" />
          ) : (
            <div className="space-y-3">
              {events.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
          <Link to="/events" className="mt-2 inline-block text-sm font-medium text-ucl-blue hover:underline">
            View all events →
          </Link>
        </section>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Academic calendar highlights</h2>
          {calendar.length === 0 ? (
            <EmptyState title="No upcoming academic dates" />
          ) : (
            <Card>
              <ul className="divide-y divide-slate-100">
                {calendar.map((item) => (
                  <li key={item.id} className="flex justify-between py-2 text-sm">
                    <span className="text-slate-700">{item.title}</span>
                    <span className="text-slate-400">{item.eventDate}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Jobs & internships</h2>
          {jobs.length === 0 ? (
            <EmptyState title="No listings right now" />
          ) : (
            <div className="space-y-3">
              {jobs.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
