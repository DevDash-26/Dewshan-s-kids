import type { ContentItem, UserProfile } from '../types/models'

// BR2: targeted announcements must be distinguished from general ones and
// prioritized for the viewing student's faculty / programme / year group.
export function isRelevantToStudent(item: ContentItem, profile: UserProfile | null): boolean {
  if (item.audience === 'EVERYONE' || !profile) return true
  if (item.audience === 'FACULTY') return item.faculty === profile.faculty
  if (item.audience === 'PROGRAMME') return item.programme === profile.programme
  if (item.audience === 'YEAR_GROUP') return item.yearGroup === profile.yearGroup
  return true
}

// Lower score = higher priority. Emergencies first, then content targeted
// specifically at this student, then general content, newest first within
// each tier.
export function relevanceScore(item: ContentItem, profile: UserProfile | null): number {
  if (item.isEmergency) return 0
  if (item.audience !== 'EVERYONE' && isRelevantToStudent(item, profile)) return 1
  return 2
}

export function sortByRelevance(items: ContentItem[], profile: UserProfile | null): ContentItem[] {
  return [...items].sort((a, b) => {
    const scoreDiff = relevanceScore(a, profile) - relevanceScore(b, profile)
    if (scoreDiff !== 0) return scoreDiff
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}
