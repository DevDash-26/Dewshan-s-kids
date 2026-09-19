# Requirements Traceability

This document reflects the actual implementation status of the current hackathon MVP. Requirements are recorded as COMPLETE, PARTIAL, or NOT IMPLEMENTED based on code and test evidence.

## BR1–BR33

| ID | Requirement | Status | Implementation | Evidence | Test |
| --- | --- | --- | --- | --- | --- |
| BR1 | Unified access to official campus information | COMPLETE | Dashboard, search and resource pages are available in the frontend and API | `/api/dashboard`, `/api/search`, `frontend/src/App.tsx` | Manual smoke test + backend search behaviour |
| BR2 | Targeted announcements | COMPLETE | Announcement filtering based on faculty/programme/year is enforced server-side | `filterAnnouncementsForUser()` in `backend/server.js` | `npm --workspace backend run test` |
| BR3 | Event visibility | COMPLETE | Events are listed and displayed in the dashboard and events view | `/api/events`, `frontend/src/App.tsx` | Manual UI smoke test |
| BR4 | Event interest registration | COMPLETE | Duplicate-safe event interest endpoint with 409 handling | `/api/events/:id/interest` | `events list and interest registration works` |
| BR5 | Society visibility | COMPLETE | Society cards and details are surfaced in UI/API | `/api/societies`, `frontend/src/App.tsx` | Manual UI smoke test |
| BR6 | Society sign-up flow | COMPLETE | Society interest endpoint stores interest and prevents duplicates | `/api/societies/:id/interest` | `societies interest works` |
| BR7 | Lost & found | COMPLETE | Item submission and list retrieval flow | `/api/lost-found` | `lost found validation required fields` |
| BR8 | Classroom booking and conflict detection | COMPLETE | Room requests validate date/time overlap before booking | `/api/rooms`, `/api/rooms/request` | `room conflict detection rejects overlap` |
| BR9 | Academic support access | COMPLETE | Support resources and guidance cards are part of the dashboard/support page | `/api/dashboard`, `/api/support` | Manual smoke test |
| BR10 | FAQ access | COMPLETE | FAQ list available to authenticated users | `/api/faqs` | Manual smoke test |
| BR11 | Content maintenance by staff/admin | PARTIAL | Staff/admin can create announcements, but there is no full CMS editing workflow | `/api/announcements` | `staff can create announcement` |
| BR12 | Role-based access levels | COMPLETE | Auth middleware and RBAC enforce student/staff/admin restriction rules | `requireAuth()`, `requireRoles()` in `backend/server.js` | tests for unauthorized student action |
| BR13 | Academic calendar | COMPLETE | Academic calendar data is returned to the dashboard | `/api/dashboard` | Manual UI review |
| BR14 | Student onboarding / welcome content | PARTIAL | The dashboard is student-friendly but there is no full onboarding flow | `/api/dashboard` | Manual smoke test |
| BR15 | Emergency communication | COMPLETE | Emergency notices are included in the dashboard payload | `/api/dashboard` | Manual smoke test |
| BR16 | Schedule change communication | COMPLETE | Notices are surfaced as part of announcements and emergency data | `/api/dashboard` | Manual smoke test |
| BR17 | Feedback loop | PARTIAL | Feedback endpoint exists, but no admin moderation workflow is implemented | `/api/feedback` | `feedback submission works` |
| BR18 | Volunteering opportunities | PARTIAL | Included as support content rather than dedicated service module | `/api/support` | Manual smoke test |
| BR19 | Alumni engagement | NOT IMPLEMENTED | No dedicated alumni workflow is present | — | Not covered |
| BR20 | Job and internship visibility | COMPLETE | Jobs are included in the dashboard and support content | `/api/dashboard`, `/api/support` | Manual smoke test |
| BR21 | Facility issue reporting | COMPLETE | Issue reporting validation endpoint is implemented | `/api/facility-issues` | `facility issue validation works` |
| BR22 | Staff directory | COMPLETE | Staff directory data is available to users | `/api/staff-directory` | Manual smoke test |
| BR23 | Financial support information | PARTIAL | Support resources carry information, but it is not modeled as a dedicated financial support module | `/api/support` | Manual smoke test |
| BR24 | Sports and recreation | NOT IMPLEMENTED | No dedicated sports module exists in the MVP | — | Not covered |
| BR25 | Dining information | PARTIAL | Service data includes dining/hours, but no rich dining catalog is built | `/api/support` | Manual smoke test |
| BR26 | Printing services | PARTIAL | Included as support content, not a dedicated request flow | `/api/support` | Manual smoke test |
| BR27 | Textbook exchange | NOT IMPLEMENTED | No exchange marketplace flow is implemented | — | Not covered |
| BR28 | Guest lectures | COMPLETE | Event list includes lecture-style offerings | `/api/events` | Manual smoke test |
| BR29 | Wellbeing support | COMPLETE | Support resources and announcements include wellbeing references | `/api/support` | Manual smoke test |
| BR30 | IT support information | COMPLETE | IT support content is present in support resources | `/api/support` | Manual smoke test |
| BR31 | Library resources | COMPLETE | Library hours and service information are surfaced in support content | `/api/support` | Manual smoke test |
| BR32 | Student life highlights | PARTIAL | Highlights are present in dashboard and events, but not as a separate first-class module | `/api/dashboard`, `/api/events` | Manual smoke test |
| BR33 | AI assistant | COMPLETE | AI route returns grounded results and falls back to local data when no external provider is configured | `/api/ai` | `ai empty query is rejected` |

## NFR1–NFR6

| ID | Requirement | Status | Implementation | Evidence | Test |
| --- | --- | --- | --- | --- | --- |
| NFR1 | Usability | COMPLETE | Student-friendly dashboard and simple flows are implemented | `frontend/src/App.tsx` | Manual smoke test |
| NFR2 | Performance & scalability | COMPLETE | Lightweight in-memory data store and simple filtering are adequate for a prototype | `backend/data.js`, `backend/server.js` | Backend test suite |
| NFR3 | Reliability & availability | COMPLETE | Validation, safe error responses and duplicate/conflict protections are used | API route handlers in `backend/server.js` | Backend tests |
| NFR4 | Security & privacy | COMPLETE | JWT auth, bcrypt password hashing, role restrictions and secret default handling | `backend/server.js` | `invalid login is rejected`, unauthorized announcement test |
| NFR5 | Maintainability | PARTIAL | Code is modular enough for a prototype but not split into deeper service layers or full CMS architecture | `backend/server.js` | Manual review |
| NFR6 | Robustness | COMPLETE | Empty-state validation, duplicate detection and time-slot overlap checks are in place | server route validation | Backend tests |

## Notes
- This project is intentionally a six-hour hackathon MVP.
- Several requirements are implemented as a reusable content model rather than separate deployed infrastructure.
- Optional service integrations are not described as production-grade unless the runtime configuration is active.
