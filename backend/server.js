const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenAI } = require('@google/genai');
const { seedData } = require('./data');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'ucl-one-demo-secret';

app.use(cors());
app.use(express.json());

const state = JSON.parse(JSON.stringify(seedData));

function sanitizeUser(user = null) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

function getUserByEmail(email) {
  return state.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = state.users.find((entry) => entry.id === payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'Unknown user.' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not allowed to perform this action.' });
    }
    return next();
  };
}

function makeQueryMatch(text, query) {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return String(text || '').toLowerCase().includes(normalized);
}

function filterAnnouncementsForUser(user) {
  return state.announcements.filter((announcement) => {
    if (announcement.audience === 'ALL') return true;
    if (announcement.audience === 'FACULTY') return announcement.faculty === user.faculty;
    if (announcement.audience === 'PROGRAMME') return announcement.programme === user.programme;
    if (announcement.audience === 'YEAR_GROUP') return announcement.yearGroup === user.yearGroup;
    return true;
  });
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'UCL ONE API' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = signToken(user);
  return res.json({ token, user: sanitizeUser(user) });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

app.get('/api/dashboard', requireAuth, (req, res) => {
  const user = req.user;
  const announcements = filterAnnouncementsForUser(user);
  const emergency = state.emergencyNotices;
  const jobs = state.jobOpportunities.slice(0, 3);
  const supportResources = state.supportResources;
  const upcomingEvents = state.events.filter((event) => event.status === 'OPEN').slice(0, 4);

  const targetCount = announcements.length;

  res.json({
    user: sanitizeUser(user),
    announcements,
    targetCount,
    emergency,
    jobs,
    supportResources,
    upcomingEvents,
    calendar: state.academicCalendar,
    faqPreview: state.faqs.slice(0, 3)
  });
});

app.get('/api/search', requireAuth, (req, res) => {
  const { q = '', category = 'ALL', faculty = 'ALL', programme = 'ALL' } = req.query;
  const query = String(q || '').trim();
  const results = [];

  const pushResult = (type, item) => {
    const matchCategory = category === 'ALL' || item.category === category || item.type === category;
    const matchFaculty = faculty === 'ALL' || !item.faculty || item.faculty === faculty;
    const matchProgramme = programme === 'ALL' || !item.programme || item.programme === programme;
    if (matchCategory && matchFaculty && matchProgramme && makeQueryMatch(JSON.stringify(item), query)) {
      results.push({ type, ...item });
    }
  };

  state.announcements.forEach((item) => pushResult('announcement', item));
  state.events.forEach((item) => pushResult('event', item));
  state.societies.forEach((item) => pushResult('society', item));
  state.faqs.forEach((item) => pushResult('faq', item));
  state.lostFound.forEach((item) => pushResult('item', item));
  state.jobOpportunities.forEach((item) => pushResult('job', item));

  res.json({ results, total: results.length });
});

app.get('/api/announcements', requireAuth, (req, res) => {
  res.json({ announcements: filterAnnouncementsForUser(req.user) });
});

app.post('/api/announcements', requireAuth, requireRoles('STAFF', 'ADMIN'), (req, res) => {
  const { title, description, category, audience, faculty, programme, yearGroup, date, location } = req.body || {};

  if (!title || !description || !category || !audience) {
    return res.status(400).json({ message: 'Title, description, category and audience are required.' });
  }

  const announcement = {
    id: `a-${Date.now()}`,
    title,
    description,
    category,
    audience,
    faculty: faculty || null,
    programme: programme || null,
    yearGroup: yearGroup || null,
    date: date || new Date().toISOString().slice(0, 10),
    location: location || 'Campus',
    status: 'PUBLISHED',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };

  state.announcements.unshift(announcement);
  res.status(201).json({ announcement });
});

app.get('/api/events', requireAuth, (req, res) => {
  res.json({ events: state.events });
});

app.post('/api/events/:id/interest', requireAuth, (req, res) => {
  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({ message: 'Only students can express interest in events.' });
  }

  const event = state.events.find((entry) => entry.id === req.params.id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  if (event.interests.includes(req.user.id)) {
    return res.status(409).json({ message: 'You have already registered interest for this event.' });
  }

  event.interests.push(req.user.id);
  event.interestCount = event.interests.length;
  res.status(201).json({ event, message: 'Interest registered successfully.' });
});

app.get('/api/societies', requireAuth, (req, res) => {
  res.json({ societies: state.societies });
});

app.post('/api/societies/:id/interest', requireAuth, (req, res) => {
  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({ message: 'Only students can join societies.' });
  }

  const society = state.societies.find((entry) => entry.id === req.params.id);
  if (!society) {
    return res.status(404).json({ message: 'Society not found.' });
  }

  if (society.interests.includes(req.user.id)) {
    return res.status(409).json({ message: 'You have already expressed interest in this society.' });
  }

  society.interests.push(req.user.id);
  society.interestCount = society.interests.length;
  res.status(201).json({ society, message: 'Society interest recorded.' });
});

app.get('/api/rooms', requireAuth, (req, res) => {
  const { date } = req.query;
  const rooms = state.rooms.map((room) => {
    const bookings = state.roomRequests.filter((request) => request.roomId === room.id && request.date === String(date || '2026-09-25') && request.status !== 'REJECTED');
    return { ...room, bookings };
  });

  res.json({ rooms, requests: state.roomRequests });
});

app.post('/api/rooms/request', requireAuth, (req, res) => {
  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({ message: 'Students can only request rooms.' });
  }

  const { roomId, date, startTime, endTime, reason } = req.body || {};
  if (!roomId || !date || !startTime || !endTime) {
    return res.status(400).json({ message: 'Room, date and time range are required.' });
  }

  const room = state.rooms.find((entry) => entry.id === roomId);
  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  const conflictingBooking = state.roomRequests.find((request) => {
    if (request.roomId !== roomId || request.date !== date || request.status === 'REJECTED') return false;
    return !(endTime <= request.startTime || startTime >= request.endTime);
  });

  if (conflictingBooking) {
    return res.status(409).json({ message: 'This time slot overlaps with an existing booking.' });
  }

  const request = {
    id: `br-${Date.now()}`,
    roomId,
    userId: req.user.id,
    date,
    startTime,
    endTime,
    status: 'PENDING',
    reason: reason || 'General study session'
  };

  state.roomRequests.push(request);
  res.status(201).json({ request, room });
});

app.get('/api/lost-found', requireAuth, (req, res) => {
  res.json({ items: state.lostFound });
});

app.post('/api/lost-found', requireAuth, (req, res) => {
  const { type, title, description, location } = req.body || {};
  if (!type || !title || !description || !location) {
    return res.status(400).json({ message: 'Type, title, description and location are required.' });
  }

  const item = {
    id: `lf-${Date.now()}`,
    type: type.toUpperCase(),
    title,
    description,
    status: 'OPEN',
    location,
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };

  state.lostFound.unshift(item);
  res.status(201).json({ item });
});

app.get('/api/faqs', requireAuth, (req, res) => {
  res.json({ faqs: state.faqs });
});

app.get('/api/support', requireAuth, (req, res) => {
  res.json({
    resources: state.supportResources,
    jobs: state.jobOpportunities,
    serviceInformation: state.serviceInformation,
    facilityIssues: state.facilityIssues
  });
});

app.get('/api/service-information', requireAuth, (req, res) => {
  res.json({ items: state.serviceInformation });
});

app.get('/api/feedback', requireAuth, (req, res) => {
  res.json({ items: state.feedback });
});

app.post('/api/feedback', requireAuth, (req, res) => {
  const { topic, message } = req.body || {};
  if (!topic || !message) {
    return res.status(400).json({ message: 'Topic and message are required.' });
  }

  const entry = {
    id: `fb-${Date.now()}`,
    userId: req.user.id,
    topic,
    message,
    status: 'NEW',
    createdAt: new Date().toISOString()
  };

  state.feedback.unshift(entry);
  res.status(201).json({ entry });
});

app.get('/api/staff-directory', requireAuth, (req, res) => {
  res.json({ staff: state.staffDirectory });
});

app.get('/api/academic-calendar', requireAuth, (req, res) => {
  res.json({ items: state.academicCalendar });
});

app.post('/api/facility-issues', requireAuth, (req, res) => {
  const { type, location, description } = req.body || {};
  if (!type || !location || !description) {
    return res.status(400).json({ message: 'Type, location and description are required.' });
  }

  const issue = {
    id: `fi-${Date.now()}`,
    studentId: req.user.id,
    type,
    location,
    description,
    status: 'OPEN'
  };

  state.facilityIssues.unshift(issue);
  res.status(201).json({ issue });
});

async function buildGroundedAnswer(question) {
  const q = String(question).toLowerCase();
  const fallback = {
    answer: 'I can help you with campus services, events, academic dates, and support resources.',
    suggestions: ['Browse the dashboard', 'Search events', 'View student support'],
    sources: []
  };

  if (q.includes('event') || q.includes('upcoming')) {
    return {
      ...fallback,
      answer: 'The next campus events are the Tech Career Forum on 2026-09-25, Cultural Festival Night on 2026-09-27, and the AI in Education guest lecture on 2026-09-30.',
      suggestions: ['View all events', 'Register interest in a session'],
      sources: ['events']
    };
  }

  if (q.includes('exam') || q.includes('calendar')) {
    return {
      ...fallback,
      answer: 'The key academic dates include the add/drop period on 2026-09-24, the mid-semester break on 2026-10-15, and final exams from 2026-11-05.',
      suggestions: ['Open academic calendar', 'Check important deadlines'],
      sources: ['academic-calendar']
    };
  }

  if (q.includes('lost') || q.includes('found')) {
    return {
      ...fallback,
      answer: 'You can submit a Lost & Found report in the campus services section. Students and staff can log items, track status, and search for updates.',
      suggestions: ['Report an item', 'Browse lost & found'],
      sources: ['lost-found']
    };
  }

  if (q.includes('room') || q.includes('book')) {
    return {
      ...fallback,
      answer: 'Room requests are handled through the Classroom Booking flow. Pick a date, view available spaces, and submit a request. Conflicting bookings are blocked automatically.',
      suggestions: ['Check room availability', 'Submit a room request'],
      sources: ['rooms']
    };
  }

  if (q.includes('counselling') || q.includes('wellbeing') || q.includes('support')) {
    return {
      ...fallback,
      answer: 'The student counselling and wellbeing team is available via the Student Support resources section, which also lists academic mentoring and IT support contacts.',
      suggestions: ['View support resources', 'Request mentoring'],
      sources: ['support']
    };
  }

  if (q.includes('library') || q.includes('printing') || q.includes('dining')) {
    return {
      ...fallback,
      answer: 'Library hours, printing services and dining information are all available in the service information and support sections of UCL ONE.',
      suggestions: ['Open service information', 'Search library details'],
      sources: ['service-information']
    };
  }

  return fallback;
}

app.post('/api/ai', requireAuth, async (req, res) => {
  const { question } = req.body || {};
  if (!question || !String(question).trim()) {
    return res.status(400).json({ message: 'Please enter a valid question.' });
  }

  const trimmed = String(question).trim();
  const geminiKey = process.env.GEMINI_API_KEY || '';

  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `You are the UCL ONE campus assistant. Use only the following internal campus facts: ${JSON.stringify({
        announcements: state.announcements.slice(0, 4),
        events: state.events.slice(0, 4),
        supportResources: state.supportResources.slice(0, 4),
        academicCalendar: state.academicCalendar.slice(0, 4),
        faqs: state.faqs.slice(0, 4)
      })}. Answer this user question clearly and concisely, then propose 2 or 3 follow-up actions. User question: ${trimmed}`;

      const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      const text = String(result.text || '').trim();

      if (text) {
        return res.json({ answer: text, suggestions: ['Open dashboard', 'View support resources', 'Search campus info'], sources: ['gemini', 'campus-data'], grounded: true, question: trimmed, mode: 'gemini' });
      }
    } catch (error) {
      console.warn('Gemini request failed; falling back to local grounded response.', error.message);
    }
  }

  const grounded = await buildGroundedAnswer(trimmed);
  return res.json({ ...grounded, question: trimmed, grounded: true, mode: 'local-fallback' });
});

app.get('/api/health-check', requireAuth, (req, res) => {
  res.json({ status: 'ok', userRole: req.user.role });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`UCL ONE API running on http://localhost:${PORT}`);
  });
}

module.exports = { app };
