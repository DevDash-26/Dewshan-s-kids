import { existsSync } from 'node:fs';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service-account JSON file before seeding.');
  process.exit(1);
}

const app = getApps()[0] || initializeApp({ credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)) });
const auth = getAuth(app);
const db = getFirestore(app);
const now = FieldValue.serverTimestamp();
const demoUsers = [
  ['demo-student', 'student@ucl.lk', 'Demo Student', 'student'],
  ['demo-academic', 'academic@ucl.lk', 'Demo Academic', 'academic'],
  ['demo-society', 'society.manager@ucl.lk', 'Demo Society Manager', 'society_manager'],
  ['demo-finance', 'finance@ucl.lk', 'Demo Finance Officer', 'finance'],
  ['demo-admin', 'administrative@ucl.lk', 'Demo Administrative Officer', 'administrative'],
  ['demo-facilities', 'facilities@ucl.lk', 'Demo Facilities Officer', 'facilities'],
  ['demo-root-admin', 'admin@ucl.lk', 'Demo Administrator', 'admin'],
];
const content = {
  announcements: [
    ['academic-welcome', { title: 'Semester teaching begins', category: 'Academic', priority: 'normal', body: 'Teaching begins this week. Check your timetable and academic support options.', audience: 'Everyone' }],
    ['campus-network', { title: 'Planned network maintenance', category: 'IT Services', priority: 'important', body: 'Campus Wi-Fi and printing may be intermittent between 22:00 and 23:30 on Friday.', audience: 'Everyone' }],
    ['society-fair', { title: 'Society fair registration is open', category: 'Student Life', priority: 'normal', body: 'Meet student communities at the courtyard fair and express interest through UCL Connect.', audience: 'Everyone' }],
    ['finance-support', { title: 'Financial support information updated', category: 'Finance', priority: 'normal', body: 'Review the latest demo scholarship and fee-support information with Finance.', audience: 'Everyone' }],
    ['safety-drill', { title: 'Scheduled safety drill', category: 'Safety', priority: 'emergency', body: 'A scheduled campus safety drill will take place at 11:00. Follow staff guidance.', audience: 'Everyone' }],
  ],
  events: [
    ['design-workshop', { title: 'Designing for Impact', category: 'Workshop', organiser: 'UCL Innovation Hub', date: '2026-09-23', location: 'Innovation Studio', capacity: 60 }],
    ['society-fair', { title: 'Student Society Fair', category: 'Society', organiser: 'Student Experience', date: '2026-09-25', location: 'Main Courtyard', capacity: 200 }],
    ['ai-lecture', { title: 'Industry Night: Future of AI', category: 'Guest Lecture', organiser: 'Tech Society', date: '2026-09-29', location: 'Auditorium A', capacity: 200 }],
    ['sports-mixer', { title: 'Freshers Sports Mixer', category: 'Sports', organiser: 'Sports Council', date: '2026-09-25', location: 'Sports Hall', capacity: 120 }],
    ['career-clinic', { title: 'Portfolio Review Clinic', category: 'Career', organiser: 'Careers Office', date: '2026-10-02', location: 'Careers Lounge', capacity: 24 }],
  ],
  societies: [
    ['technology', { name: 'Technology Society', category: 'Academic & Career', description: 'Build, learn and meet the people shaping tomorrow’s technology.', memberCount: 184 }],
    ['business', { name: 'Business Society', category: 'Leadership', description: 'Case studies, founder conversations and practical career connections.', memberCount: 112 }],
    ['sports', { name: 'Sports Society', category: 'Sport', description: 'Social sport and competitive teams for every experience level.', memberCount: 154 }],
    ['volunteering', { name: 'Volunteering Society', category: 'Community', description: 'Turn your time and talents into meaningful community action.', memberCount: 86 }],
  ],
  faqs: [
    ['it-printing', { question: 'Where can I print?', category: 'IT', answer: 'The Print Hub is on the first floor of the Learning Commons.' }],
    ['library-help', { question: 'How do I get library help?', category: 'Library', answer: 'Visit the Learning Commons desk during opening hours for research and resource support.' }],
    ['room-booking', { question: 'How do I book a classroom?', category: 'Campus', answer: 'Use Rooms to select a date, time and capacity, then request an available room.' }],
  ],
  jobs: [
    ['product-intern', { title: 'Junior Product Intern', company: 'Demo Ventures', type: 'Internship', location: 'Colombo / Hybrid', deadline: '2026-10-05' }],
    ['graduate-analyst', { title: 'Graduate Analyst Programme', company: 'Northstar Labs', type: 'Graduate', location: 'Colombo', deadline: '2026-10-28' }],
  ],
  classrooms: [
    ['study-room-a', { name: 'Study Room A', building: 'Learning Commons', capacity: 6, facilities: ['Display', 'Whiteboard', 'Power'], available: true }],
    ['collaboration-lab-2', { name: 'Collaboration Lab 2', building: 'Innovation Wing', capacity: 12, facilities: ['Display', 'Video call', 'Power'], available: true }],
  ],
  financialSupport: [['scholarships', { title: 'Scholarship guidance', description: 'Demo information about scholarships, fee support and payment planning.' }]],
  wellbeing: [['wellbeing-desk', { title: 'Wellbeing Desk', description: 'Demo support resources, confidential check-ins and referrals.' }]],
  dining: [['campus-cafe', { title: 'Campus Café', description: 'Demo dining information with daily vegetarian options.' }]],
  printing: [['print-hub', { title: 'Print Hub', description: 'Demo print, scan and collection service in the Learning Commons.' }]],
  libraryResources: [['learning-commons', { title: 'Learning Commons', description: 'Demo library resources, quiet zones and research support.' }]],
  studentLife: [['campus-moments', { title: 'Student life highlights', description: 'Demo student achievements, society activity and campus moments.' }]],
};

for (const [id, email, displayName, role] of demoUsers) {
  let user;
  try { user = await auth.getUserByEmail(email); } catch (error) { if (error.code !== 'auth/user-not-found') throw error; user = await auth.createUser({ email, displayName, emailVerified: false, disabled: false }); }
  await db.collection('users').doc(user.uid).set({ uid: user.uid, email, displayName, name: displayName, role, isActive: true, createdAt: now, updatedAt: now }, { merge: true });
}

for (const [collection, records] of Object.entries(content)) {
  for (const [id, data] of records) await db.collection(collection).doc(id).set({ ...data, demo: true, createdAt: now, updatedAt: now }, { merge: true });
}
console.log('Seeded deterministic UCL Connect demo users and content. No passwords were created; use password reset or set credentials in Firebase Auth for demos.');
