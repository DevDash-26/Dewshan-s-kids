import type { ContentItem, UserProfile } from '../types/models'

// BR2: targeted announcements must be distinguished from general ones, and
// content targeted exclusively at another faculty/programme/year must not
// be presented to a student as if it were meant for them. Emergency notices
// (BR15) always reach everyone regardless of audience targeting - safety
// information should never be excluded from a personalised view.
export function isRelevantToStudent(item: ContentItem, profile: UserProfile | null): boolean {
  if (item.isEmergency || item.audience === 'EVERYONE' || !profile) return true
  if (item.audience === 'FACULTY') return item.faculty === profile.faculty
  if (item.audience === 'PROGRAMME') return item.programme === profile.programme
  if (item.audience === 'YEAR_GROUP') return item.yearGroup === profile.yearGroup
  return true
}

// Used by any "for you" / personalised view (e.g. the dashboard) to actually
// exclude content targeted at a different faculty/programme/year, rather
// than merely sorting it lower. General browsing surfaces (e.g. Search &
// Discover) intentionally do NOT use this - a student can still look up
// something not targeted at them, the same way they could browse a public
// noticeboard for another faculty. This is the reusable primitive: any
// content list backed by the same category/audience/faculty/programme/
// yearGroup fields can be filtered this way.
export function filterVisibleToStudent(items: ContentItem[], profile: UserProfile | null): ContentItem[] {
  return items.filter((item) => isRelevantToStudent(item, profile))
}

// Lower score = higher priority: emergencies first, then targeted content
// (everything remaining here already passed filterVisibleToStudent, so it's
// relevant by construction), then general content, newest first within each
// tier.
export function relevanceScore(item: ContentItem): number {
  if (item.isEmergency) return 0
  if (item.audience !== 'EVERYONE') return 1
  return 2
}

export function sortByRelevance(items: ContentItem[], profile: UserProfile | null): ContentItem[] {
  return filterVisibleToStudent(items, profile).sort((a, b) => {
    const scoreDiff = relevanceScore(a) - relevanceScore(b)
    if (scoreDiff !== 0) return scoreDiff
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}
