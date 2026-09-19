import { NavLink, Outlet } from 'react-router-dom'
import {
  AlertOctagon,
  BookOpen,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  PackageSearch,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { isStaffOrAdmin } from '../../lib/permissions'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const STUDENT_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/search', label: 'Search & Discover', icon: Search },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/societies', label: 'Societies', icon: Users },
  { to: '/rooms', label: 'Room Booking', icon: DoorOpen },
  { to: '/lost-found', label: 'Lost & Found', icon: PackageSearch },
  { to: '/academic-support', label: 'Academic Support', icon: BookOpen },
  { to: '/facility-issues', label: 'Report an Issue', icon: AlertOctagon },
  { to: '/feedback', label: 'Feedback', icon: MessageSquareText },
  { to: '/ai', label: 'AI Assistant', icon: Sparkles },
]

const STAFF_NAV: NavItem[] = [{ to: '/staff', label: 'Staff Console', icon: ClipboardList }]

export function AppLayout() {
  const { profile, logout } = useAuth()

  const navItems = [...STUDENT_NAV, ...(isStaffOrAdmin(profile?.role) ? STAFF_NAV : [])]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-ucl-navy text-white md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <Sparkles className="h-6 w-6 text-ucl-gold" aria-hidden />
          <span className="text-lg font-bold tracking-tight">UCL ONE</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium">{profile?.displayName}</p>
          <p className="truncate text-xs text-slate-400">{profile?.role}</p>
          <button
            onClick={() => logout()}
            className="mt-3 flex items-center gap-2 text-sm text-slate-300 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <MobileTopbar navItems={navItems} />
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function MobileTopbar({ navItems }: { navItems: typeof STUDENT_NAV }) {
  const { logout } = useAuth()
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
      <span className="text-lg font-bold text-ucl-navy">UCL ONE</span>
      <select
        aria-label="Navigate"
        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        onChange={(e) => {
          if (e.target.value === '__logout') logout()
          else window.location.assign(e.target.value)
        }}
        defaultValue=""
      >
        <option value="" disabled>
          Menu
        </option>
        {navItems.map((item) => (
          <option key={item.to} value={item.to}>
            {item.label}
          </option>
        ))}
        <option value="__logout">Sign out</option>
      </select>
    </header>
  )
}
