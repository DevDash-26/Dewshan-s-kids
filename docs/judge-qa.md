# Judge Q&A Prep — UCL ONE

**1. Why this architecture?**
Two data sources split by access pattern, not by feature: Strapi for staff-authored, read-heavy campus information (one content type, 22 categories); Firestore for per-user, write-heavy transactional data with real-time listeners. This let us cover 20+ information requirements with one backend instead of 20, and gave the 7 action workflows live status updates for free.

**2. Why this technology stack?**
It was the confirmed stack for this hackathon: React/TypeScript/Vite/Tailwind, Firebase (Auth + Firestore), Strapi Community, Gemini API. Within that, our own decision was the content-engine/action-workflow split described above.

**3. Why Strapi instead of a custom backend for content?**
It gives us an admin panel, draft/publish workflow, and its own RBAC "for free," directly satisfying BR11 (content maintenance) without writing a CMS from scratch in a 6-hour window.

**4. How does RBAC work?**
Three roles — STUDENT, STAFF, ADMIN — stored on the user's Firestore profile. Every Firestore collection has a Security Rule that checks this role server-side (`firebase/firestore.rules`); the UI's permission checks (`src/lib/permissions.ts`) are for UX only and are not the actual security boundary. 22 automated tests run these rules against a live Firestore emulator.

**5. How do you prevent unauthorized publishing?**
Two layers: (1) Strapi's own admin authentication gates all content writes — the public API is read-only. (2) Public self-signup in the Firebase app can only ever create a STUDENT account; STAFF/ADMIN accounts are seeded out-of-band, specifically because this repo is public and any client-side "staff code" would be visible to anyone reading the source.

**6. How does the AI get its information?**
It retrieves from the same content corpus Search & Discover uses (Strapi content items), scores relevance with a category-aware keyword matcher, and — when a Gemini API key is configured — includes only that retrieved content in the prompt, instructing the model to say so if the content doesn't answer the question.

**7. How do you reduce AI hallucination?**
By construction: the prompt sent to Gemini contains only retrieved platform content, with an explicit instruction not to invent facts outside it. We don't rely on the model's general knowledge about "Universal College Lanka" at all, since that knowledge doesn't exist — it's a fictional institution for this hackathon.

**8. What happens if the AI API fails or no key is configured?**
It falls back to returning the retrieved content directly as a deterministic answer, clearly labelled "(search fallback)" in the UI — never silently pretending to be AI-generated. This path is covered by an automated test (`ai.test.ts`) and was the mode used throughout our own testing.

**9. How does classroom conflict detection work?**
Client checks every room's existing PENDING/APPROVED bookings for the requested date and computes time-range overlap before offering it as available, and re-checks immediately before writing the request. We're upfront that this isn't atomic — a true guarantee would need a server-side transaction (Cloud Function), which we didn't build in the time available.

**10. How did you test the system?**
Four layers: pure-logic unit tests (19), Firestore Security Rules tests against a real emulator (22), Firebase Auth tests against a real emulator (3), and a scripted Playwright browser smoke test of the full golden path with zero console errors. All numbers in this Q&A are from actual runs, not estimates.

**11. How is personal information protected?**
Firebase Authentication handles credentials entirely (we never see passwords). Firestore rules restrict most personal data (support requests, feedback, own bookings visible-by-owner-or-staff) to the owner or staff/admin. One documented exception: booking records are readable by any signed-in user rather than owner-only, because Firestore rejects a `list` query whose rule depends on an unfiltered field — we treat booking data like a shared calendar rather than private data.

**12. How does the system scale?**
Firestore and Strapi both scale independently of our application code. Our queries filter server-side on indexed fields rather than fetching everything client-side. We haven't added caching or code-splitting yet (documented as NFR2 = partial) — the honest scaling gap in this build is the frontend bundle size, not the data layer.

**13. How is the system maintainable?**
TypeScript throughout, one consistent component vocabulary, and — most importantly — the content engine means a future developer adds a new information category by adding an enum value, not a new database table, a new API route, and a new page component.

**14. What did you prioritize?**
A working core loop (auth → dashboard → content → one real action workflow) before breadth, then breadth via the content engine (near-zero marginal cost per category), then the two workflows that needed bespoke logic (booking, AI), then testing and docs.

**15. What did you leave out?**
Bespoke transactional workflows for BR24 (sports booking) and BR27 (student-authored textbook listings) — both are visibility-complete but action-incomplete, documented honestly rather than silently dropped.

**16. What would you build next?**
A Cloud Function proxy for the Gemini API key, atomic booking transactions, and extending the room-booking pattern to sports facilities and a textbook marketplace.

**17. What makes the approach innovative?**
The content engine isn't just a technical convenience — it's what makes targeting (BR2) and search (BR1) work identically across all 22 categories instead of being reimplemented per feature, and it's what let us reach near-total requirement coverage in the time available.

**18. Which requirements are fully implemented?**
31 of 33 — see `/docs/requirements-traceability.md` for the complete list with routes.

**19. Which requirements are partial?**
BR24 (sports booking — visibility only) and BR27 (textbook exchange — visibility only, no student self-listing). Both are documented with the specific reason in the traceability doc.

**20. What technical trade-offs did you make because of the time constraint?**
No Cloud Function proxy for the AI key (client-side call instead); no atomic transaction for booking conflicts (check-then-write instead); broadened read access on `roomBookings` (a Firestore query-safety constraint we discovered during testing, not a preference); no code-splitting. Each is documented in the report rather than hidden.
