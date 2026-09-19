import type { ContentCategory, ContentItem } from '../types/models'

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
  const json = await request(`content-items?${params.toString()}`)
  return json.data.map(normalize)
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
