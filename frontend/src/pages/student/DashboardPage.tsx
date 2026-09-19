import { Link } from 'react-router-dom'
import { AlertOctagon, ArrowRight, BookOpen, CalendarDays, DoorOpen, MessageSquareText, PackageSearch, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useContentItems } from '../../hooks/useContentItems'
import { filterVisibleToStudent, sortByRelevance } from '../../lib/targeting'
import { ContentCard } from '../../components/content/ContentCard'
import { Button, Card } from '../../components/ui/Primitives'
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

  const firstName = profile?.displayName?.split(' ')[0] ?? 'Student'

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-ucl-blue/10 bg-[radial-gradient(circle_at_top_left,_rgba(18,61,122,0.18),transparent_26%),linear-gradient(135deg,#0f2557_0%,#123d7a_36%,#0d2345_100%)] p-5 text-white shadow-[0_18px_45px_rgba(13,35,69,0.18)] md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-200">UCL ONE</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.08em] md:text-5xl lg:text-6xl">
              Welcome back,<br />
              <span className="text-white/80">{firstName}</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-200 md:text-lg">
              Here is what is happening around campus, tailored to your academic journey.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <span>{profile?.faculty ?? 'Faculty'}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{profile?.programme ?? 'Programme'}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Year {profile?.yearGroup ?? '1'}</span>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-200">Campus pulse</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/8 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-200">Events</p>
                <p className="mt-2 text-2xl font-black">{events.length}</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-200">Alerts</p>
                <p className="mt-2 text-2xl font-black">{emergencies.length}</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-200">Support</p>
                <p className="mt-2 text-2xl font-black">{jobs.length}</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-200">AI</p>
                <p className="mt-2 text-2xl font-black">On</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {emergencies.length > 0 && (
        <section className="rounded-[26px] border border-red-200 bg-red-50 p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-red-900">Important notices</h2>
            <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Urgent</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {emergencies.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black tracking-[-0.05em] text-ucl-ink">Quick actions</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-ucl-red hover:shadow-[0_14px_30px_rgba(228,28,45,0.08)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-ucl-blue transition group-hover:bg-ucl-red group-hover:text-white">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">{label}</p>
                <p className="mt-1 text-sm text-slate-500">Campus access in one click</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ucl-ink">Announcements for you</h2>
            <Link to="/search" className="text-sm font-semibold text-ucl-blue hover:underline">View all</Link>
          </div>
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
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ucl-ink">Upcoming events</h2>
            <Link to="/events" className="text-sm font-semibold text-ucl-blue hover:underline">View all</Link>
          </div>
          {events.length === 0 ? (
            <EmptyState title="No upcoming events" />
          ) : (
            <div className="space-y-3">
              {events.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xl font-bold text-ucl-ink">Academic calendar</h2>
          {calendar.length === 0 ? (
            <EmptyState title="No upcoming academic dates" />
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y divide-slate-100">
                {calendar.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{item.location ?? 'Campus'}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.eventDate}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold text-ucl-ink">Jobs & internships</h2>
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

      <section className="rounded-[28px] border border-ucl-blue/10 bg-ucl-navy p-5 text-white shadow-[0_16px_35px_rgba(13,35,69,0.22)] md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">AI assistant</p>
            <h3 className="mt-2 text-3xl font-black tracking-[-0.06em] text-white">Need help finding something?</h3>
            <p className="mt-2 max-w-xl text-slate-200">Ask UCL ONE about events, deadlines, support services and campus information.</p>
          </div>
          <Link to="/ai">
            <Button className="h-12 px-5 text-base">
              Ask the AI Assistant <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
