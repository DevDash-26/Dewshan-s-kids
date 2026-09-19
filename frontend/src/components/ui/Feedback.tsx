import { AlertTriangle, Inbox, Loader2, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center text-slate-500">
      {icon ?? <Inbox className="h-8 w-8 text-slate-300" aria-hidden />}
      <p className="font-medium text-slate-700">{title}</p>
      {description && <p className="max-w-sm text-sm">{description}</p>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-10 text-center text-red-700">
      <AlertTriangle className="h-8 w-8" aria-hidden />
      <p className="font-medium">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">
          Try again
        </button>
      )}
    </div>
  )
}

export function ServiceUnavailable({ service }: { service: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 py-10 text-center text-amber-800">
      <WifiOff className="h-8 w-8" aria-hidden />
      <p className="font-medium">{service} is unavailable right now</p>
      <p className="max-w-sm text-sm">This is expected if the local CMS service isn't running. See README for setup.</p>
    </div>
  )
}
