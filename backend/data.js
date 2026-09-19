const bcrypt = require('bcryptjs');

const passwordHash = (value) => bcrypt.hashSync(value, 10);

const seedData = {
  users: [
    {
      id: 'u-student-1',
      name: 'Nimali Perera',
      email: 'nimali@student.ucl.ac.lk',
      passwordHash: passwordHash('student123'),
      role: 'STUDENT',
      faculty: 'Computing',
      programme: 'BSc Computer Science',
      yearGroup: 'Year 2',
      status: 'ACTIVE'
    },
    {
      id: 'u-student-2',
      name: 'Rashid Khan',
      email: 'rashid@student.ucl.ac.lk',
      passwordHash: passwordHash('student123'),
      role: 'STUDENT',
      faculty: 'Business',
      programme: 'BBA Management',
      yearGroup: 'Year 1',
      status: 'ACTIVE'
    },
    {
      id: 'u-staff-1',
      name: 'Dr. Chamila Silva',
      email: 'staff@ucl.ac.lk',
      passwordHash: passwordHash('staff123'),
      role: 'STAFF',
      faculty: 'Computing',
      programme: 'Academic',
      yearGroup: 'Staff',
      status: 'ACTIVE'
    },
    {
      id: 'u-admin-1',
      name: 'Maya Fernando',
      email: 'admin@ucl.ac.lk',
      passwordHash: passwordHash('admin123'),
      role: 'ADMIN',
      faculty: 'Administration',
      programme: 'Campus Services',
      yearGroup: 'Admin',
      status: 'ACTIVE'
    }
  ],
  announcements: [
    {
      id: 'a-1',
      title: 'Semester 2 exam timetable released',
      description: 'The final exam timetable is now available in the student portal.',
      category: 'ACADEMIC_CALENDAR',
      audience: 'ALL',
      faculty: null,
      programme: null,
      yearGroup: null,
      date: '2026-10-10',
      location: 'Student Portal',
      status: 'PUBLISHED',
      createdBy: 'u-admin-1',
      createdAt: '2026-09-19T09:00:00.000Z'
    },
    {
      id: 'a-2',
      title: 'Computing faculty mentorship sessions',
      description: 'Join faculty-led mentoring to plan your final year projects.',
      category: 'SUPPORT',
      audience: 'FACULTY',
      faculty: 'Computing',
      programme: null,
      yearGroup: null,
      date: '2026-09-22',
      location: 'Faculty Hall B',
      status: 'PUBLISHED',
      createdBy: 'u-staff-1',
      createdAt: '2026-09-18T10:00:00.000Z'
    },
    {
      id: 'a-3',
      title: 'Year 2 wellness check-in',
      description: 'The wellbeing team will host voluntary check-ins for year 2 students.',
      category: 'WELLBEING',
      audience: 'YEAR_GROUP',
      faculty: null,
      programme: null,
      yearGroup: 'Year 2',
      date: '2026-09-21',
      location: 'Wellbeing Centre',
      status: 'PUBLISHED',
      createdBy: 'u-staff-1',
      createdAt: '2026-09-18T11:30:00.000Z'
    },
    {
      id: 'a-4',
      title: 'Library closure due to maintenance',
      description: 'The library main floor will be closed until 4 pm for HVAC maintenance.',
      category: 'SCHEDULE_CHANGE',
      audience: 'ALL',
      faculty: null,
      programme: null,
      yearGroup: null,
      date: '2026-09-20',
      location: 'Main Library',
      status: 'EMERGENCY',
      createdBy: 'u-admin-1',
      createdAt: '2026-09-19T08:45:00.000Z'
    }
  ],
  events: [
    {
      id: 'e-1',
      title: 'Tech Career Forum',
      description: 'Meet employers and learn about internships in software, data, and cybersecurity.',
      category: 'CAREER',
      audience: 'ALL',
      faculty: 'Computing',
      date: '2026-09-25',
      startTime: '10:00',
      endTime: '12:00',
      location: 'Innovation Centre',
      status: 'OPEN',
      organizer: 'Career Office',
      interestCount: 22,
      interests: ['u-student-1']
    },
    {
      id: 'e-2',
      title: 'Cultural Festival Night',
      description: 'A student-led celebration with food, music, and performances from across campus.',
      category: 'STUDENT_LIFE',
      audience: 'ALL',
      faculty: null,
      date: '2026-09-27',
      startTime: '18:00',
      endTime: '21:30',
      location: 'Open Air Theatre',
      status: 'OPEN',
      organizer: 'Student Union',
      interestCount: 17,
      interests: []
    },
    {
      id: 'e-3',
      title: 'Guest Lecture: AI in Education',
      description: 'A panel discussion on AI, ethics and student innovation projects.',
      category: 'GUEST_LECTURE',
      audience: 'FACULTY',
      faculty: 'Computing',
      date: '2026-09-30',
      startTime: '15:00',
      endTime: '16:30',
      location: 'Lecture Theatre 4',
      status: 'OPEN',
      organizer: 'School of Computing',
      interestCount: 11,
      interests: []
    }
  ],
  societies: [
    {
      id: 's-1',
      name: 'Robotics Society',
      description: 'Build and compete in robotics projects, automation prototypes and hackathons.',
      category: 'TECH',
      faculty: 'Computing',
      activities: ['Weekly build sessions', '3D printer workshop', 'Project demos'],
      members: 88,
      interestCount: 16,
      interests: []
    },
    {
      id: 's-2',
      name: 'Debate Circle',
      description: 'Develop critical thinking and public speaking through formal and informal debates.',
      category: 'ACADEMIC',
      faculty: null,
      activities: ['Practice rounds', 'Inter-university debate', 'Leadership sessions'],
      members: 65,
      interestCount: 9,
      interests: []
    }
  ],
  rooms: [
    { id: 'r-1', name: 'Studio A', location: 'Academic Block 1', capacity: 12 },
    { id: 'r-2', name: 'Seminar Room 7', location: 'Business Faculty', capacity: 18 },
    { id: 'r-3', name: 'Study Pod 3', location: 'Library Annex', capacity: 6 }
  ],
  roomRequests: [
    {
      id: 'br-1',
      roomId: 'r-1',
      userId: 'u-student-1',
      date: '2026-09-25',
      startTime: '13:00',
      endTime: '15:00',
      status: 'APPROVED',
      reason: 'Group project meeting'
    }
  ],
  lostFound: [
    {
      id: 'lf-1',
      type: 'LOST',
      title: 'Black water bottle',
      description: 'Lost near the library entrance on Thursday morning.',
      status: 'OPEN',
      location: 'Main Library',
      createdBy: 'u-student-2',
      createdAt: '2026-09-17T13:00:00.000Z'
    },
    {
      id: 'lf-2',
      type: 'FOUND',
      title: 'USB drive found in lab 2',
      description: 'A silver USB drive with a blue sticker was found in the lab.',
      status: 'IN_REVIEW',
      location: 'Computer Lab 2',
      createdBy: 'u-staff-1',
      createdAt: '2026-09-18T10:15:00.000Z'
    }
  ],
  faqs: [
    { id: 'f-1', question: 'How do I report a lost item?', answer: 'Use the Lost & Found dashboard and submit a report with the item details and last known location.' },
    { id: 'f-2', question: 'Can I book a room for study groups?', answer: 'Yes. Students can request a room through the Classroom Booking section and view status updates.' },
    { id: 'f-3', question: 'Where do I find counselling support?', answer: 'The wellbeing and student support resources section includes contact details and appointment information.' }
  ],
  feedback: [
    {
      id: 'fb-1',
      userId: 'u-student-1',
      topic: 'Library access',
      message: 'The library study area is full on evenings. Could there be more seating?',
      status: 'NEW',
      createdAt: '2026-09-19T09:30:00.000Z'
    }
  ],
  supportResources: [
    {
      id: 'sr-1',
      title: 'Academic Peer Mentoring',
      description: 'Request support from a peer mentor in your programme or year group.',
      category: 'ACADEMIC_SUPPORT',
      contact: 'mentoring@ucl.ac.lk'
    },
    {
      id: 'sr-2',
      title: 'Student Counselling Services',
      description: 'Confidential guidance and wellbeing support for students.',
      category: 'WELLBEING',
      contact: 'wellbeing@ucl.ac.lk'
    },
    {
      id: 'sr-3',
      title: 'IT Service Desk',
      description: 'Support for Wi-Fi, devices and software access issues.',
      category: 'IT_SUPPORT',
      contact: 'ithelp@ucl.ac.lk'
    }
  ],
  jobOpportunities: [
    { id: 'j-1', title: 'Student Brand Ambassador', employer: 'Airtel Lanka', location: 'Colombo', type: 'Part-time' },
    { id: 'j-2', title: 'UI/UX Intern', employer: 'PixelForge', location: 'Remote', type: 'Internship' }
  ],
  facilityIssues: [
    { id: 'fi-1', studentId: 'u-student-2', type: 'LIGHTING', location: 'Engineering Block', description: 'The corridor lights flicker after 7 pm.', status: 'OPEN' }
  ],
  academicCalendar: [
    { id: 'ac-1', title: 'Add/Drop Period', date: '2026-09-24', type: 'deadline' },
    { id: 'ac-2', title: 'Mid Semester Break', date: '2026-10-15', type: 'holiday' },
    { id: 'ac-3', title: 'Final Exams', date: '2026-11-05', type: 'exam' }
  ],
  staffDirectory: [
    { id: 'd-1', name: 'Dr. Chamila Silva', role: 'Head of Computer Science', department: 'Computing', email: 'chamila.silva@ucl.ac.lk' },
    { id: 'd-2', name: 'Mr. Dinesh Raj', role: 'Student Affairs Officer', department: 'Student Services', email: 'dinesh.raj@ucl.ac.lk' }
  ],
  serviceInformation: [
    { id: 'si-1', title: 'Dining Hall Hours', description: 'Open from 8:00 to 20:00 daily during term time.', category: 'DINING' },
    { id: 'si-2', title: 'Library Opening Hours', description: 'Open 8:30 to 20:00 weekdays.', category: 'LIBRARY' },
    { id: 'si-3', title: 'Printing Services', description: 'Self-service printing and stationery is available in the admin block.', category: 'PRINTING' }
  ],
  emergencyNotices: [
    { id: 'en-1', title: 'Heavy rain alert', description: 'The campus shuttle is running on a reduced route until 18:00.', level: 'MEDIUM', createdAt: '2026-09-19T07:30:00.000Z' }
  ]
};

module.exports = { seedData };
