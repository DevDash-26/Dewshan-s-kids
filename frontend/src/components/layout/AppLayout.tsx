import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import uclLogo from '../../../images/ucl_logo.jpeg'
import {
  AlertOctagon,
  BookOpen,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  PackageSearch,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { isStaffOrAdmin } from '../../lib/permissions'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Home',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Discover',
    items: [{ to: '/search', label: 'Search & Discover', icon: Search }],
  },
  {
    title: 'Campus Life',
    items: [
      { to: '/events', label: 'Events', icon: CalendarDays },
      { to: '/societies', label: 'Societies', icon: Users },
    ],
  },
  {
    title: 'Services',
    items: [
      { to: '/rooms', label: 'Room Booking', icon: DoorOpen },
      { to: '/lost-found', label: 'Lost & Found', icon: PackageSearch },
      { to: '/academic-support', label: 'Academic Support', icon: BookOpen },
    ],
  },
  {
    title: 'Support',
    items: [
      { to: '/facility-issues', label: 'Report an Issue', icon: AlertOctagon },
      { to: '/feedback', label: 'Feedback', icon: MessageSquareText },
    ],
  },
  {
    title: 'AI',
    items: [{ to: '/ai', label: 'AI Assistant', icon: Sparkles }],
  },
]

const STAFF_NAV: NavItem[] = [{ to: '/staff', label: 'Staff Console', icon: ClipboardList }]

export function AppLayout() {
  const { profile, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [...NAV_GROUPS.flatMap((group) => group.items), ...(isStaffOrAdmin(profile?.role) ? STAFF_NAV : [])]

  const pageTitle = navItems.find((item) => item.to === location.pathname)?.label ?? 'UCL ONE'

  const initials = profile?.displayName
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'ST'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-[#0a0a0a] text-white md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <img src={uclLogo} alt="UCL logo" className="h-14 w-36 rounded-md object-cover object-center shadow-sm" />
            <div className="leading-none">
              <div className="ucl-wordmark-tag">Universal College</div>
              <div className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-200">Lanka</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 px-3 py-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{group.title}</p>
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-white text-ucl-navy shadow-[0_8px_18px_rgba(255,255,255,0.18)]'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {isStaffOrAdmin(profile?.role) && (
            <div>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Staff</p>
              {STAFF_NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive ? 'bg-white text-ucl-navy' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ucl-red text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{profile?.displayName ?? 'Student'}</p>
              <p className="truncate text-[11px] uppercase tracking-[0.18em] text-slate-300">{profile?.role ?? 'STUDENT'}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="ucl-surface sticky top-0 z-20 border-b border-slate-200 px-4 py-3 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Toggle navigation"
                onClick={() => setMobileOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden"
              >
                {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
              </button>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ucl-blue">Campus portal</p>
                <h2 className="text-base font-bold text-ucl-ink md:text-lg">{pageTitle}</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ucl-blue sm:block">
                {profile?.role ?? 'STUDENT'}
              </div>
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ucl-red text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-slate-800">{profile?.displayName ?? 'Student'}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{profile?.faculty ?? 'Student'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {mobileOpen && (
          <div className="border-b border-slate-200 bg-white md:hidden">
            <nav className="space-y-2 px-3 py-3">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-ucl-navy text-white' : 'bg-slate-50 text-slate-700'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => logout()}
                className="mt-2 flex w-full items-center justify-start gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700"
              >
                <LogOut className="h-4 w-4" aria-hidden /> Sign out
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
