import type { Announcement, Event, Room, ServiceItem, Society, UserProfile } from '../types';

export const demoUser: UserProfile = {
  id: 'demo-student-01', name: 'Aarav Perera', email: 'aarav.perera@demo.ucl.lk', role: 'student', faculty: 'Computing', programme: 'BSc Computer Science', year: 2,
};

export const events: Event[] = [
  { id: 'e1', title: 'Designing for Impact', description: 'A hands-on workshop exploring human-centred design with visiting product leaders.', organiser: 'UCL Innovation Hub', category: 'Workshop', date: '2026-09-23', startTime: '14:00', endTime: '16:00', location: 'Innovation Studio', capacity: 60, interestCount: 42, registrationRequired: true, accent: 'coral' },
  { id: 'e2', title: 'Freshers Sports Mixer', description: 'Meet your campus sports community and try something new.', organiser: 'UCL Sports Council', category: 'Sports', date: '2026-09-25', startTime: '17:30', endTime: '20:00', location: 'Main Courtyard', capacity: 120, interestCount: 86, registrationRequired: false, accent: 'ink' },
  { id: 'e3', title: 'Industry Night: Future of AI', description: 'An evening of honest conversations about building a career in applied AI.', organiser: 'Tech Society', category: 'Guest Lecture', date: '2026-09-29', startTime: '18:00', endTime: '20:00', location: 'Auditorium A', capacity: 200, interestCount: 128, registrationRequired: true, accent: 'gold' },
  { id: 'e4', title: 'Portfolio Review Clinic', description: 'Bring your portfolio for practical feedback from the careers team.', organiser: 'Careers Office', category: 'Career', date: '2026-10-02', startTime: '10:00', endTime: '13:00', location: 'Careers Lounge', capacity: 24, interestCount: 19, registrationRequired: true, accent: 'sage' },
];

export const announcements: Announcement[] = [
  { id: 'a1', title: 'Planned network maintenance this Friday', body: 'Campus Wi-Fi and printing services may be intermittent between 22:00 and 23:30.', category: 'IT Services', priority: 'important', publishedAt: 'Today', audience: 'Everyone' },
  { id: 'a2', title: 'Welcome back, UCL community', body: 'The new term is underway. Explore societies, events and support services from your dashboard.', category: 'Campus Life', priority: 'normal', publishedAt: '2 days ago', audience: 'Everyone' },
  { id: 'a3', title: 'Safety drill: Monday 28 September', body: 'A scheduled campus safety drill will take place at 11:00. Please follow staff guidance.', category: 'Safety', priority: 'emergency', publishedAt: 'Yesterday', audience: 'Everyone' },
];

export const societies: Society[] = [
  { id: 's1', name: 'Tech Society', description: 'Build, learn and meet the people shaping tomorrow’s technology.', category: 'Academic & Career', memberCount: 184, meetingDay: 'Wednesdays', meetingLocation: 'Lab 2', accent: 'coral' },
  { id: 's2', name: 'UCL Green Collective', description: 'Small campus actions with a real-world footprint.', category: 'Community', memberCount: 96, meetingDay: 'Thursdays', meetingLocation: 'Courtyard Pavilion', accent: 'sage' },
  { id: 's3', name: 'Lens & Light', description: 'A creative space for photography, film and visual storytelling.', category: 'Creative', memberCount: 72, meetingDay: 'Tuesdays', meetingLocation: 'Media Room', accent: 'gold' },
  { id: 's4', name: 'Debate Union', description: 'Find your voice, test your thinking and make a persuasive case.', category: 'Leadership', memberCount: 58, meetingDay: 'Fridays', meetingLocation: 'Seminar Room 4', accent: 'ink' },
];

export const rooms: Room[] = [
  { id: 'r1', name: 'Study Room A', building: 'Learning Commons', floor: '1st floor', capacity: 6, facilities: ['Display', 'Whiteboard', 'Power'], available: true },
  { id: 'r2', name: 'Collaboration Lab 2', building: 'Innovation Wing', floor: 'Ground floor', capacity: 12, facilities: ['Display', 'Video call', 'Power'], available: true },
  { id: 'r3', name: 'Seminar Room 4', building: 'Academic Block', floor: '2nd floor', capacity: 24, facilities: ['Projector', 'Whiteboard', 'Accessible'], available: false },
  { id: 'r4', name: 'Quiet Pod 03', building: 'Library', floor: '1st floor', capacity: 2, facilities: ['Power', 'Quiet zone'], available: true },
];

export const services: ServiceItem[] = [
  { id: 'sv1', name: 'IT Helpdesk', description: 'One place for account access, Wi-Fi, software and device support.', category: 'Technology', location: 'Student Services, Ground floor', hours: 'Mon-Fri, 08:30-17:00', icon: 'monitor' },
  { id: 'sv2', name: 'Learning Commons', description: 'Quiet zones, group study rooms, research help and course resources.', category: 'Learning', location: 'Academic Block', hours: 'Daily, 07:00-22:00', icon: 'book' },
  { id: 'sv3', name: 'Print Hub', description: 'Print, scan and collect coursework from two self-service stations.', category: 'Campus', location: 'Learning Commons, 1st floor', hours: 'Daily, 07:00-22:00', icon: 'printer' },
  { id: 'sv4', name: 'Wellbeing Desk', description: 'Confidential support, check-ins and referrals for student wellbeing.', category: 'Support', location: 'Student Services, Room 104', hours: 'Mon-Fri, 09:00-16:30', icon: 'heart' },
  { id: 'sv5', name: 'Campus Café', description: 'Fresh lunches, snacks and coffee with vegetarian options daily.', category: 'Food', location: 'Main Courtyard', hours: 'Mon-Fri, 07:30-18:00', icon: 'coffee' },
  { id: 'sv6', name: 'Sports Hall', description: 'Bookable courts, fitness sessions and social sport activities.', category: 'Sport', location: 'North Campus', hours: 'Mon-Sat, 06:30-21:00', icon: 'dumbbell' },
];

export const calendarItems = [
  { date: '23 Sep', title: 'Semester teaching begins', type: 'Academic' },
  { date: '30 Sep', title: 'Course registration closes', type: 'Deadline' },
  { date: '19 Oct', title: 'Midterm study period', type: 'Academic' },
  { date: '14 Dec', title: 'Examination period begins', type: 'Exams' },
];

export const faqs = [
  { question: 'Where can I print on campus?', answer: 'The Print Hub is on the first floor of the Learning Commons. Demo hours are daily from 07:00 to 22:00.', category: 'IT' },
  { question: 'How do I join a society?', answer: 'Open Societies, choose a community and select Express interest. The society manager will follow up with meeting details.', category: 'Student Life' },
  { question: 'How do I request academic support?', answer: 'Use Academic Support to request a study group, peer tutor or mentor. Include your subject and preferred contact method.', category: 'Academic' },
  { question: 'Where can I find wellbeing support?', answer: 'The Wellbeing Desk is in Student Services, Room 104. This prototype uses demo information; contact UCL directly for current support details.', category: 'Campus' },
];

export const jobs = [
  { title: 'Junior Product Intern', company: 'Demo Ventures', type: 'Internship', location: 'Colombo / Hybrid', deadline: '05 Oct 2026', category: 'Technology' },
  { title: 'Student Community Assistant', company: 'Campus Collective', type: 'Part-time', location: 'On campus', deadline: '12 Oct 2026', category: 'Community' },
  { title: 'Graduate Analyst Programme', company: 'Northstar Labs', type: 'Graduate', location: 'Colombo', deadline: '28 Oct 2026', category: 'Business' },
];
