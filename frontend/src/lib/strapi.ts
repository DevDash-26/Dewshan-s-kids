import type { ContentCategory, ContentItem } from '../types/models'

const EVENT_FALLBACK: ContentItem[] = [
  {
    id: 1001,
    title: 'AI & Data Hackathon Showcase',
    description: 'Join us for a showcase of student hackathon projects, including live demos and a panel of industry judges.',
    category: 'EVENT',
    audience: 'EVERYONE',
    faculty: null,
    programme: null,
    yearGroup: null,
    eventDate: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
    startTime: '14:00',
    endTime: '17:00',
    location: 'Main Auditorium',
    contact: 'events@ucl.lk',
    status: 'PUBLISHED',
    isEmergency: false,
    createdByDisplay: 'Computing Society',
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 1002,
    title: 'Inter-Faculty Football Tournament',
    description: 'Cheer on your faculty team in the annual inter-faculty football tournament.',
    category: 'EVENT',
    audience: 'EVERYONE',
    faculty: null,
    programme: null,
    yearGroup: null,
    eventDate: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '16:00',
    location: 'Sports Grounds',
    contact: null,
    status: 'PUBLISHED',
    isEmergency: false,
    createdByDisplay: 'Sports Office',
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 1003,
    title: 'Business Faculty Career Fair',
    description: 'Meet recruiters from leading companies looking to hire finance, marketing and management graduates.',
    category: 'EVENT',
    audience: 'FACULTY',
    faculty: 'Faculty of Business',
    programme: null,
    yearGroup: null,
    eventDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    startTime: '10:00',
    endTime: '15:00',
    location: 'Business Faculty Hall',
    contact: null,
    status: 'PUBLISHED',
    isEmergency: false,
    createdByDisplay: 'Faculty of Business Office',
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export function fallbackContentForCategory(category?: ContentCategory): ContentItem[] {
  if (!category) return []
  if (category === 'EVENT') return EVENT_FALLBACK
  return []
}

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'

interface StrapiListResponse {
  data: Array<{ id: number; attributes?: Record<string, unknown> } & Record<string, unknown>>
  meta?: unknown
}

// Strapi v5 flattens attributes onto the entry itself (no `.attributes`
// wrapper as in v4). We normalize defensively so either shape works.
function normalize(entry: Record<string, unknown>): ContentItem {
  const attrs = (entry.attributes as Record<string, unknown>) ?? entry
  return {
    id: entry.id as number,
    title: String(attrs.title ?? ''),
    description: String(attrs.description ?? ''),
    category: attrs.category as ContentCategory,
    audience: (attrs.audience as ContentItem['audience']) ?? 'EVERYONE',
    faculty: (attrs.faculty as string) ?? null,
    programme: (attrs.programme as string) ?? null,
    yearGroup: (attrs.yearGroup as number) ?? null,
    eventDate: (attrs.eventDate as string) ?? null,
    startTime: (attrs.startTime as string) ?? null,
    endTime: (attrs.endTime as string) ?? null,
    location: (attrs.location as string) ?? null,
    contact: (attrs.contact as string) ?? null,
    status: (attrs.status as ContentItem['status']) ?? 'PUBLISHED',
    isEmergency: Boolean(attrs.isEmergency),
    createdByDisplay: (attrs.createdBy_display as string) ?? null,
    publishedAt: (attrs.publishedAt as string) ?? null,
    updatedAt: String(attrs.updatedAt ?? ''),
  }
}

export class StrapiError extends Error {}

async function request(path: string): Promise<StrapiListResponse> {
  const res = await fetch(`${STRAPI_URL}/api/${path}`)
  if (!res.ok) {
    throw new StrapiError(`Strapi request failed (${res.status}) for ${path}`)
  }
  return res.json()
}

export async function fetchContentItems(options?: { category?: ContentCategory }): Promise<ContentItem[]> {
  const params = new URLSearchParams()
  params.set('sort', 'updatedAt:desc')
  params.set('pagination[pageSize]', '100')
  if (options?.category) {
    params.set('filters[category][$eq]', options.category)
  }
  try {
    const json = await request(`content-items?${params.toString()}`)
    const items = json.data.map(normalize)
    if (options?.category && items.length === 0) {
      return fallbackContentForCategory(options.category)
    }
    return items
  } catch {
    return options?.category ? fallbackContentForCategory(options.category) : []
  }
}

export async function fetchContentItemById(id: number): Promise<ContentItem | null> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/content-items/${id}`)
    if (!res.ok) return null
    const json = await res.json()
    return normalize(json.data)
  } catch {
    return null
  }
}
