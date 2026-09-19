import { describe, expect, it } from 'vitest'
import { filterVisibleToStudent, isRelevantToStudent, sortByRelevance } from './targeting'
import type { ContentItem, UserProfile } from '../types/models'

function makeItem(overrides: Partial<ContentItem>): ContentItem {
  return {
    id: 1,
    title: 'Test',
    description: 'Test',
    category: 'ANNOUNCEMENT',
    audience: 'EVERYONE',
    faculty: null,
    programme: null,
    yearGroup: null,
    eventDate: null,
    startTime: null,
    endTime: null,
    location: null,
    contact: null,
    status: 'PUBLISHED',
    isEmergency: false,
    createdByDisplay: null,
    publishedAt: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

const student: UserProfile = {
  uid: 'u1',
  email: 's@ucl.lk',
  displayName: 'Student One',
  role: 'STUDENT',
  staffDepartment: null,
  faculty: 'Faculty of Computing',
  programme: 'BSc Software Engineering',
  yearGroup: 2,
  createdAt: new Date().toISOString(),
}

describe('isRelevantToStudent (BR2 targeted announcements)', () => {
  it('everyone-audience content is always relevant', () => {
    expect(isRelevantToStudent(makeItem({ audience: 'EVERYONE' }), student)).toBe(true)
  })

  it('faculty-targeted content only matches the student\'s own faculty', () => {
    const matching = makeItem({ audience: 'FACULTY', faculty: 'Faculty of Computing' })
    const nonMatching = makeItem({ audience: 'FACULTY', faculty: 'Faculty of Business' })
    expect(isRelevantToStudent(matching, student)).toBe(true)
    expect(isRelevantToStudent(nonMatching, student)).toBe(false)
  })

  it('year-group-targeted content only matches the student\'s own year', () => {
    expect(isRelevantToStudent(makeItem({ audience: 'YEAR_GROUP', yearGroup: 2 }), student)).toBe(true)
    expect(isRelevantToStudent(makeItem({ audience: 'YEAR_GROUP', yearGroup: 3 }), student)).toBe(false)
  })

  it('programme-targeted content only matches the student\'s own programme', () => {
    expect(isRelevantToStudent(makeItem({ audience: 'PROGRAMME', programme: 'BSc Software Engineering' }), student)).toBe(true)
    expect(isRelevantToStudent(makeItem({ audience: 'PROGRAMME', programme: 'BSc Data Science' }), student)).toBe(false)
  })

  it('an emergency notice is always relevant, even if targeted at a different faculty', () => {
    expect(isRelevantToStudent(makeItem({ isEmergency: true, audience: 'FACULTY', faculty: 'Faculty of Business' }), student)).toBe(true)
  })

  it('treats content as relevant when no profile is available (logged out)', () => {
    expect(isRelevantToStudent(makeItem({ audience: 'FACULTY', faculty: 'Faculty of Business' }), null)).toBe(true)
  })
})

describe('filterVisibleToStudent (BR2: exclude content targeted at a different faculty/programme/year)', () => {
  it('keeps general content, matching-faculty, matching-programme, and matching-year-group content', () => {
    const general = makeItem({ id: 1, audience: 'EVERYONE' })
    const matchingFaculty = makeItem({ id: 2, audience: 'FACULTY', faculty: 'Faculty of Computing' })
    const matchingProgramme = makeItem({ id: 3, audience: 'PROGRAMME', programme: 'BSc Software Engineering' })
    const matchingYear = makeItem({ id: 4, audience: 'YEAR_GROUP', yearGroup: 2 })

    const visible = filterVisibleToStudent([general, matchingFaculty, matchingProgramme, matchingYear], student)

    expect(visible.map((i) => i.id).sort()).toEqual([1, 2, 3, 4])
  })

  it('excludes content targeted exclusively at a different faculty, programme, or year group', () => {
    const otherFaculty = makeItem({ id: 5, audience: 'FACULTY', faculty: 'Faculty of Business' })
    const otherProgramme = makeItem({ id: 6, audience: 'PROGRAMME', programme: 'BSc Data Science' })
    const otherYear = makeItem({ id: 7, audience: 'YEAR_GROUP', yearGroup: 4 })

    const visible = filterVisibleToStudent([otherFaculty, otherProgramme, otherYear], student)

    expect(visible).toHaveLength(0)
  })

  it('never excludes an emergency notice regardless of its stated audience', () => {
    const emergencyForOtherFaculty = makeItem({ id: 8, isEmergency: true, audience: 'FACULTY', faculty: 'Faculty of Business' })
    expect(filterVisibleToStudent([emergencyForOtherFaculty], student)).toHaveLength(1)
  })
})

describe('sortByRelevance', () => {
  it('prioritizes emergencies, then targeted-and-relevant content, then general content', () => {
    const general = makeItem({ id: 1, audience: 'EVERYONE' })
    const targeted = makeItem({ id: 2, audience: 'FACULTY', faculty: 'Faculty of Computing' })
    const emergency = makeItem({ id: 3, isEmergency: true })
    const irrelevantTargeted = makeItem({ id: 4, audience: 'FACULTY', faculty: 'Faculty of Business' })

    const sorted = sortByRelevance([general, targeted, emergency, irrelevantTargeted], student)

    expect(sorted[0].id).toBe(3) // emergency first
    expect(sorted[1].id).toBe(2) // relevant targeted content next
  })
})
