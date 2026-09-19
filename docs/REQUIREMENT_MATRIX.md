# UCL Connect Requirement Matrix

| Requirement | Implementation | Route / Component | Data Source | Status | Testing |
|---|---|---|---|---|---|
| BR1 Unified Access | Shared responsive shell and navigation | `/`, `AppShell` | Demo + Firebase/Strapi adapters | Complete | Build |
| BR2 Targeted Announcements | Priority and audience fields in announcement model | `/announcements` | Strapi fallback | Complete | Build |
| BR3 Event Visibility | Event cards, search and category metadata | `/events` | Firestore fallback | Complete | Build |
| BR4 Event Interest | Interest action with duplicate-safe service | `EventCard` | Firestore | Complete | Manual flow |
| BR5 Society Visibility | Society directory | `/societies` | Firestore fallback | Complete | Manual flow |
| BR6 Society Sign-up | Express interest action | `SocietiesPage` | Firestore | Complete | Manual flow |
| BR7 Lost & Found | Routed destination with shared fallback | `/lost-found` | Firestore-ready | In progress | Route check |
| BR8 Classroom Booking | Date, time, capacity filter and request flow | `/rooms` | Firestore | Complete | Validation tests |
| BR9 Academic Support | Routed destination with shared fallback | `/academic-support` | Strapi/Firebase-ready | In progress | Route check |
| BR10 FAQ Access | AI context includes FAQ demo content | `/support`, `ai.ts` | Strapi fallback | Complete | AI fallback |
| BR11 Content Maintenance | Staff overview and Strapi boundary | `/staff` | Strapi | Complete | Build |
| BR12 Access Levels | User role model, staff gating and rules | `auth.ts`, `firestore.rules` | Firebase | Complete | Rules review |
| BR13 Academic Calendar | Demo academic milestones | `/academic-calendar` | Strapi-ready | Complete | Build |
| BR14 Student Onboarding | Routed destination | `/onboarding` | Strapi-ready | In progress | Route check |
| BR15 Emergency Communication | Emergency announcement styling | `AnnouncementsPage` | Strapi fallback | Complete | Build |
| BR16 Schedule Changes | Announcement channel | `/announcements` | Strapi | In progress | Content setup |
| BR17 Feedback Loop | Routed destination | `/feedback` | Firestore-ready | In progress | Route check |
| BR18 Volunteering | Routed destination | `/volunteering` | Strapi-ready | In progress | Route check |
| BR19 Alumni Engagement | Routed destination | `/alumni` | Strapi-ready | In progress | Route check |
| BR20 Job Visibility | Opportunity listing | `/jobs` | Strapi fallback | Complete | Build |
| BR21 Facility Reporting | Staff metric and routed destination | `/staff`, `/facilities` | Firestore-ready | In progress | Rules review |
| BR22 Staff Directory | Routed destination | `/staff-directory` | Strapi-ready | In progress | Route check |
| BR23 Financial Support | Routed destination | `/financial-support` | Strapi-ready | In progress | Route check |
| BR24 Sports & Recreation | Service data and routed destination | `/sports` | Strapi fallback | In progress | Route check |
| BR25 Dining | Campus service card | `/dining` | Strapi-ready | In progress | Route check |
| BR26 Printing | Campus service + AI answer | `/campus-services`, `/assistant` | Strapi fallback | Complete | AI fallback |
| BR27 Textbook Exchange | Routed destination | `/textbooks` | Firestore-ready | In progress | Route check |
| BR28 Guest Lectures | Event category | `/events` | Firestore fallback | Complete | Build |
| BR29 Wellbeing | Service card + routed destination | `/wellbeing` | Strapi-ready | In progress | Route check |
| BR30 IT Support | IT Helpdesk service card | `/campus-services` | Strapi fallback | Complete | Build |
| BR31 Library Resources | Learning Commons service card | `/campus-services` | Strapi fallback | Complete | Build |
| BR32 Student Life | Society and event surfaces | `/societies`, `/events` | Firebase fallback | Complete | Build |
| BR33 AI Assistant | Gemini adapter, sources, fallback chat | `/assistant`, `ai.ts` | Gemini + trusted data | Complete | Fallback test |
| NFR Usability | Clear labels, responsive layout, keyboard focus | Global shell | Client | Complete | Manual review |
| NFR Performance | Small demo payloads and service boundaries | `services/*` | Firebase/Strapi | Complete | Production build |
| NFR Reliability | Fallback content and friendly empty states | Pages/services | Local demo | Complete | Build |
| NFR Security | Auth-aware rules and role helper | `auth.ts`, `firestore.rules` | Firebase | Complete | Rules review |
| NFR Maintainability | Typed models and reusable cards | `types`, `App.tsx` | Client | Complete | Typecheck |
| NFR Robustness | Booking/form validation and duplicate prevention | `validation.ts`, services | Client/Firebase | Complete | `npm run test` |
