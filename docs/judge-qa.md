# Judge Q&A Prep — UCL ONE

Updated after a forensic re-audit that found and fixed several real gaps (see `report/report.md` § 21). Answers below reflect the *current* code and test suite, not the original build.

**Is the AI assistant actually using Gemini?**
No — not in this environment, and we say that plainly rather than let "AI Assistant" imply otherwise. `VITE_GEMINI_API_KEY` has been empty throughout this project's history. Every answer the assistant has ever produced, in every test we've run, is the deterministic keyword-search fallback, and every one of those answers self-discloses that in the UI ("Note: the Gemini API key is not configured..."). The Gemini integration code is written, structurally sound (uses `systemInstruction` to separate the persona/grounding rules from the raw user question, reducing prompt-injection risk), and would activate immediately if a key were provided — but we're not going to claim it's been demonstrated when it hasn't. What *is* demonstrated is that the retrieval and grounding — the actual hard part — works: it answers all 10 of the officially suggested test questions correctly, handles gibberish and adversarial input gracefully, and two real retrieval bugs found during testing (substring false-positives) are fixed and regression-tested.

**How do you prevent students from accessing unpublished content?**
Server-side, not just in the UI. The public Strapi API forces `status=published` on every request to the content-item controller, regardless of what query parameter a caller sends — this closes a real gap a forensic audit found: an anonymous request to `?status=draft` used to return actual unpublished content. It's fixed and covered by a reproducible script (`cms/scripts/verify-public-api-security.mjs`) anyone can run against a live instance to confirm. Draft content is only ever visible through the Strapi admin panel, which requires a real admin login (verified: anonymous requests to admin endpoints get a 401).

**How do staff roles differ?**
Three roles at the top level — STUDENT, STAFF, ADMIN — plus a `staffDepartment` on STAFF accounts (ACADEMIC, SOCIETY, ADMINISTRATIVE, or FINANCE) that gates which collections they can act on: ACADEMIC handles academic support requests, SOCIETY sees the society sign-up roster, ADMINISTRATIVE handles room booking approval, feedback, and facility issues. This is enforced in `firestore.rules` via `isAdminOrDepartment(dept)`, tested with both positive and negative cases (a staff member outside the right department is rejected server-side, not just kept off a tab in the UI), and it's genuinely demonstrable: three differentiated demo accounts (`staff.admin@`, `staff.academic@`, `staff.society@uclone.lk`) log in to visibly different Staff Console tabs. FINANCE has no dedicated Firestore action in this build — financial-support content is managed through Strapi's own admin auth instead, which we say directly rather than leave implicit.

**How do you prevent double-booking?**
Two layers, and we're specific about what each one actually covers. At **request time**, the client checks every existing PENDING/APPROVED booking for the room/date and computes time overlap before offering a room as available, then re-checks immediately before writing. At **approval time** — which a forensic audit found had *zero* conflict awareness at all, letting two overlapping PENDING requests both get approved with no warning — `decideBooking` now runs inside a Firestore transaction that re-reads the target booking and every other APPROVED booking for the same room/date at commit time, rejecting the approval if any overlap exists. This is covered by 6 integration tests against the real emulator: no conflict, exact overlap, partial overlap, adjacent (non-overlapping) booking, different room, and wrong-department staff. It is optimistic-concurrency re-validation, not a full pessimistic lock — a booking created in the exact same instant as the transaction commits, after the initial candidate query, isn't covered. A production system would close that fully with a server-side transaction boundary (Cloud Function).

**How do you prevent duplicate society registrations?**
A deterministic Firestore document id (`{societyId}_{studentId}`), the same pattern already used for event interest — re-registering overwrites the same document instead of creating a second one, so it's structurally impossible to duplicate rather than something we check for. This wasn't always true: the original implementation used an auto-generated id and relied on client-held state alone, which a forensic audit flagged as weaker than the event-interest pattern it should have matched. Fixed, and covered by a rules test that submits the same join twice and asserts both succeed without creating a duplicate.

**How is Firestore secured?**
`firebase/firestore.rules` is the actual authorization boundary — not the UI. Every collection has an explicit rule: ownership checks (`isOwner`), role checks (`isStaffOrAdmin`, `isAdmin`), and department checks (`isAdminOrDepartment`) for the collections BR12 differentiates. This is verified by 44 automated tests run against the real Firestore emulator (not mocks) — a rule with a typo would genuinely fail them. Coverage was incomplete at one point (three collections had rules but zero tests); that's fixed, and every collection now has both positive and negative test cases.

**Why did you choose Strapi + Firebase?**
Two data sources split by what each is good at, not by feature. Strapi owns staff-authored, read-heavy information (all 22 informational categories, one content type, one backend instead of 22). Firestore owns per-user, write-heavy transactional data with real-time listeners, which is what makes booking status, event interest counts, and feedback responses update live without polling. Firebase and Strapi were the confirmed hackathon stack; the content-engine/action-workflow split on top of them was our own decision.

**What limitations remain?**
Honestly: BR24 (sports booking) and BR27 (textbook exchange) are visibility-only, not full workflows. BR12's FINANCE department has no dedicated Firestore action. Room booking approval is optimistic-concurrency-checked, not fully atomic. The Gemini API key would be client-side if it were ever configured (no backend proxy exists). And, stated as plainly as possible: the AI assistant has never executed a real model call in this environment. None of these are hidden — they're in `docs/requirements-traceability.md` and `report/report.md` with the specific reason for each.

**What would you improve with more time?**
A Cloud Function proxy for the Gemini key (removing the client-side exposure entirely), a fully atomic booking-approval transaction (removing the narrow remaining race window), a FINANCE-department action if a real one emerges, and extending the room-booking pattern to sports facilities and a student-authored textbook marketplace.

---

**Why this architecture?**
Two data sources split by access pattern: Strapi for staff-authored, read-heavy campus information (one content type, 22 categories); Firestore for per-user, write-heavy transactional data with real-time listeners and per-collection, per-department authorization. This covers 20+ information requirements with one backend instead of 20, and gives the 7 action workflows live status updates for free.

**Why this technology stack?**
It was the confirmed stack for this hackathon: React/TypeScript/Vite/Tailwind, Firebase (Auth + Firestore), Strapi Community, Gemini API. Our own decision was the content-engine/action-workflow split, and the department-based permission model layered on top of Firebase's role system.

**Why Strapi instead of a custom backend for content?**
It gives us an admin panel, draft/publish workflow, and its own RBAC "for free," directly satisfying BR11 without writing a CMS from scratch — provided the public API is actually locked down to published-only content, which we had to fix once (see above).

**How do you reduce AI hallucination?**
By construction, for whichever path is active: the fallback only ever returns content that's actually in the platform, and the (unexecuted-in-this-environment) Gemini prompt contains only retrieved platform content in its `systemInstruction`, with an explicit instruction not to invent facts outside it. We don't rely on the model's general knowledge about "Universal College Lanka" at all, since it doesn't exist — it's a fictional institution for this hackathon.

**How did you test the system?**
Four layers, now including a committed one: pure-logic unit tests (29), Firestore Security Rules + integration tests against a real emulator (44), Firebase Auth tests against a real emulator (3), and a committed, reproducible Playwright end-to-end suite (`npm run test:e2e`) covering the full golden path with zero console errors. Earlier E2E verification was real but done via uncommitted ad-hoc scripts; that's fixed too. All numbers here are from actual runs, not estimates.

**How does the system scale?**
Firestore and Strapi both scale independently of our application code; queries filter server-side on indexed fields rather than client-side. Route-level code splitting was added (measured: ~20 page-specific chunks of 0.2–10 kB each instead of one upfront bundle); the remaining ~823 kB vendor chunk is mostly the Firebase SDK, which is inherent to the platform choice, not an oversight.

**How is the system maintainable?**
TypeScript throughout, one consistent component vocabulary, the content engine turning "add a new information category" into "add an enum value," and the department permission model turning "add a new staff scope" into one entry in a lookup table plus one Firestore rule clause — not a new authorization system per department.

**What did you prioritize, and in what order?**
A working core loop first (auth → dashboard → content → one real action workflow), then breadth via the content engine (near-zero marginal cost per category), then the workflows needing bespoke logic (booking, AI), then testing and docs — and then, deliberately, a self-critical forensic audit before calling anything finished, which is what caught most of the fixes described above.

**What makes the approach innovative?**
The content engine isn't just a technical convenience — it's what makes targeting (BR2) and search (BR1) work identically across all 22 categories instead of being reimplemented per feature. The department permission model is the same idea applied to authorization: one primitive, five collections, instead of five bespoke role checks.

**Which requirements are fully implemented, and which are partial?**
29 of 33 COMPLETE. BR24 and BR27 are PARTIAL (visibility without a full bespoke workflow). BR33 is PARTIAL specifically because its AI call has never executed here, despite a complete and tested surrounding architecture. Full list with routes and reasons: `docs/requirements-traceability.md`.
