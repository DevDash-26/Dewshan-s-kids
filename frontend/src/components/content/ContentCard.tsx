import { CalendarDays, MapPin, Phone, ShieldAlert } from 'lucide-react'
import type { ContentItem } from '../../types/models'
import { CATEGORY_LABELS } from '../../lib/categoryMeta'
import { Badge, Card } from '../ui/Primitives'
import type { ReactNode } from 'react'

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

export function ContentCard({ item, actions }: { item: ContentItem; actions?: ReactNode }) {
  return (
    <Card className={item.isEmergency ? 'border-red-300 bg-red-50' : ''}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {item.isEmergency && (
          <Badge color="red">
            <span className="flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Urgent
            </span>
          </Badge>
        )}
        <Badge color="blue">{CATEGORY_LABELS[item.category]}</Badge>
        {item.audience !== 'EVERYONE' && <Badge color="amber">Targeted: {item.audience.replace('_', ' ').toLowerCase()}</Badge>}
      </div>
      <h3 className="font-semibold text-slate-900">{item.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{stripHtml(item.description)}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        {item.eventDate && (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> {item.eventDate}
            {item.startTime ? ` · ${item.startTime.slice(0, 5)}` : ''}
          </span>
        )}
        {item.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {item.location}
          </span>
        )}
        {item.contact && (
          <span className="flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" /> {item.contact}
          </span>
        )}
      </div>
      {item.createdByDisplay && <p className="mt-2 text-xs text-slate-400">Source: {item.createdByDisplay}</p>}
      {actions && <div className="mt-3 flex gap-2">{actions}</div>}
    </Card>
  )
}
