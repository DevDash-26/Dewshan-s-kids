# Presentation outline (8 minutes)

## 0:00–0:45 — Problem
- Students rely on WhatsApp, notice boards, lecturers and word of mouth.
- There is no single trusted source for campus information.
- We built a single digital campus hub to bring official information and services together.

## 0:45–1:30 — Solution
- UCL ONE provides a student dashboard, search, announcements, service modules and AI assistant.
- The product is role-aware and targeted to the student profile.
- We used a reusable content model rather than building isolated mini-apps.

## 1:30–2:00 — Architecture
- React frontend for the student experience.
- Express backend for business logic and RBAC.
- JSON-backed demo data and in-memory state for rapid hackathon execution.
- Deterministic AI fallback grounded in local app data when no external model is configured.

## 2:00–5:00 — Live demo
1. Student login
2. Dashboard overview and targeted announcement
3. Ask AI about events or library information
4. Browse events and register interest
5. Check classroom availability and request a room
6. Submit a lost-and-found item or view support resources

## 5:00–5:45 — Technical depth
- JWT authentication and role checks
- Duplicate-interest prevention
- Room conflict validation
- Search, filtering and targeted announcement logic

## 5:45–6:30 — Innovation
- Unified campus content engine rather than one-off modules
- AI grounded in application data and suggestions to actual app actions
- Role-aware, profile-based student experience

## 6:30–7:15 — Requirements and prioritisation
- Priority was given to working core flows over decorative breadth.
- We covered major student actions and core platform logic.
- Several optional categories were intentionally left as future work.

## 7:15–7:45 — Impact
- Fewer disconnected channels
- Less missed information
- Faster access to key actions and services

## 7:45–8:00 — Closing
- State that the prototype is a defensible MVP built to demonstrate a real university experience under a six-hour time constraint.
- Explain what remains as a future enhancement roadmap.
