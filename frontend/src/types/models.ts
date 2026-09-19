// Core domain types for UCL ONE.
// Content that is informational (announcements, events, societies, FAQ, etc.) is
// managed in Strapi as a single reusable `ContentItem` shape (see /cms).
// Content that is transactional/user-generated lives in the local API database.

export type Role = 'STUDENT' | 'ACADEMIC' | 'SOCIETY_MANAGER' | 'FINANCE' | 'ADMINISTRATIVE' | 'FACILITIES' | 'ADMIN'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: Role
  department?: string | null
  faculty: string | null
  programme: string | null
  yearGroup: number | null
  createdAt: string
  updatedAt?: string
  isActive?: boolean
}

// Mirrors the `category` enum on the Strapi `content-item` content type.
export type ContentCategory =
  | 'ANNOUNCEMENT'
  | 'EVENT'
  | 'SOCIETY'
  | 'ACADEMIC_CALENDAR'
  | 'ONBOARDING'
  | 'VOLUNTEERING'
  | 'ALUMNI'
  | 'JOB'
  | 'FINANCIAL_SUPPORT'
  | 'WELLBEING'
  | 'IT_SUPPORT'
  | 'LIBRARY'
  | 'DINING'
  | 'PRINTING'
  | 'TEXTBOOK'
  | 'GUEST_LECTURE'
  | 'SPORTS'
  | 'STUDENT_LIFE'
  | 'FAQ'
  | 'EMERGENCY'
  | 'SCHEDULE_CHANGE'
  | 'STAFF_DIRECTORY'

export type Audience = 'EVERYONE' | 'FACULTY' | 'PROGRAMME' | 'YEAR_GROUP'

export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

// Shape returned by the Strapi REST API for a `content-item` entry.
export interface ContentItem {
  id: number
  title: string
  description: string
  category: ContentCategory
  audience: Audience
  faculty: string | null
  programme: string | null
  yearGroup: number | null
  eventDate: string | null
  startTime: string | null
  endTime: string | null
  location: string | null
  contact: string | null
  status: ContentStatus
  isEmergency: boolean
  createdByDisplay: string | null
  publishedAt: string | null
  updatedAt: string
}

export interface Room {
  id: string
  name: string
  building: string
  capacity: number
  features: string[]
}

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface RoomBooking {
  id: string
  roomId: string
  roomName: string
  requestedBy: string
  requestedByName: string
  purpose: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  status: BookingStatus
  createdAt: string
  decidedBy: string | null
  decidedAt: string | null
}

export interface EventInterest {
  id: string
  contentItemId: number
  studentId: string
  createdAt: string
}

export interface SocietyInterest {
  id: string
  contentItemId: number
  studentId: string
  studentName: string
  message: string | null
  createdAt: string
}

export type LostFoundKind = 'LOST' | 'FOUND'
export type LostFoundStatus = 'OPEN' | 'RESOLVED'

export interface LostFoundItem {
  id: string
  kind: LostFoundKind
  itemName: string
  description: string
  location: string
  contact: string
  status: LostFoundStatus
  reportedBy: string
  reportedByName: string
  createdAt: string
}

export type SupportKind = 'STUDY_GROUP' | 'PEER_TUTORING' | 'MENTORSHIP'
export type RequestStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'

export interface AcademicSupportRequest {
  id: string
  kind: SupportKind
  subject: string
  details: string
  status: RequestStatus
  requestedBy: string
  requestedByName: string
  createdAt: string
}

export interface Feedback {
  id: string
  subject: string
  message: string
  status: RequestStatus
  submittedBy: string
  submittedByName: string
  createdAt: string
  response: string | null
}

export type FacilityIssueType = 'ELECTRICAL' | 'PLUMBING' | 'FURNITURE' | 'CLEANLINESS' | 'IT_EQUIPMENT' | 'OTHER'

export interface FacilityIssue {
  id: string
  issueType: FacilityIssueType
  location: string
  description: string
  status: RequestStatus
  reportedBy: string
  reportedByName: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  read: boolean
  createdAt: string
  link: string | null
}
