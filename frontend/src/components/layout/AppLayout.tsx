import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AlertOctagon, BookOpen, CalendarDays, ClipboardList, DoorOpen, LayoutDashboard, LogOut, Menu, MessageSquareText, PackageSearch, Search, Settings, Sparkles, Users, X, type LucideIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { hasPermission } from '../../lib/permissions'

type NavItem = readonly [string, string, LucideIcon, boolean?]
const studentNav: NavItem[] = [
  ['/', 'Dashboard', LayoutDashboard, true], ['/search', 'Search & Discover', Search], ['/events', 'Events', CalendarDays], ['/societies', 'Societies', Users], ['/rooms', 'Room Booking', DoorOpen], ['/lost-found', 'Lost & Found', PackageSearch], ['/academic-support', 'Academic Support', BookOpen], ['/facility-issues', 'Report an Issue', AlertOctagon], ['/feedback', 'Feedback', MessageSquareText], ['/ai', 'AI Assistant', Sparkles],
] as const

export function AppLayout() {
  const { profile, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false); window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown) }, [])
  const staffLinks: NavItem[] = [
    ['/staff', 'Staff Console', ClipboardList, true],
    ...(profile && hasPermission(profile.role, 'room:manage') ? [['/staff?tab=rooms', 'Room Management', DoorOpen, false] as NavItem] : []),
    ...(profile && hasPermission(profile.role, 'content:manage') ? [['/staff?tab=content', 'Content Management', Settings, false] as NavItem] : []),
  ]
  const links = [...studentNav, ...((profile?.role !== 'STUDENT') ? staffLinks : [])]
  return <div className="min-h-screen bg-[#f7f7f5] text-[#111214]">
    {open && <button aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/45 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[278px] -translate-x-full flex-col bg-[#111214] p-5 text-white shadow-2xl transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : ''}`}>
      <div className="mb-10 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d71920] font-bold">UC</div><div><div className="font-black tracking-tight">UCL CONNECT</div><div className="text-[10px] uppercase tracking-[.2em] text-white/40">Your campus. Connected.</div></div><button onClick={() => setOpen(false)} className="ml-auto rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden" aria-label="Close menu"><X size={18} /></button></div>
      <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Workspace</div>
      <nav className="flex-1 space-y-1 overflow-y-auto">{links.map(([to, label, Icon, end]) => <NavLink key={`${to}-${label}`} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-[#d71920] text-white shadow-lg shadow-red-950/20' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}><Icon size={17} />{label}</NavLink>)}</nav>
      <div className="border-t border-white/10 pt-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold">{profile?.displayName.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><div className="truncate text-sm font-bold">{profile?.displayName}</div><div className="truncate text-xs text-white/45">{profile?.role}</div></div></div><button onClick={() => logout()} className="mt-4 flex items-center gap-2 text-sm text-white/55 hover:text-white"><LogOut size={16} /> Sign out</button></div>
    </aside>
    <div className="lg:pl-[278px]"><header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-black/8 bg-[#f7f7f5]/90 px-4 backdrop-blur md:px-8"><button onClick={() => setOpen(true)} className="rounded-xl p-2 hover:bg-black/5 lg:hidden" aria-label="Open navigation"><Menu size={21} /></button><div className="hidden text-xs font-bold uppercase tracking-[.14em] text-[#6e7077] sm:block">UCL Connect <span className="mx-2 text-[#d71920]">/</span> Campus hub</div><div className="ml-auto flex items-center gap-3"><span className="hidden rounded-full bg-[#fff0f0] px-3 py-1.5 text-xs font-bold text-[#d71920] sm:inline">{profile?.role}</span><button onClick={() => navigate('/')} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111214] text-xs font-bold text-white" aria-label="Return to dashboard">{profile?.displayName.slice(0, 2).toUpperCase()}</button></div></header><main className="min-w-0 p-4 md:p-8"><Outlet /></main></div>
  </div>
}
