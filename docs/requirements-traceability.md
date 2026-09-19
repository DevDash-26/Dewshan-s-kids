# Requirements Traceability — UCL ONE

Status legend: **COMPLETE** = fully implemented and manually verified · **PARTIAL** = implemented with a documented gap · **NOT IMPLEMENTED** = out of scope for this build.

## Business Requirements

| # | Requirement | Implementation | Route / Module | Status |
|---|---|---|---|---|
| BR1 | Unified access to campus information | Unified `content-item` engine (Strapi) covering 22 categories, surfaced through one Search & Discover page and the dashboard | `/search`, `/`, `cms/src/api/content-item` | **COMPLETE** |
| BR2 | Targeted announcements by faculty/programme/year | `audience` + `faculty`/`programme`/`yearGroup` fields on every content item; `lib/targeting.ts` ranks and labels targeted vs. general content | `/`, `src/lib/targeting.ts` | **COMPLETE** |
| BR3 | Event visibility | Events listed from the content engine (`category: EVENT`), sorted by date | `/events` | **COMPLETE** |
| BR4 | Event interest / turnout estimate | `eventInterests` Firestore collection; deterministic doc id (`{eventId}_{uid}`) makes re-registering idempotent instead of creating duplicates; live interest count | `/events`, `src/lib/collections.ts` | **COMPLETE** |
| BR5 | Society visibility | Societies listed from the content engine (`category: SOCIETY`) | `/societies` | **COMPLETE** |
| BR6 | Society sign-up | `societyInterests` Firestore collection, one record per student per society | `/societies` | **COMPLETE** |
| BR7 | Lost & Found | Report lost/found, browse, keyword + kind filter, owner/staff can resolve | `/lost-found` | **COMPLETE** |
| BR8 | Classroom booking | Date/time availability check across all rooms (conflict detection via `timeRangesOverlap`), request submission, staff approve/reject, student sees live status | `/rooms`, `/staff` (Room Bookings tab) | **COMPLETE** — see NFR3 note on the approval race window |
| BR9 | Academic support requests (study group / tutoring / mentorship) | Typed request form + status tracking, staff triage view | `/academic-support` | **COMPLETE** |
| BR10 | FAQ access | `category: FAQ` content items, searchable like everything else | `/search` (filter: FAQ) | **COMPLETE** |
| BR11 | Content maintenance by authorised staff | Strapi admin panel (own auth, own RBAC) for the content engine; Staff Console for transactional Firestore data (bookings, requests, issues) | `cms/admin`, `/staff` | **COMPLETE** |
| BR12 | Differentiated access levels | Firestore Security Rules enforce STUDENT / STAFF / ADMIN server-side (not just hidden UI); 22 automated rule tests against the live emulator | `firebase/firestore.rules`, `src/lib/permissions.ts` | **COMPLETE** |
| BR13 | Academic calendar (exams, add/drop, milestones) | `category: ACADEMIC_CALENDAR`, surfaced on the dashboard sorted by date | `/`, `/search` | **COMPLETE** |
| BR14 | New/first-year student onboarding | `category: ONBOARDING`, targeted at `yearGroup: 1` by default | `/search` | **COMPLETE** |
| BR15 | Emergency communication | `isEmergency` flag pins content to the top of every student's dashboard in a visually distinct red card, independent of category | `/`, `src/components/content/ContentCard.tsx` | **COMPLETE** |
| BR16 | Schedule changes / closures | `category: SCHEDULE_CHANGE`, typically combined with `isEmergency` | `/`, `/search` | **COMPLETE** |
| BR17 | Feedback loop | Submit subject/message, staff can respond, student sees the response and status | `/feedback` | **COMPLETE** |
| BR18 | Volunteering visibility | `category: VOLUNTEERING` | `/search` | **COMPLETE** |
| BR19 | Alumni engagement | `category: ALUMNI` | `/search` | **COMPLETE** |
| BR20 | Job & internship visibility | `category: JOB`, highlighted on the dashboard | `/`, `/search` | **COMPLETE** |
| BR21 | Facility issue reporting | Typed issue report (electrical/plumbing/furniture/cleanliness/IT/other), staff status workflow | `/facility-issues` | **COMPLETE** |
| BR22 | Staff directory | `category: STAFF_DIRECTORY` | `/search` | **COMPLETE** |
| BR23 | Financial support info | `category: FINANCIAL_SUPPORT` | `/search` | **COMPLETE** |
| BR24 | Sports & recreation, incl. booking where appropriate | `category: SPORTS` for visibility | `/search` | **PARTIAL** — visibility is complete; a dedicated sports-facility booking flow was not built separately from classroom booking due to time. The `/rooms` booking pattern (availability check → request → approve) generalises directly to sports facilities if extended. |
| BR25 | Dining info | `category: DINING` | `/search` | **COMPLETE** |
| BR26 | Printing services | `category: PRINTING` | `/search` | **COMPLETE** |
| BR27 | Textbook exchange | `category: TEXTBOOK` listings are visible and searchable | `/search` | **PARTIAL** — content items (including textbook listings) are authored by staff/admin in the CMS, matching the "official content" model used for BR2–BR32. Students cannot yet self-list a textbook for sale through the app; a real deployment would need a separate student-authored marketplace collection with its own Firestore rules, which was out of scope for the 6-hour window. |
| BR28 | Guest lectures / industry talks | `category: GUEST_LECTURE` | `/search` | **COMPLETE** |
| BR29 | Wellbeing / counselling support | `category: WELLBEING` | `/search` | **COMPLETE** |
| BR30 | IT support info | `category: IT_SUPPORT` | `/search` | **COMPLETE** |
| BR31 | Library resources & hours | `category: LIBRARY` | `/search` | **COMPLETE** |
| BR32 | Student life highlights | `category: STUDENT_LIFE` | `/search` | **COMPLETE** |
| BR33 | AI assistant (natural-language discovery) | `src/lib/ai.ts`: retrieves relevant content from the same corpus as Search, grounds a Gemini call in it, and suggests in-app routes; degrades to a deterministic keyword-search fallback (clearly labelled, not silently faked) when no API key is configured or the API call fails | `/ai` | **COMPLETE** — see README "AI Architecture" for how Gemini integration is verified without a live key |

## Non-Functional Requirements

| # | Requirement | Implementation | Status |
|---|---|---|---|
| NFR1 | Usability for first-time, varying-literacy students | Consistent sidebar navigation, one visual language (`components/ui`), explicit loading/empty/error states on every data view, dashboard quick-actions grid as the "what do I do here" entry point | **COMPLETE** (evaluated by manual walkthrough, not formal usability testing) |
| NFR2 | Performance & scalability | Firestore queries are indexed by the fields actually filtered on; Strapi responses are capped (`pageSize=100`); no client-side caching layer (e.g. React Query) and no code-splitting were added — the production bundle is a single ~875 KB chunk | **PARTIAL** — acceptable for a hackathon-scale dataset; documented as a Future Improvement |
| NFR3 | Reliability & availability for time-sensitive info | Emergency/schedule-change content is fetched on every dashboard load, not cached; however there is no offline mode, no retry/backoff on the Strapi fetch beyond a single try, and Strapi runs as a single local instance with no redundancy | **PARTIAL** — acceptable for a prototype; a production deployment would need managed hosting + retries |
| NFR4 | Security & privacy | Firebase Auth for identity; Firestore Security Rules enforce RBAC server-side (22 automated tests against the real emulator, not mocked); public signup can only ever create STUDENT accounts (STAFF/ADMIN are seeded, since this repo is public and any client-side "staff code" would be visible to everyone); secrets are in `.env` files, git-ignored, never hard-coded | **COMPLETE**, with one documented trade-off: `roomBookings` had to be made readable by any signed-in user (not owner-restricted) because Firestore rejects a `list` query whose rule depends on a field the query doesn't filter on — see the comment in `firebase/firestore.rules` |
| NFR5 | Maintainability | TypeScript across frontend, CMS and Firestore rules tests; consistent `components/`, `pages/`, `lib/`, `hooks/`, `types/` structure; the 22-category content engine avoids 22 bespoke CRUD modules | **COMPLETE** |
| NFR6 | Robustness against bad/incomplete input | Every create form validates required fields before submission; the CMS-unavailable, AI-unavailable, and Firestore-error paths all render an explicit state instead of crashing; Firestore rules reject malformed writes (e.g. wrong `status` on booking creation) independently of client-side validation | **COMPLETE** |

## Honest summary

31 of 33 business requirements are fully implemented and manually verified end-to-end (see `/report/report.md` § Test Results). Two (BR24, BR27) are partially implemented — visibility works, but a bespoke transactional workflow analogous to classroom booking or student-authored content was not built for them in the available time. All six non-functional requirements have at least a working baseline; two (NFR2, NFR3) are explicitly partial due to hackathon scope, not oversight.
