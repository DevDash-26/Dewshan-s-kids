# Requirements Traceability

## BR1–BR33 and NFR1–NFR6

| ID | Requirement | Implementation | Route / module | Status |
| --- | --- | --- | --- | --- |
| BR1 | Unified Access | Single campus dashboard and search experience | `/dashboard`, `/api/search` | COMPLETE |
| BR2 | Targeted Announcements | Audience-based announcement filtering by faculty/programme/year | `/api/dashboard`, `/api/announcements` | COMPLETE |
| BR3 | Event Visibility | Event list with metadata and detail cards | `/events` | COMPLETE |
| BR4 | Event Interest | Duplicate-safe event registration flow | `/api/events/:id/interest` | COMPLETE |
| BR5 | Society Visibility | Society list with activities and memberships | `/societies` | COMPLETE |
| BR6 | Society Sign-up | Interest registration for societies | `/api/societies/:id/interest` | COMPLETE |
| BR7 | Lost & Found | Lost/found item submission and browsing | `/lost-found` | COMPLETE |
| BR8 | Classroom Booking | Room listing, conflict validation, booking requests | `/rooms`, `/api/rooms/request` | COMPLETE |
| BR9 | Academic Support | Support resources and mentoring links | `/support` | COMPLETE |
| BR10 | FAQ Access | Student support FAQ list | `/faq`, `/api/faqs` | COMPLETE |
| BR11 | Content Maintenance | Staff/admin announcement creation | `/api/announcements` | PARTIAL |
| BR12 | Access Levels | Role-aware auth and RBAC checks | `requireAuth`, `requireRoles` | COMPLETE |
| BR13 | Academic Calendar | Calendar summary on dashboard and API | `/api/academic-calendar` | COMPLETE |
| BR14 | Student Onboarding | Welcome dashboard + student information content | `/dashboard` | PARTIAL |
| BR15 | Emergency Communication | Emergency notices visible on dashboard | `/api/dashboard` | COMPLETE |
| BR16 | Schedule Changes | Emergency/schedule notices in announcements | `/api/dashboard` | COMPLETE |
| BR17 | Feedback Loop | Feedback submission endpoint and UI | `/api/feedback` | PARTIAL |
| BR18 | Volunteering Opportunities | Not a dedicated module; included as part of support content | `/support` | PARTIAL |
| BR19 | Alumni Engagement | Not a dedicated student module in this prototype | `/support` | NOT IMPLEMENTED |
| BR20 | Job & Internship Visibility | Job highlights on dashboard and support page | `/support`, `/api/support` | COMPLETE |
| BR21 | Facility Issue Reporting | Issue reporting endpoint and support path | `/api/facility-issues` | COMPLETE |
| BR22 | Staff Directory | Department and staff directory data | `/api/staff-directory` | COMPLETE |
| BR23 | Financial Support Info | Included in support resources category | `/support` | PARTIAL |
| BR24 | Sports & Recreation | Not a dedicated module in the current prototype | — | NOT IMPLEMENTED |
| BR25 | Dining Information | Service info includes dining and hours | `/support`, `/api/support` | PARTIAL |
| BR26 | Printing Services | Service info includes printing resource | `/support`, `/api/support` | PARTIAL |
| BR27 | Textbook Exchange | Not implemented as separate exchange flow | — | NOT IMPLEMENTED |
| BR28 | Guest Lectures | Event-driven guest lecture content | `/events` | COMPLETE |
| BR29 | Wellbeing Support | Wellbeing support resources and announcements | `/support` | COMPLETE |
| BR30 | IT Support Info | IT help resource listed in support section | `/support` | COMPLETE |
| BR31 | Library Resources | Library hours and services in support info | `/support` | COMPLETE |
| BR32 | Student Life Highlights | Past event and life content in dashboard/events | `/dashboard`, `/events` | PARTIAL |
| BR33 | AI Assistant | Grounded AI retrieval and route suggestions | `/ai`, `/api/ai` | COMPLETE |
| NFR1 | Usability | Clean dashboard and simple flows for first-time users | `/dashboard` | COMPLETE |
| NFR2 | Performance & Scalability | In-memory JSON store and lightweight filtering | backend API | COMPLETE |
| NFR3 | Reliability & Availability | Graceful validation and error handling | API routes | COMPLETE |
| NFR4 | Security & Privacy | JWT auth and role restrictions | auth middleware | COMPLETE |
| NFR5 | Maintainability | Modular route/service structure in Express app | `server.js` | PARTIAL |
| NFR6 | Robustness | Validation, empty states, duplicate detection, API errors | app routes | COMPLETE |

## Notes

- This prototype intentionally prioritizes the highest-value student workflows under a six-hour build window.
- The architecture is reusable and extendable to a real database-backed version later without changing the product concept.
- Requirements marked PARTIAL or NOT IMPLEMENTED are honest gaps rather than claims of completion.
