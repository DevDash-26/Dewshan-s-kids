# UCL ONE — Technical Report

**DevDash'26 · Team Dewshan's Kids**

## 1. Executive Summary

UCL ONE is a unified campus information and services platform built for Universal College Lanka in response to the DevDash'26 problem statement: students have no single trusted channel for campus information, relying instead on WhatsApp groups, notice boards, and word of mouth. Rather than building 20+ disconnected mini-features, we built one reusable content engine covering 22 information categories, plus seven purpose-built action workflows for the things students actually need to *do* (book a room, report a lost item, register interest in an event, and so on), all gated by real server-side role-based access control (including per-department staff scopes for BR12), and an AI assistant grounded in the platform's own data. 29 of 33 business requirements are fully implemented and verified; two remain honestly documented as partial, and one (BR33, the AI assistant) is marked partial specifically because its live AI call has never executed in this environment — stated plainly rather than left ambiguous. 76+ automated tests pass across four suites, plus a committed, reproducible end-to-end suite, none of them mocking our own code — Firestore rules, Firebase Auth, and the browser flow are all exercised against real, running infrastructure.

This report includes a self-critical section (§ 21) describing a forensic re-audit performed partway through the build, which found and fixed real gaps that an earlier draft of this same report had described more optimistically than the code actually supported — a booking-approval workflow with no conflict check, a public API that leaked draft content, targeting logic that sorted rather than filtered, and more. Those fixes, and the process that found them, are documented rather than smoothed over.

## 2. Problem Definition

UCL students currently discover campus information through fragmented, unofficial channels. This creates three concrete failure modes: (1) students miss time-sensitive information (exam dates, closures, emergencies) that was posted somewhere they don't check; (2) there is no way to distinguish "this concerns me" from "this is a general notice," so students either drown in irrelevant noise or tune out entirely; (3) common actions (booking a room, reporting a lost item, finding a tutor) each require knowing a different informal process or contact person. The problem statement deliberately does not prescribe a solution, asking instead for "one reliable, trusted channel for campus-related information and services."

## 3. User Analysis

Three user roles were identified from the business requirements:

- **Students** — the primary users. They need to *find* information relevant to them (BR1, BR2, BR10) and *act* on it (BR4, BR6, BR7, BR8, BR9, BR17, BR21) without needing to know who to ask.
- **Staff** — publish and maintain official content (BR11) and triage student-submitted requests (bookings, support requests, feedback, facility issues) *within their own department* (BR12: academic, society, or administrative), and need this to be no harder than their current ad-hoc process, or they won't adopt it.
- **Admin** — a superset of staff capability across every department, additionally responsible for reference data (rooms) and account-level administration.

A secondary, implicit user is the **future developer/administrator** maintaining the system after the hackathon (NFR5) — this shaped the decision to build one reusable content engine rather than 22 bespoke ones.

## 4. Business Requirements

See [`/docs/requirements-traceability.md`](../docs/requirements-traceability.md) for the complete BR1–BR33 list mapped to implementation, re-audited against the running code after the forensic review in § 21. Summary: 29 requirements are **COMPLETE**; BR24 and BR27 are **PARTIAL** (unchanged, documented reasons); BR33 is **PARTIAL** specifically because its Gemini call has never executed in this environment, even though the surrounding architecture is complete and tested.

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

- `UserProfile` (uid, role, faculty, programme, yearGroup, staffDepartment) — role is one of STUDENT/STAFF/ADMIN, immutable by the owning user after creation. `staffDepartment` (ACADEMIC/SOCIETY/ADMINISTRATIVE/FINANCE/null) is consumed by both `firestore.rules` (`isAdminOrDepartment`) and `lib/permissions.ts` to gate which collections a STAFF account can act on — it existed as a field before it had any real consumer, which a forensic audit correctly flagged as dead data; it is now wired up (§ 21).
- `ContentItem` (Strapi) — title, description, `category` (22-value enum), `audience` (EVERYONE/FACULTY/PROGRAMME/YEAR_GROUP) + matching targeting fields, optional event fields (date/time/location/contact), `isEmergency` flag, status.
- `Room`, `RoomBooking` (date, start/end time, status PENDING/APPROVED/REJECTED/CANCELLED, requester, decider).
- `EventInterest`, `SocietyInterest` — join records between a student and a content item.
- `LostFoundItem`, `AcademicSupportRequest`, `Feedback`, `FacilityIssue` — each with an owner, a status lifecycle, and staff-writable fields (response, status).

Timestamps (`createdAt`, `updatedAt`) and ownership (`requestedBy`/`reportedBy`/`submittedBy`) are present on every transactional entity, satisfying the "ownership and status fields where required" guidance without adding entities the business requirements didn't call for (e.g. no separate `Permission` or `Notification` UI was built beyond the data model already supporting it).

## 9. Authentication & Authorization

Authentication is Firebase Authentication (email/password). Authorization is **not** based on hiding UI — every permission check in `src/lib/permissions.ts` (client-side, for UX) has a matching, independently-enforced rule in `firebase/firestore.rules` (server-side, for actual security). Key decisions:

- Public self-signup can only ever create a STUDENT account. STAFF/ADMIN accounts are seeded out-of-band. This was a deliberate change from an earlier design (a client-side "staff signup code") once we recognised the repository would be public — any embedded code would be visible to anyone reading the source, making it worthless as a safeguard.
- A student cannot self-promote their role via a client update — enforced by comparing `request.resource.data.role == resource.data.role` in the rule, not just omitting a "change role" button from the UI.
- BR12 department differentiation: a STAFF account's `staffDepartment` gates `roomBookings` approval (ADMINISTRATIVE), `academicSupportRequests` (ACADEMIC), `feedback` (ADMINISTRATIVE), `facilityIssues` (ADMINISTRATIVE), and `societyInterests` read access (SOCIETY) — enforced by `isAdminOrDepartment(dept)` in `firestore.rules`, with a matching `hasPermission(role, department, permission)` in the frontend that controls which Staff Console tabs render. FINANCE has no Firestore-backed action; financial content is managed via Strapi's own admin auth instead (documented, not silently omitted).
- 44+ automated tests (`src/test/firestore.rules.test.ts`, `src/test/booking-conflict.integration.test.ts`) run these rules against the real Firestore emulator and are part of the CI-able test suite (`npm run test:rules`), including department-boundary rejection tests (a staff member outside the right department is denied, not just hidden from the UI).

## 10. Core Workflows

**Classroom booking (BR8)**: student picks a date/time range → client checks every room's existing PENDING/APPROVED bookings for that date and computes overlap (`timeRangesOverlap`) → available rooms are offered → on request, the check is repeated immediately before writing (shrinking, not eliminating, the request-time race window) → booking is created as PENDING → staff approve/reject in the Staff Console → student sees the status update live via a Firestore `onSnapshot` listener. **Approval itself is also conflict-checked**: `decideBooking` runs inside a Firestore transaction that re-reads the target booking and every other APPROVED booking for the same room/date at commit time, rejecting the approval if any overlap exists. This was added after a forensic audit found the original implementation had *zero* conflict awareness at approval — two overlapping PENDING requests could both be approved with no warning anywhere in the UI (§ 21).

**Event interest (BR4)**: the Firestore document id is deterministic (`{eventId}_{uid}`), so registering interest twice is idempotent by construction rather than needing a duplicate-check query. **Society sign-up (BR6)** now uses the same pattern (`{societyId}_{uid}`) — it originally used an auto-generated id, relying on client-held state alone for duplicate prevention, which a forensic audit flagged as structurally weaker than BR4 (§ 21).

**Targeted announcements (BR2)**: `lib/targeting.ts` now *filters* (`filterVisibleToStudent`) content targeted at a different faculty/programme/year out of every personalised dashboard section, then sorts what remains (emergency > targeted-and-relevant > general). The filtering step was added after a forensic audit found the original implementation only sorted — content targeted at another faculty was still shown to every student, just lower in the list, contradicting BR2's "distinct from general information" (§ 21).

## 11. AI Assistant Design

See `README.md` § AI Architecture for the full data flow. Design principles: (1) never let the assistant say something not grounded in the platform's own content — Gemini's `systemInstruction` includes *only* the retrieved content plus an explicit instruction to say so if it doesn't answer the question, kept structurally separate from the raw student question (sent as the sole `user` turn) to reduce the risk of the question itself injecting new instructions; (2) never let an AI outage silently degrade to a worse-but-unlabelled experience — the fallback path is functionally the same retrieval, just without the generative step, and is explicitly labelled "(search fallback)" in the UI; (3) ground the retrieval itself well enough that the fallback is useful on its own, not just a placeholder.

**Honest status**: `VITE_GEMINI_API_KEY` has been empty throughout this project's history, in the original build, the forensic audit, and this fix pass. The Gemini code path has never executed. This is BR33's core mechanism and the highest-weighted single business requirement, so it is stated here without qualification: **GEMINI NOT EXECUTED — FALLBACK VERIFIED.** What is verified is the retrieval and fallback quality, which the forensic audit tested hard: an early test showed "Are there any events this week?" surfacing a cafeteria menu ahead of actual events (naive substring matching - "week" inside "weekly"), and separately "Can I book a sports facility?" surfaced an unrelated textbook listing ("book" inside "textbook"). Both are fixed with whole-word matching and covered by regression tests, and both are documented here rather than only in a commit message, because they're exactly the kind of thing that would otherwise quietly resurface.

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

- Firestore Security Rules are the actual authorization boundary (see § 9), verified by 44+ automated tests against a live emulator, including department-boundary enforcement.
- The public Strapi content API is forced to `status=published` server-side, regardless of what a caller requests. This was **not** originally true: a forensic audit found that an anonymous request to `GET /api/content-items?status=draft` returned real, unpublished draft content (verified live with `curl`). Fixed by overriding the controller's `find`/`findOne` to always force `status=published`, and covered by a reproducible regression script (`cms/scripts/verify-public-api-security.mjs`, 5/5 checks: anonymous published read succeeds, anonymous draft read never returns an unpublished row, anonymous write stays rejected, admin API still requires auth). See § 21.
- No secrets are hard-coded. `.env` files are git-ignored; `.env.example` documents every variable. Verified via `git grep` for API-key-shaped strings across tracked files.
- The Gemini prompt no longer concatenates the persona/rules and the raw user question into one string — they're split across `systemInstruction` and the `user` turn respectively, reducing (not eliminating) the simplest class of prompt injection.
- **Known trade-off**: `VITE_GEMINI_API_KEY`, if configured, is used in a direct client-side fetch to the Gemini API, so it is visible in the browser. A production deployment should proxy this through a server-side function (Firebase Cloud Function) so the key never reaches the client — not built here due to time, and noted in Future Improvements. Moot in this environment: the key has never been configured at all.
- **Known trade-off**: `roomBookings` documents are readable by any signed-in user rather than owner-restricted, because Firestore rejects a `list` query whose security rule depends on a field the query doesn't filter by (see the comment in `firebase/firestore.rules`).

## 15. Performance

Firestore queries filter server-side on the fields actually used (`where('requestedBy', ...)`, `where('roomId', ...)`, etc.) rather than fetching everything and filtering client-side. The Strapi API call caps `pageSize` at 100. Route-level code splitting (`React.lazy` per page in `App.tsx`) was added and measured in a fresh build: roughly 20 page-specific chunks of 0.2–10 kB each, downloaded only when a route is visited, instead of shipping all of them upfront. The remaining vendor chunk is still ~823 kB gzipped ~249 kB — mostly the Firebase SDK, used by nearly every route, so further reduction there would mean removing functionality rather than just splitting it. No client-side cache (e.g. React Query) was added. This is flagged as NFR2 = PARTIAL — genuinely improved, not fully solved.

## 16. Reliability

Firebase (Auth + Firestore) and Strapi are each independently available; there is no cross-service transaction (e.g. a Strapi outage doesn't take down room booking, and vice versa), which is a reliability *benefit* of the two-datastore split. However, neither service has redundancy in this build — a single Strapi process and a single Firestore project — so NFR3 is marked PARTIAL rather than COMPLETE.

## 17. Robustness

Every create form (booking, lost & found, support request, feedback, facility issue) validates required fields client-side before submission and is independently rejected by Firestore rules if a client somehow bypassed that (e.g. `status` on booking creation must be `'PENDING'`). Every data-fetching view has three states beyond its happy path: loading (`Spinner`), empty (`EmptyState`), and error (`ErrorState`/`ServiceUnavailable`) — verified concretely by disconnecting Strapi during development and confirming the dashboard shows "Campus content is unavailable right now" instead of crashing.

A forensic audit, while diagnosing an unrelated environment issue (a mismatched Firebase project id between the app and the seed script — see § 21), found a real, separate robustness gap this uncovered: seven pages (`LostFoundPage`, `AcademicSupportPage`, `FeedbackPage`, `FacilityIssuesPage`, `RoomsPage`, `EventsPage`, `SocietiesPage`) had a silent `if (!profile) return` guard in their action handlers. If a user's profile hadn't finished loading for any reason, clicking submit did nothing — no error, no feedback, indistinguishable from a broken button. Every one now either shows an explicit message ("Your session hasn't finished loading yet...") or disables the action outright. `AuthContext`'s profile-fetch failure path also now logs the actual error to the console instead of swallowing it, which is what made this bug slow enough to diagnose that it was worth fixing for the next person who hits it.

## 18. Testing Strategy

Four layers, chosen so that "the tests pass" means something real rather than testing mocks of our own code:

1. **Pure-logic unit tests** (Vitest) for anything with no external dependency: RBAC/department permission map, targeting filter, room-booking time-overlap conflict detection, AI fallback behaviour.
2. **Firestore Security Rules + integration tests** (`@firebase/rules-unit-testing`) run against the actual Firestore emulator — these are not mocks; a rule with a typo would genuinely fail these tests. Includes the booking-approval transaction test, which calls the *actual* `decideBooking` function (not a reimplementation) with its Firestore instance swapped for an isolated emulator project.
3. **Firebase Authentication tests** run against the actual Auth emulator — valid login, wrong password, unregistered email.
4. **Committed, reproducible end-to-end suite** (`frontend/e2e/smoke.spec.ts`, Playwright, `npm run test:e2e`). Earlier in this project, E2E verification was done via ad-hoc scripts that were never added to the repository — real results, but not independently reproducible by anyone who clones it. This is fixed: the suite is a normal project dependency with a normal npm script.

## 19. Test Results

All results below are from an actual run performed during this build, not projected or invented:

```
Unit tests (frontend/):           29 passed, 0 failed   — npm test
Firestore rules + integration:    44 passed, 0 failed   — npm run test:rules
Auth emulator tests:               3 passed, 0 failed   — npm run test:auth
                                   ─────────────────────
Total automated:                  76 passed, 0 failed

E2E smoke suite (Playwright, npm run test:e2e — committed, reproducible):
  1. Unauthenticated → redirected to /login                          PASS
  2. Student login → dashboard                                       PASS
  3. Search & Discover                                                PASS
  4. Targeted content visible on dashboard                            PASS
  5. Event visibility + interest                                     PASS
  6. Society sign-up                                                 PASS
  7. Classroom booking request                                       PASS
  8. Lost & found report                                             PASS (after fix, see §21)
  9. AI assistant answers a question                                 PASS
  10. Logout                                                          PASS
  11. Staff approves the booking from step 7                          PASS
  Console errors during full run:                                     0
  Result: 1 passed (6.5s)

Strapi public API security regression (cms/scripts/verify-public-api-security.mjs):
  anonymous published read succeeds (200)                             PASS
  anonymous published read returns only published entries             PASS
  anonymous ?status=draft never returns an unpublished row             PASS (after fix, see §21)
  anonymous write is rejected (403)                                   PASS
  admin API requires authentication (401)                             PASS
```

## 20. Requirement Traceability

See [`/docs/requirements-traceability.md`](../docs/requirements-traceability.md) — kept as a separate document since it is referenced independently during code review.

## 21. Forensic Audit and Fixes

Partway through the build, we conducted a deliberately adversarial, evidence-based re-audit of our own repository — treating our own earlier documentation as a claim to verify, not a fact, and re-checking every "COMPLETE" business requirement against the actual running code and test suite rather than against what an earlier version of this report said. This surfaced real gaps, all of which are now fixed, tested, and documented rather than quietly corrected:

| Finding | Severity | Fix | Verification |
|---|---|---|---|
| Public Strapi API returned unpublished draft content to anonymous requests via `?status=draft` | High | Controller override forces `status=published` server-side, unconditionally | `cms/scripts/verify-public-api-security.mjs`, 5/5 checks, run against the live instance |
| BR2 targeting only sorted irrelevant content lower, never excluded it | Medium | `filterVisibleToStudent` added, applied to every personalised dashboard section | 9 new unit tests |
| BR8 room booking approval had zero conflict awareness — two overlapping PENDING requests could both be approved | Medium | `decideBooking` now runs inside a Firestore transaction re-validating against every other APPROVED booking | 6 integration tests (no conflict / exact / partial overlap / adjacent / different room / wrong department) |
| BR12's `staffDepartment` field existed but was never read anywhere — every STAFF account had identical permissions | Medium | `isAdminOrDepartment(dept)` gates 5 collections server-side; Staff Console only shows matching tabs | New rules tests + 3 differentiated demo staff accounts |
| BR6 society sign-up used an auto-generated document id, unlike BR4's deterministic one, so duplicate prevention relied on client state alone | Low–Medium | Switched to the same `{id}_{uid}` deterministic pattern | 1 new rules test |
| `academicSupportRequests`, `feedback`, `facilityIssues` had defined rules but zero automated test coverage | Medium (evidence gap) | 13 new rules tests covering owner/cross-student/department boundaries | — |
| AI retrieval used substring matching, causing false positives ("book" in "textbook", "week" in "weekly") | Low (quality) | Whole-word matching | 2 regression tests |
| AI prompt concatenated instructions and raw user input into one string | Low (defense-in-depth) | Split across Gemini's `systemInstruction` and the `user` turn | Structural change, not independently testable without a live key |
| Prior E2E verification was real but done via uncommitted, ad-hoc scripts — not reproducible from the repository | Medium (report-quality) | Committed `frontend/e2e/smoke.spec.ts` + `npm run test:e2e` | Runs clean, 0 console errors |
| `date-fns`, `@testing-library/react`, `@testing-library/user-event` were installed but never imported anywhere | Low (hygiene) | Removed | `npm ls` / build unaffected |
| Seed script hardcoded a project id, so a real Firebase project configured with a different id caused the app to silently see `profile: null` (a missing document isn't a permissions error) | Medium (discovered while building the E2E suite) | Script now reads `VITE_FIREBASE_PROJECT_ID` from `frontend/.env`; `singleProjectMode` removed from `firebase.json` (it was causing the same email to resolve to different Auth uids depending on which SDK made the request) | E2E suite passes end-to-end after the fix |
| 7 pages silently no-op'd their submit handler if `profile` was momentarily null, with zero user feedback | Low–Medium (found while diagnosing the item above) | Explicit message or disabled state instead | Manual verification, screenshot evidence |

We consider this section as important as any feature described elsewhere in this report. A hackathon report that only lists what works is not more credible for omitting what didn't — it's less credible, because judges checking claims against code (as we did to ourselves) will find the gaps either way. Documenting the finding-and-fixing process is the more defensible position, and matches DevDash'26's explicit requirement to document "testing outcomes" honestly.

## 22. Innovation

The innovation in UCL ONE is architectural, not decorative: (1) a single reusable content engine that makes 20 of the 33 business requirements nearly free to add once the pattern exists, rather than 20 separate features; (2) targeting-aware content (BR2) that generalises across every category, not just announcements — the same `audience`/`faculty`/`programme`/`yearGroup` fields work for onboarding content, calendar entries, or job postings equally, and now genuinely filters rather than just reorders; (3) department-aware staff permissions (BR12) that reuse one small `isAdminOrDepartment` primitive across five collections instead of five bespoke role checks; (4) an AI assistant that is provably grounded in the platform's own data rather than a generic chatbot bolted on — its fallback mode (no external AI call at all) is still useful, because the retrieval quality is the actual product, not the generative wrapper around it; (5) a self-imposed forensic audit process (§ 21) that we treat as part of the engineering deliverable, not an afterthought.

## 23. Limitations

See `README.md` § Known Limitations for the full, current list: BR24/BR27 partial coverage, BR12's FINANCE department having no dedicated Firestore action, room booking approval being optimistic-concurrency-checked rather than fully pessimistically locked, broadened `roomBookings` read access (a Firestore constraint, not an oversight), the AI assistant never having executed a real Gemini call in this environment, and the Gemini API key being client-side rather than proxied if it were ever configured.

## 24. Future Improvements

Cloud Function-proxied AI calls and fully atomic booking transactions (closing the narrow remaining approval race window); a student-authored textbook marketplace and sports-facility booking (both would reuse the existing room-booking UX pattern); a FINANCE-department Firestore action if a real one emerges; push notifications (the `notifications` collection already exists in the data model, unused by any UI yet); a client cache for NFR2 on top of the code-splitting already done; retry/offline handling for NFR3.

## 25. Libraries / APIs Used

React, TypeScript, Vite, Tailwind CSS v4, `react-router-dom`, `lucide-react`, Firebase JS SDK, Firebase Admin SDK (seed script only), Strapi 5, Vitest, `@testing-library/jest-dom`, `@firebase/rules-unit-testing`, `@playwright/test` (committed E2E suite, not just ad-hoc verification), Google Gemini API (`gemini-2.0-flash`). All open-source or documented public APIs, as disclosed in `README.md` § 18.

## 26. Team Contribution

Built by Team Dewshan's Kids for DevDash'26, using Claude (Anthropic) as a directed AI pair-programming aid within the hackathon's AI-as-aid rule. Every architectural and product decision recorded in this report — the content-engine/action-workflow split, the RBAC and department model, the AI grounding strategy, the decision to restrict self-signup to STUDENT, and the decision to run a self-critical forensic audit rather than declare completion — was a human decision made in response to the constraints found in the repository and the judging criteria, not an unreviewed AI suggestion.

## 27. Conclusion

UCL ONE demonstrates that "one trusted channel" doesn't have to mean "one giant application with 33 hand-built features." By separating campus information (which is read-heavy, staff-authored, and highly reusable across categories) from campus actions (which are write-heavy, per-user, and need real authorization, including per-department staff scopes), we covered 29 of 33 business requirements within the hackathon window, backed by 76+ passing automated tests and a verified, committed end-to-end demo path. Just as importantly, we found and fixed real gaps between an earlier draft of our own claims and what the code actually did — and we're reporting that process, not just its outcome, because that is what "evidence of how the solution was developed and validated" should mean.
