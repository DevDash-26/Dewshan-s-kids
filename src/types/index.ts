export type UserRole = 'student' | 'admin' | 'academic' | 'society_manager' | 'finance' | 'facilities';
export type EventCategory = 'Academic' | 'Society' | 'Sports' | 'Workshop' | 'Guest Lecture' | 'Career' | 'Social' | 'Other';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  faculty: string;
  programme: string;
  year: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  organiser: string;
  category: EventCategory;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  interestCount: number;
  registrationRequired: boolean;
  accent: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: 'normal' | 'important' | 'emergency';
  publishedAt: string;
  audience: string;
}

export interface Society {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  meetingDay: string;
  meetingLocation: string;
  accent: string;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  facilities: string[];
  available: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  hours: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { label: string; path: string }[];
  timestamp: string;
}
