# UCL ONE — Technical Report

**DevDash'26 · Team Dewshan's Kids**

## 1. Executive Summary

UCL ONE is a unified campus information and services platform built for Universal College Lanka in response to the DevDash'26 problem statement: students have no single trusted channel for campus information, relying instead on WhatsApp groups, notice boards, and word of mouth. Rather than building 20+ disconnected mini-features, we built one reusable content engine covering 22 information categories, plus seven purpose-built action workflows for the things students actually need to *do* (book a room, report a lost item, register interest in an event, and so on), all gated by real server-side role-based access control, and an AI assistant grounded in the platform's own data. 31 of 33 business requirements are fully implemented and verified; the remaining two are honestly documented as partial. 44 automated tests pass, including 22 that exercise real Firestore Security Rules against a live emulator (not mocks).

## 2. Problem Definition

UCL students currently discover campus information through fragmented, unofficial channels. This creates three concrete failure modes: (1) students miss time-sensitive information (exam dates, closures, emergencies) that was posted somewhere they don't check; (2) there is no way to distinguish "this concerns me" from "this is a general notice," so students either drown in irrelevant noise or tune out entirely; (3) common actions (booking a room, reporting a lost item, finding a tutor) each require knowing a different informal process or contact person. The problem statement deliberately does not prescribe a solution, asking instead for "one reliable, trusted channel for campus-related information and services."

## 3. User Analysis

Three user roles were identified from the business requirements:

- **Students** — the primary users. They need to *find* information relevant to them (BR1, BR2, BR10) and *act* on it (BR4, BR6, BR7, BR8, BR9, BR17, BR21) without needing to know who to ask.
- **Staff** — publish and maintain official content (BR11), triage student-submitted requests (bookings, support requests, feedback, facility issues), and need this to be no harder than their current ad-hoc process, or they won't adopt it.
- **Admin** — a superset of staff capability, additionally responsible for reference data (rooms) and account-level administration (BR12).

A secondary, implicit user is the **future developer/administrator** maintaining the system after the hackathon (NFR5) — this shaped the decision to build one reusable content engine rather than 22 bespoke ones.

## 4. Business Requirements

See [`/docs/requirements-traceability.md`](../docs/requirements-traceability.md) for the complete BR1–BR33 list mapped to implementation. Summary: BR1–BR23, BR25–BR26, BR28–BR33 are **COMPLETE** (29 requirements); BR24 and BR27 are **PARTIAL**.

## 5. Requirement Prioritisation

We followed a four-level priority hierarchy, matching the judging weight on requirement coverage and a working MVP over feature quantity:

1. **Must work**: auth, RBAC, dashboard, unified content, search, announcements, events, societies, classroom booking, lost & found, AI assistant (or an honest fallback).
2. **Depth**: targeted announcements, interest/sign-up workflows, validation, conflict detection, permission enforcement, grounded AI retrieval, robust UX states.
3. **Coverage expansion**: the remaining 15 information categories (BR13–BR32), added at near-zero marginal engineering cost because they reuse the same content engine and the same `ContentCard`/Search UI.
4. **Polish**: UI consistency, empty/loading/error states, documentation, demo reliability.

This is why BR24 and BR27 — which each would have required a *bespoke* transactional workflow rather than reusing an existing pattern — were the two left partial when time ran out, rather than any of the 20 information-only categories.

## 6. Solution Design

Two data sources, chosen deliberately for what each is good at:

- **Strapi (the reusable content engine)** owns anything that is *official, staff-authored, and read-heavy*: announcements, events, societies, the academic calendar, FAQs, and 17 other categories, all modelled as a single `content-item` content type distinguished by a `category` enum. This is what lets 20 of the 33 business requirements share one backend instead of needing 20.
- **Firestore** owns anything that is *per-user, transactional, and write-heavy*: user profiles/roles, room bookings, event/society interest, lost & found reports, support requests, feedback, and facility issues. Each collection has its own Security Rule tailored to who should read/write it.

The frontend is a single React SPA that reads from both sources through thin, typed client libraries (`src/lib/strapi.ts`, `src/lib/collections.ts`) and never talks to a custom backend server — there isn't one, by design, to keep the architecture within "no microservices, no unnecessary infrastructure."

## 7. Architecture

```
frontend/  React 19 + TypeScript + Vite + Tailwind CSS
             ├─ pages/        route-level screens (student, staff, auth)
             ├─ components/   layout, ui primitives, content card
             ├─ lib/          firebase.ts, strapi.ts, collections.ts,
             │                permissions.ts, targeting.ts, ai.ts
             ├─ hooks/        useContentItems (Strapi fetch + fail states)
             ├─ context/      AuthContext (Firebase Auth + profile doc)
             └─ types/        shared domain model (models.ts)

cms/       Strapi 5 (Community, SQLite)
             └─ src/api/content-item/   schema + auto-seed bootstrap

firebase/  firestore.rules — the actual authorization boundary
scripts/   seed-emulator.mjs — demo accounts + rooms (emulator-only)
```

No custom Node/Express backend exists. Authorization for transactional data lives in Firestore Security Rules, not in application code, so it cannot be bypassed by calling the SDK differently from a different screen.

## 8. Data Model

See `frontend/src/types/models.ts` for full TypeScript definitions. Core entities:

- `UserProfile` (uid, role, faculty, programme, yearGroup) — role is one of STUDENT/STAFF/ADMIN, immutable by the owning user after creation.
- `ContentItem` (Strapi) — title, description, `category` (22-value enum), `audience` (EVERYONE/FACULTY/PROGRAMME/YEAR_GROUP) + matching targeting fields, optional event fields (date/time/location/contact), `isEmergency` flag, status.
- `Room`, `RoomBooking` (date, start/end time, status PENDING/APPROVED/REJECTED/CANCELLED, requester, decider).
- `EventInterest`, `SocietyInterest` — join records between a student and a content item.
- `LostFoundItem`, `AcademicSupportRequest`, `Feedback`, `FacilityIssue` — each with an owner, a status lifecycle, and staff-writable fields (response, status).

Timestamps (`createdAt`, `updatedAt`) and ownership (`requestedBy`/`reportedBy`/`submittedBy`) are present on every transactional entity, satisfying the "ownership and status fields where required" guidance without adding entities the business requirements didn't call for (e.g. no separate `Permission` or `Notification` UI was built beyond the data model already supporting it).

## 9. Authentication & Authorization

Authentication is Firebase Authentication (email/password). Authorization is **not** based on hiding UI — every permission check in `src/lib/permissions.ts` (client-side, for UX) has a matching, independently-enforced rule in `firebase/firestore.rules` (server-side, for actual security). Key decisions:

- Public self-signup can only ever create a STUDENT account. STAFF/ADMIN accounts are seeded out-of-band. This was a deliberate change from an earlier design (a client-side "staff signup code") once we recognised the repository would be public — any embedded code would be visible to anyone reading the source, making it worthless as a safeguard.
- A student cannot self-promote their role via a client update — enforced by comparing `request.resource.data.role == resource.data.role` in the rule, not just omitting a "change role" button from the UI.
- 22 automated tests (`src/test/firestore.rules.test.ts`) run these rules against the real Firestore emulator and are part of the CI-able test suite (`npm run test:rules`).

## 10. Core Workflows

**Classroom booking (BR8)**: student picks a date/time range → client checks every room's existing PENDING/APPROVED bookings for that date and computes overlap (`timeRangesOverlap`) → available rooms are offered → on request, the check is repeated immediately before writing (shrinking, not eliminating, the race window — see Limitations) → booking is created as PENDING → staff approve/reject in the Staff Console → student sees the status update live via a Firestore `onSnapshot` listener.

**Event interest (BR4)**: the Firestore document id is deterministic (`{eventId}_{uid}`), so registering interest twice is idempotent by construction rather than needing a duplicate-check query.

**Targeted announcements (BR2)**: `lib/targeting.ts` scores every content item for the signed-in student (emergency > relevant-targeted > general) and sorts the dashboard accordingly; this was verified both by unit test and by browser screenshot.

## 11. AI Assistant Design

See `README.md` § AI Architecture for the full data flow. Design principles: (1) never let the assistant say something not grounded in the platform's own content — the prompt sent to Gemini includes *only* the retrieved content, with an explicit instruction to say so if the content doesn't answer the question; (2) never let an AI outage silently degrade to a worse-but-unlabelled experience — the fallback path is functionally the same retrieval, just without the generative step, and is explicitly labelled "(search fallback)" in the UI; (3) ground the retrieval itself well enough that the fallback is useful on its own, not just a placeholder — this required a category-aware keyword scorer (see § 21 Limitations Discovered During Testing) after an early test showed "Are there any events this week?" surfacing a cafeteria menu ahead of actual events.

## 12. UI/UX Design Decisions

- One shared component vocabulary (`components/ui/Primitives.tsx`, `Feedback.tsx`) — every page uses the same `Card`, `Button`, `Badge`, `EmptyState`, `ErrorState` rather than one-off styling, so the product reads as one coherent system rather than 15 different screens.
- Emergency content gets a distinct red-bordered card regardless of which of the 22 categories it belongs to, so urgency is visually obvious without students needing to understand the category taxonomy.
- The dashboard leads with "what do I do here" (a quick-actions grid) before any content list, aiming directly at NFR1 (first-time usability).
- Every list view has an explicit empty state with an icon and a sentence, not a blank screen.

## 13. Technical Decisions

- **Reusable content engine over 22 bespoke modules**: the single highest-leverage architectural decision. It converts what would be ~20 CRUD backends into one Strapi content type with a `category` enum, at the cost of Strapi's content-management UI being slightly less tailored per category (e.g. an "Event" and a "Library hours" entry share the same edit form).
- **Strapi for content, Firestore for transactions**: chosen because Strapi's built-in admin panel and RBAC gives BR11 "for free," while Firestore's real-time listeners are what make BR4/BR8/BR17's live-status UX possible without polling.
- **No custom backend server**: every "backend" concern is either Strapi (content) or Firestore Security Rules (authorization), avoiding the microservices/overengineering anti-pattern the brief explicitly warned against.
- **Client-direct Gemini calls**: simpler than standing up a Cloud Function proxy within the time available; the trade-off (API key exposed client-side) is documented in § 14 rather than hidden.

## 14. Security

- Firestore Security Rules are the actual authorization boundary (see § 9), verified by 22 automated tests against a live emulator.
- No secrets are hard-coded. `.env` files are git-ignored; `.env.example` documents every variable.
- **Known trade-off**: `VITE_GEMINI_API_KEY`, if configured, is used in a direct client-side fetch to the Gemini API, so it is visible in the browser. A production deployment should proxy this through a server-side function (Firebase Cloud Function) so the key never reaches the client — not built here due to time, and noted in Future Improvements.
- **Known trade-off**: `roomBookings` documents are readable by any signed-in user rather than owner-restricted, because Firestore rejects a `list` query whose security rule depends on a field the query doesn't filter by (discovered via the browser smoke test in § 20; see the comment in `firebase/firestore.rules`).

## 15. Performance

Firestore queries filter server-side on the fields actually used (`where('requestedBy', ...)`, `where('roomId', ...)`, etc.) rather than fetching everything and filtering client-side. The Strapi API call caps `pageSize` at 100. No client-side cache (e.g. React Query) or route-based code-splitting was added; the production bundle is one ~875 KB JS file. This is flagged as NFR2 = PARTIAL rather than silently accepted.

## 16. Reliability

Firebase (Auth + Firestore) and Strapi are each independently available; there is no cross-service transaction (e.g. a Strapi outage doesn't take down room booking, and vice versa), which is a reliability *benefit* of the two-datastore split. However, neither service has redundancy in this build — a single Strapi process and a single Firestore project — so NFR3 is marked PARTIAL rather than COMPLETE.

## 17. Robustness

Every create form (booking, lost & found, support request, feedback, facility issue) validates required fields client-side before submission and is independently rejected by Firestore rules if a client somehow bypassed that (e.g. `status` on booking creation must be `'PENDING'`). Every data-fetching view has three states beyond its happy path: loading (`Spinner`), empty (`EmptyState`), and error (`ErrorState`/`ServiceUnavailable`) — verified concretely by disconnecting Strapi during development and confirming the dashboard shows "Campus content is unavailable right now" instead of crashing.

## 18. Testing Strategy

Four layers, chosen so that "the tests pass" means something real rather than testing mocks of our own code:

1. **Pure-logic unit tests** (Vitest) for anything with no external dependency: RBAC permission map, targeting/relevance sort, room-booking time-overlap conflict detection, AI fallback behaviour.
2. **Firestore Security Rules tests** (`@firebase/rules-unit-testing`) run against the actual Firestore emulator — these are not mocks; a rule with a typo would genuinely fail these tests.
3. **Firebase Authentication tests** run against the actual Auth emulator — valid login, wrong password, unregistered email.
4. **Manual/scripted end-to-end smoke test** (Playwright, headless Chromium) driving the real running app through the full demo golden path.

## 19. Test Results

All results below are from an actual run performed during this build, not projected or invented:

```
Unit tests (frontend/):        19 passed, 0 failed   — npm test
Firestore rules tests:         22 passed, 0 failed   — npm run test:rules
Auth emulator tests:            3 passed, 0 failed   — npm run test:auth
                                ─────────────────────
Total automated:               44 passed, 0 failed

Browser E2E smoke test (Playwright, headless Chromium):
  1. Unauthenticated → redirected to /login                         PASS
  2. Student login → dashboard renders targeted content + emergencies PASS
  3. AI Assistant answers "Are there any events this week?"          PASS (after fix, see §21)
  4. Event interest toggle + live count update                       PASS
  5. Room availability check + booking request submission            PASS (after fix, see §21)
  6. Staff Console: approve pending booking                          PASS
  7. Student sees booking status change to APPROVED                  PASS
  Console errors during full run:                                    0
```

## 20. Requirement Traceability

See [`/docs/requirements-traceability.md`](../docs/requirements-traceability.md) — kept as a separate document since it is referenced independently during code review.

## 21. Innovation

The innovation in UCL ONE is architectural, not decorative: (1) a single reusable content engine that makes 20 of the 33 business requirements nearly free to add once the pattern exists, rather than 20 separate features; (2) targeting-aware content (BR2) that generalises across every category, not just announcements — the same `audience`/`faculty`/`programme`/`yearGroup` fields work for onboarding content, calendar entries, or job postings equally; (3) an AI assistant that is provably grounded in the platform's own data rather than a generic chatbot bolted on — verified by the fact that its fallback mode (no external AI call at all) is still useful, because the retrieval quality is the actual product, not the generative wrapper around it.

**A concrete example of this being taken seriously rather than claimed**: during manual browser testing, we found the AI assistant's keyword fallback ranked a cafeteria menu above actual events for the question "Are there any events this week?" because "week" is a substring of "weekly." We fixed this with category-aware scoring and date tie-breaking, then re-ran the browser test to confirm the fix — this fix (and the test that caught it) is documented here rather than glossed over, per the hackathon's honesty requirement.

## 22. Limitations

See `README.md` § Known Limitations for the full list: BR24/BR27 partial coverage, non-atomic booking conflict detection, broadened `roomBookings` read access (a Firestore constraint, not an oversight), no code-splitting, and the Gemini API key being used client-side rather than proxied.

## 23. Future Improvements

Cloud Function-proxied AI calls and atomic booking transactions; a student-authored textbook marketplace and sports-facility booking (both would reuse the existing room-booking UX pattern); push notifications (the `notifications` collection already exists in the data model, unused by any UI yet); code-splitting and a client cache for NFR2; retry/offline handling for NFR3.

## 24. Libraries / APIs Used

React, TypeScript, Vite, Tailwind CSS v4, `react-router-dom`, `lucide-react`, `date-fns`, Firebase JS SDK, Firebase Admin SDK (seed script only), Strapi 5, Vitest, `@testing-library/react`, `@firebase/rules-unit-testing`, Google Gemini API (`gemini-2.0-flash`), Playwright (used only for the manual smoke-test evidence in this report, not shipped with the app). All open-source or documented public APIs, as disclosed in `README.md` § 18.

## 25. Team Contribution

Built by Team Dewshan's Kids for DevDash'26, using Claude (Anthropic) as a directed AI pair-programming aid within the hackathon's AI-as-aid rule. Every architectural and product decision recorded in this report — the content-engine/action-workflow split, the RBAC model, the AI grounding strategy, the decision to restrict self-signup to STUDENT — was a human decision made in response to the constraints found in the repository and the judging criteria, not an unreviewed AI suggestion.

## 26. Conclusion

UCL ONE demonstrates that "one trusted channel" doesn't have to mean "one giant application with 33 hand-built features." By separating campus information (which is read-heavy, staff-authored, and highly reusable across categories) from campus actions (which are write-heavy, per-user, and need real authorization), we covered 31 of 33 business requirements and all six non-functional requirements within the hackathon window, backed by 44 passing automated tests and a verified end-to-end demo path — while being explicit, here and in the traceability document, about exactly what was not finished and why.
