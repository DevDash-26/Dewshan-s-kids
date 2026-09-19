# UCL ONE — DevDash'26

**One trusted digital hub for campus information and services at Universal College Lanka.**

## 1. Problem

Students at UCL currently rely on disconnected channels — WhatsApp groups, lecturers, notice boards, societies, word of mouth — for everything from exam dates to lost ID cards. There is no single, trusted, role-aware channel for campus information and services.

## 2. Solution

UCL ONE is a unified campus platform, not a bundle of unrelated mini-apps. A single **reusable content engine** (built on Strapi) covers 22 categories of campus information — announcements, events, societies, the academic calendar, wellbeing resources, jobs, and more — so adding a new information category never requires a new database table or a new page type. On top of that sit purpose-built **action workflows** (Firebase-backed) for the things students actually *do*: book a room, report a lost item, express interest in an event, request academic support, and ask an AI assistant a plain-language question.

## 3. Key Features

- Role-aware dashboard with targeted announcements, emergency notices, upcoming events and quick actions
- Unified search & discovery across all 22 content categories
- Events with interest tracking (turnout estimation) and societies with sign-up
- Classroom booking with real-time availability checking and conflict detection
- Lost & Found, academic support requests, facility issue reporting, feedback — all with staff triage
- AI Assistant grounded in the platform's own content, with a transparent, functional fallback when no AI provider key is configured
- Server-side RBAC (STUDENT / STAFF / ADMIN) enforced by Firestore Security Rules, not just hidden UI

## 4. Requirements Covered

See [`/docs/requirements-traceability.md`](docs/requirements-traceability.md) for the full BR1–BR33 / NFR1–NFR6 mapping. Summary: 31/33 business requirements complete, 2 partial (documented), all 6 non-functional requirements addressed.

## 5. Architecture

```
frontend/   React + TypeScript + Vite + Tailwind — the student/staff web app
cms/        Strapi (Community edition) — the reusable content engine, SQLite-backed
firebase/   Firestore Security Rules (the actual authorization boundary)
scripts/    Emulator seed script (demo accounts + rooms)
docs/       Requirements traceability, presentation outline, judge Q&A
report/     Full technical report
```

**Two data sources, one app:**
- **Strapi** owns *informational* content — the 22 categories in BR1–BR33 that are staff/admin-authored (announcements, events, societies, FAQs, calendar, support resources, etc.). Public read access; writes require a Strapi admin login.
- **Firestore** owns *transactional, per-user* data — room bookings, event/society interest, lost & found reports, support requests, feedback, facility issues, and the user profile (role, faculty, programme, year group). Every collection has its own Security Rule; see `firebase/firestore.rules`.

This split means BR2–BR32 (22 information categories) are covered by **one** Strapi content type instead of 22 bespoke backends, while the seven required action workflows (BR4, BR6, BR7, BR8, BR9, BR17, BR21) get real per-collection authorization.

## 6. Technology Stack

| Layer | Choice | Disclosure |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, `react-router-dom`, `lucide-react` icons | All open-source, npm-installed |
| Auth & data | Firebase Authentication (email/password), Cloud Firestore | Google Firebase, free tier / local emulator |
| CMS | Strapi 5 (Community edition), SQLite | Open-source, self-hosted |
| AI | Google Gemini API (`gemini-2.0-flash`) via direct REST call, with a deterministic keyword-search fallback | Requires a Google AI Studio API key (optional — app works without one) |
| Testing | Vitest, Testing Library, `@firebase/rules-unit-testing`, Firebase Local Emulator Suite | Open-source |

No AI-generated code was represented as hand-written, and no part of the *design decisions* (data model, RBAC model, category taxonomy) was produced by an AI without human direction — see the team contribution section below.

## 7. Setup Instructions

Prerequisites: Node.js 20+, Java 21+ (only needed to run the Firebase emulators locally), Git.

```bash
# 1. Install dependencies
cd frontend && npm install
cd ../cms && npm install
cd ../scripts && npm install

# 2. Configure environment
cd ../frontend && cp .env.example .env
# Fill in Firebase project values, or leave VITE_USE_FIREBASE_EMULATORS=true
# to run entirely against the local emulator (recommended for evaluation).

# 3. Start the CMS (first run seeds 34 demo content items automatically)
cd ../cms && npm run develop
# Strapi admin: http://localhost:1337/admin (create your own admin login on first visit)

# 4. Start Firebase emulators (Auth + Firestore)
cd ..
firebase emulators:start --only auth,firestore

# 5. Seed demo accounts + rooms into the emulator (run once, while emulators are up)
cd scripts && node seed-emulator.mjs

# 6. Start the frontend
cd ../frontend && npm run dev
# App: http://localhost:5173
```

To run against a **real** Firebase project instead of the emulator: create a project at the Firebase console, enable Email/Password auth and Firestore, deploy `firebase/firestore.rules` (`firebase deploy --only firestore:rules`), fill `frontend/.env` with the real project config, and set `VITE_USE_FIREBASE_EMULATORS=false`.

## 8. Environment Variables

See [`frontend/.env.example`](frontend/.env.example) for the full list. None of the Firebase web config values are secrets (they're public client identifiers — access control is Firestore Security Rules, not obscurity). The only value that is a genuine secret is `VITE_GEMINI_API_KEY`, which is optional.

## 9. Database Setup

Firestore is schemaless — collections are created on first write. `firebase/firestore.rules` defines the authorization boundary for: `users`, `rooms`, `roomBookings`, `eventInterests`, `societyInterests`, `lostFoundItems`, `academicSupportRequests`, `feedback`, `facilityIssues`, `notifications`. Strapi's SQLite database (`cms/.tmp/data.db`) is created automatically on first run.

## 10. Seed Instructions

- **Content (Strapi):** runs automatically on first `npm run develop` if the `content-items` table is empty (see `cms/src/index.ts`). 34 invented demo items across all 22 categories.
- **Demo accounts + rooms (Firebase):** run `node scripts/seed-emulator.mjs` while the emulators are running (see step 5 above). This script refuses to run against anything except the emulator.

## 11. Demo Credentials

| Role | Email | Password |
|---|---|---|
| Student | `student.demo@uclone.lk` | `Demo123!` |
| Staff | `staff.demo@uclone.lk` | `Demo123!` |
| Admin | `admin.demo@uclone.lk` | `Demo123!` |

All demo data (accounts, content, rooms) is invented for this prototype — no real UCL staff, students, or data are used.

## 12. API Overview

- **Strapi REST API** (`GET /api/content-items`, `GET /api/content-items/:id`) — public read, filterable by `category`, used by `frontend/src/lib/strapi.ts`. Writes go through the Strapi admin panel only.
- **Firestore** is accessed directly from the client via the Firebase SDK (`frontend/src/lib/collections.ts`); there is no custom REST layer. Authorization happens in `firebase/firestore.rules`, not in application code — see NFR4.

## 13. AI Architecture

```
Student question → src/lib/ai.ts
  → retrieveRelevantContent(): keyword-scored search over the same
    content corpus Search & Discover uses (category-aware ranking,
    date tie-breaking for events)
  → if VITE_GEMINI_API_KEY is set: build a prompt that includes ONLY
    the retrieved content, call Gemini, return its answer + the
    sources used + suggested in-app routes
  → if no key, or the Gemini call fails: return the same retrieved
    sources directly as a deterministic answer, clearly labelled
    "(search fallback)" — never silently pretend to be AI-generated
```

This was verified two ways: (1) automated tests (`src/lib/ai.test.ts`) exercise the fallback path with no key configured; (2) a full browser smoke test (see `/report/report.md` § Test Results) confirms the assistant answers "Are there any events this week?" with the three soonest actual events, not an unrelated keyword match.

## 14. Security

- Passwords: handled entirely by Firebase Authentication (never touched or stored by our code).
- Authorization: enforced server-side by Firestore Security Rules — 22 automated tests run against the real Firestore emulator (`npm run test:rules`), not a mock.
- Public signup can only ever create STUDENT accounts. STAFF/ADMIN accounts are provisioned out-of-band (seed script), because this repository is public and any client-embedded "staff signup code" would be visible to anyone reading the source.
- No secrets are hard-coded; `.env` files are git-ignored (`.env.example` is committed).
- See [`/docs/requirements-traceability.md`](docs/requirements-traceability.md) NFR4 for the one documented trade-off (booking-record read visibility).

## 15. Testing

Real, automated, currently-passing test evidence — 44 tests across four suites:

| Suite | Command | Count | What it proves |
|---|---|---|---|
| Unit logic | `npm test` (in `frontend/`) | 19 | RBAC permission map, BR2 targeting/relevance sorting, BR8 time-overlap conflict detection, BR33 AI fallback behaviour |
| Firestore rules | `npm run test:rules` | 22 | Real authorization enforcement against the live Firestore emulator — student/staff/admin boundaries on every collection, privilege-escalation rejection |
| Auth | `npm run test:auth` | 3 | Real Firebase Authentication against the live emulator — valid login, wrong password, unregistered email |
| Manual E2E smoke test | Playwright, see report | 1 golden path | Login → dashboard → AI assistant → event interest → room booking → staff approval → student sees approval, zero console errors |

Run `npm test && npm run test:rules && npm run test:auth` inside `frontend/` (emulators must be running for the last two).

## 16. Known Limitations

- **BR24 (Sports booking) and BR27 (Textbook exchange):** visibility-only, see traceability doc for why.
- **Room booking conflict detection is not atomic.** Two students could theoretically request the same slot within the same few hundred milliseconds; a production system would enforce this with a server-side transaction (Cloud Function), which was out of scope for the time available.
- **`roomBookings` read access is broader than ideal** (any signed-in user, not just the owner) because Firestore rejects "unsafe" list queries — documented in `firebase/firestore.rules`.
- **No code-splitting**: the production bundle is a single ~875 KB JS file. Acceptable for a prototype; would be addressed with route-based `React.lazy` in a real deployment.
- **AI Assistant runs without a live Gemini key in this evaluation environment.** The integration code is complete and was written against the real Gemini API; only the fallback path could be demonstrated without provisioning a paid/rate-limited external API key during the build window.

## 17. Future Improvements

- Cloud Function-enforced atomic booking transactions
- Student-authored textbook marketplace and sports-facility booking, reusing the room-booking pattern
- Push notifications (BR-adjacent: `notifications` collection already modelled in Firestore, not yet wired to a UI)
- Code-splitting and a client-side cache (React Query) for NFR2
- Retry/offline handling for NFR3

## 18. Libraries / APIs Used and Disclosure

React, TypeScript, Vite, Tailwind CSS, `react-router-dom`, `lucide-react`, `date-fns`, Firebase JS SDK, Firebase Admin SDK (seed script only), Strapi, Vitest, Testing Library, `@firebase/rules-unit-testing`, Google Gemini API. All are publicly available open-source packages or documented third-party APIs, disclosed here per the hackathon rules. AI assistance (Claude) was used as a coding aid during the build — see Team Contribution.

## 19. Team Contribution

Built by Team Dewshan's Kids for DevDash'26. This submission was produced with Claude (Anthropic) as an AI pair-programming aid under direct human direction for the DevDash'26 hackathon window — every architectural decision (data model, RBAC design, content-engine vs. bespoke-module split, AI grounding strategy) was directed and reviewed by the team, consistent with the hackathon's AI-as-aid rule.

## 20. Repository

Submitted via the DevDash'26 GitHub organization: [`DevDash-26/Dewshan-s-kids`](https://github.com/DevDash-26/Dewshan-s-kids).
