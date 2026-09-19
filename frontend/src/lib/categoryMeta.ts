import type { ContentCategory } from '../types/models'

export const CATEGORY_LABELS: Record<ContentCategory, string> = {
  ANNOUNCEMENT: 'Announcements',
  EVENT: 'Events',
  SOCIETY: 'Societies',
  ACADEMIC_CALENDAR: 'Academic Calendar',
  ONBOARDING: 'New Student Onboarding',
  VOLUNTEERING: 'Volunteering',
  ALUMNI: 'Alumni',
  JOB: 'Jobs & Internships',
  FINANCIAL_SUPPORT: 'Financial Support',
  WELLBEING: 'Wellbeing & Counselling',
  IT_SUPPORT: 'IT Support',
  LIBRARY: 'Library',
  DINING: 'Dining',
  PRINTING: 'Printing Services',
  TEXTBOOK: 'Textbook Exchange',
  GUEST_LECTURE: 'Guest Lectures',
  SPORTS: 'Sports & Recreation',
  STUDENT_LIFE: 'Student Life Highlights',
  FAQ: 'FAQ',
  EMERGENCY: 'Emergency Notices',
  SCHEDULE_CHANGE: 'Schedule Changes & Closures',
  STAFF_DIRECTORY: 'Staff Directory',
}

// Groups the 22 content categories into digestible sections for the
// discovery/browse page rather than one flat list of 22 tabs.
export const CATEGORY_GROUPS: { title: string; categories: ContentCategory[] }[] = [
  { title: 'Campus Life', categories: ['ANNOUNCEMENT', 'EVENT', 'SOCIETY', 'STUDENT_LIFE', 'GUEST_LECTURE'] },
  { title: 'Academics', categories: ['ACADEMIC_CALENDAR', 'ONBOARDING', 'LIBRARY', 'FAQ'] },
  { title: 'Support & Wellbeing', categories: ['WELLBEING', 'IT_SUPPORT', 'FINANCIAL_SUPPORT'] },
  { title: 'Opportunities', categories: ['JOB', 'VOLUNTEERING', 'ALUMNI', 'TEXTBOOK'] },
  { title: 'Campus Services', categories: ['DINING', 'PRINTING', 'SPORTS', 'STAFF_DIRECTORY'] },
  { title: 'Urgent', categories: ['EMERGENCY', 'SCHEDULE_CHANGE'] },
]
