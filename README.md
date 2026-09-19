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
- Server-side RBAC (STUDENT / STAFF / ADMIN, plus per-department staff scopes — academic, society, administrative) enforced by Firestore Security Rules, not just hidden UI

## 4. Requirements Covered

See [`/docs/requirements-traceability.md`](docs/requirements-traceability.md) for the full BR1–BR33 / NFR1–NFR6 mapping, independently re-audited against the running code. Summary: 29/33 business requirements complete, 2 partial (BR24, BR27, documented), 1 partial specifically because its AI call has never executed in this environment (BR33 — see § 13), 3/6 non-functional requirements complete (NFR4, NFR5, NFR6), 3/6 partial for reasons inherent to a hackathon-scope prototype (NFR1, NFR2, NFR3).

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
- **Firestore** owns *transactional, per-user* data — room bookings, event/society interest, lost & found reports, support requests, feedback, facility issues, and the user profile (role, faculty, programme, year group, **staff department**). Every collection has its own Security Rule; see `firebase/firestore.rules`.

This split means BR2–BR32 (22 information categories) are covered by **one** Strapi content type instead of 22 bespoke backends, while the seven required action workflows (BR4, BR6, BR7, BR8, BR9, BR17, BR21) get real per-collection authorization — including BR12's department differentiation: a STAFF account's `staffDepartment` (ACADEMIC / SOCIETY / ADMINISTRATIVE / FINANCE) gates exactly which of those collections they can act on, enforced in `firestore.rules`, not just in the UI.

## 6. Technology Stack

| Layer | Choice | Disclosure |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, `react-router-dom`, `lucide-react` icons | All open-source, npm-installed |
| Auth & data | Firebase Authentication (email/password), Cloud Firestore | Google Firebase, free tier / local emulator |
| CMS | Strapi 5 (Community edition), SQLite | Open-source, self-hosted |
| AI | Google Gemini API (`gemini-2.0-flash`) via direct REST call, with a deterministic keyword-search fallback | Requires a Google AI Studio API key (optional — app works without one) |
| Testing | Vitest, `@testing-library/jest-dom`, `@firebase/rules-unit-testing`, Playwright, Firebase Local Emulator Suite | Open-source |

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
- **Demo accounts + rooms (Firebase):** run `node scripts/seed-emulator.mjs` while the emulators are running (see step 5 above). The script reads `VITE_FIREBASE_PROJECT_ID` from `frontend/.env` automatically, so it always seeds whatever project the app is actually configured for (defaults to `ucl-one-demo` if that file isn't found). It refuses to run unless both emulator host env vars resolve to a loopback address — it must never be pointed at a real project, since it creates well-known demo passwords.

  If you change `frontend/.env`'s project id after already seeding, re-run this script — a mismatch here was previously a real bug (see `docs/requirements-traceability.md` NFR4/BR12 history): the app would silently show `profile: null` with no error, since a missing Firestore document isn't a permissions failure.

## 11. Demo Credentials

| Role | Email | Password | Department |
|---|---|---|---|
| Student | `student.demo@uclone.lk` | `Demo123!` | — |
| Staff | `staff.admin@uclone.lk` | `Demo123!` | ADMINISTRATIVE (room bookings, feedback, facility issues) |
| Staff | `staff.academic@uclone.lk` | `Demo123!` | ACADEMIC (academic support requests) |
| Staff | `staff.society@uclone.lk` | `Demo123!` | SOCIETY (society sign-up roster) |
| Admin | `admin.demo@uclone.lk` | `Demo123!` | — (full access, all departments) |

Log in as different staff accounts to see the Staff Console only show the tabs that account's department grants (BR12) — this is enforced server-side in `firestore.rules`, not just hidden in the UI.

All demo data (accounts, content, rooms) is invented for this prototype — no real UCL staff, students, or data are used.

## 12. API Overview

- **Strapi REST API** (`GET /api/content-items`, `GET /api/content-items/:id`) — public read, filterable by `category`, used by `frontend/src/lib/strapi.ts`. Writes go through the Strapi admin panel only.
- **Firestore** is accessed directly from the client via the Firebase SDK (`frontend/src/lib/collections.ts`); there is no custom REST layer. Authorization happens in `firebase/firestore.rules`, not in application code — see NFR4.

## 13. AI Architecture

```
Student question → src/lib/ai.ts
  → retrieveRelevantContent(): whole-word, category-aware keyword
    search over the same content corpus Search & Discover uses
    (date tie-breaking for events)
  → if VITE_GEMINI_API_KEY is set: send the persona + grounding rules
    + retrieved content as Gemini's systemInstruction, and the raw
    student question as the sole `user` turn — kept structurally
    separate so the question can't as easily inject new instructions
    into the same field as the rules ("ignore previous instructions…")
  → if no key, or the Gemini call fails: return the same retrieved
    sources directly as a deterministic answer, clearly labelled
    "(search fallback)" — never silently pretend to be AI-generated
```

**Honest status: GEMINI NOT EXECUTED — FALLBACK VERIFIED.** `VITE_GEMINI_API_KEY` has been empty throughout this project's history. Every answer ever produced — across the original build, a forensic audit, and this fix pass — is the deterministic fallback, and every one of them correctly self-discloses that. This is stated plainly rather than left to blend into "AI-powered" language: the Gemini code path is written, reviewed, and structurally sound, but has zero execution evidence.

What *is* verified: (1) automated tests (`src/lib/ai.test.ts`, 6 tests) exercise the fallback path, including regressions for two retrieval bugs a forensic audit found — "book" matching inside "textbook", and "week" matching inside "weekly" (fixed with whole-word matching); (2) a committed, reproducible browser test (`frontend/e2e/smoke.spec.ts`, run via `npm run test:e2e`) confirms the assistant answers a real question end-to-end with zero console errors; (3) manual testing against all 10 of the officially suggested test questions plus 3 adversarial ones (gibberish, SQL-injection-shaped text, a raw `<script>` tag) produced grounded, non-hallucinated, non-exploitable answers every time.

## 14. Security

- Passwords: handled entirely by Firebase Authentication (never touched or stored by our code).
- Authorization: enforced server-side by Firestore Security Rules — 44+ automated tests run against the real Firestore emulator (`npm run test:rules`), not a mock, including department-boundary enforcement (BR12: a staff member outside the right department is rejected server-side, not just hidden from the UI).
- The public Strapi content API is forced to `status=published` server-side regardless of what a caller requests — a prior version of this trusted a client-supplied query param and let anonymous requests read unpublished draft content; fixed and covered by a reproducible check (`cms/scripts/verify-public-api-security.mjs`).
- Public signup can only ever create STUDENT accounts. STAFF/ADMIN accounts (and their department) are provisioned out-of-band (seed script), because this repository is public and any client-embedded "staff signup code" would be visible to anyone reading the source.
- No secrets are hard-coded; `.env` files are git-ignored (`.env.example` is committed). Verified via `git grep` for API-key-shaped strings in tracked files.
- See [`/docs/requirements-traceability.md`](docs/requirements-traceability.md) NFR4 for the two remaining documented trade-offs (booking-record read visibility, and the Gemini key being client-side if ever configured — there's no backend proxy in this architecture).

## 15. Testing

Real, automated, currently-passing test evidence — 76+ tests across four suites, plus a committed end-to-end suite:

| Suite | Command | Count | What it proves |
|---|---|---|---|
| Unit logic | `npm test` (in `frontend/`) | 29 | RBAC/department permission map, BR2 targeting (filter, not just sort), BR8 time-overlap conflict detection, BR33 AI fallback behaviour incl. two retrieval-bug regressions |
| Firestore rules + booking integration | `npm run test:rules` | 44 | Real authorization enforcement against the live Firestore emulator — student/staff/admin/department boundaries on every collection, privilege-escalation rejection, BR8's approval-time conflict transaction (no conflict / exact overlap / partial overlap / adjacent / different room / wrong department) |
| Auth | `npm run test:auth` | 3 | Real Firebase Authentication against the live emulator — valid login, wrong password, unregistered email |
| E2E smoke (Playwright) | `npm run test:e2e` | 1 golden path, 12 steps | Committed and reproducible from a clean clone (with emulators/Strapi/seed running) — login → search → dashboard → event interest → society join → room booking → lost & found → AI assistant → logout → staff approval, zero console errors |

Run `npm test && npm run test:rules && npm run test:auth && npm run test:e2e` inside `frontend/` (emulators + Strapi + seed must be running for the last three — see § 7).

## 16. Known Limitations

- **BR24 (Sports booking) and BR27 (Textbook exchange):** visibility-only, see traceability doc for why.
- **Room booking approval is optimistic-concurrency-checked, not fully pessimistically locked.** `decideBooking` re-validates against every other APPROVED booking inside a Firestore transaction at commit time (closing the gap where two overlapping requests could both be approved with zero warning), but a booking created in the exact same instant, after the initial candidate query, is not covered. A production system would additionally want a server-side transaction boundary (Cloud Function) to close this fully.
- **`roomBookings` read access is broader than ideal** (any signed-in user, not just the owner) because Firestore rejects "unsafe" list queries — documented in `firebase/firestore.rules`.
- **BR12's FINANCE department has no dedicated Firestore-backed action.** Financial-support content lives entirely in the Strapi CMS, which has its own separate admin authentication — the underlying need is met through that mechanism, not this app's department system.
- **AI Assistant has never executed a real Gemini call in this environment.** `VITE_GEMINI_API_KEY` has been empty throughout the project's history. See § 13 for exactly what is and isn't verified.
- **The vendor JS bundle (~823 kB gzipped ~249 kB) is still large** even after route-level code splitting (§ NFR2) — it's mostly the Firebase SDK, used by nearly every route, so further reduction would mean removing functionality rather than just splitting it.

## 17. Future Improvements

- Cloud Function-enforced fully atomic booking transactions (closing the narrow remaining race window described above)
- Student-authored textbook marketplace and sports-facility booking, reusing the room-booking pattern
- A Cloud Function proxy for the Gemini API key, so it's never sent to the client
- Push notifications (BR-adjacent: `notifications` collection already modelled in Firestore, not yet wired to a UI)
- A client-side cache (React Query) for NFR2, on top of the code-splitting already done
- Retry/offline handling for NFR3
- A FINANCE-department Firestore-backed action, if a real one emerges (deliberately not invented for this build — see BR12 in the traceability doc)

## 18. Libraries / APIs Used and Disclosure

React, TypeScript, Vite, Tailwind CSS, `react-router-dom`, `lucide-react`, Firebase JS SDK, Firebase Admin SDK (seed script only), Strapi, Vitest, `@testing-library/jest-dom`, `@firebase/rules-unit-testing`, Playwright (`@playwright/test`, committed E2E suite), Google Gemini API. All are publicly available open-source packages or documented third-party APIs, disclosed here per the hackathon rules. AI assistance (Claude) was used as a coding aid during the build — see Team Contribution.

## 19. Team Contribution

Built by Team Dewshan's Kids for DevDash'26. This submission was produced with Claude (Anthropic) as an AI pair-programming aid under direct human direction for the DevDash'26 hackathon window — every architectural decision (data model, RBAC design, content-engine vs. bespoke-module split, AI grounding strategy) was directed and reviewed by the team, consistent with the hackathon's AI-as-aid rule.

## 20. Repository

Submitted via the DevDash'26 GitHub organization: [`DevDash-26/Dewshan-s-kids`](https://github.com/DevDash-26/Dewshan-s-kids).
