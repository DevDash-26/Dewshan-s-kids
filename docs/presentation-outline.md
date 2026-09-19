# Presentation Outline — UCL ONE (8 minutes)

## 0:00–0:45 — Problem
UCL students have no single trusted channel for campus information — WhatsApp groups, notice boards, and word of mouth are the status quo. Open with one concrete failure: a student who missed an exam schedule change because it was only posted in a WhatsApp group they'd left.

## 0:45–1:30 — Solution
UCL ONE: one platform, two halves — a reusable content engine covering 22 information categories, and purpose-built action workflows (booking, reporting, requesting) on top. Not 20 mini-apps; one coherent product.

## 1:30–2:00 — Architecture
React + Firebase for the student/staff app and real-time actions; Strapi as the reusable content engine so one content type covers 20 of the 33 business requirements; Firestore Security Rules — not hidden buttons — enforce who can do what.

## 2:00–5:00 — Live Demo
Follow the golden path exactly — this is the one path in the committed, reproducible E2E suite (`npm run test:e2e`), rehearsed end-to-end and verified with zero console errors (see `/report/report.md` § 19). **Do not demo Gemini as "live AI"** — no API key is configured in this environment; the assistant is genuinely useful, but say so directly if asked (see judge-qa.md).
1. Student login → dashboard shows an emergency notice and a faculty-targeted announcement (and, if we're confident on time, briefly show a Business-only student that a Computing-targeted item is correctly absent — the actual BR2 fix, not just a claim).
2. Ask the AI Assistant "Are there any events this week?" — show it returning real, dated events, correctly labelled "(search fallback)" — the honesty of that label is itself a point in our favour, not something to rush past.
3. Register interest in an event, show the count update live. Join a society.
4. Check classroom availability, submit a booking request.
5. Switch to staff login (`staff.admin@uclone.lk`, ADMINISTRATIVE department) → Staff Console → approve the booking.
6. Switch to a *different* staff account (`staff.academic@uclone.lk`) → show it sees a different set of tabs — the department differentiation is real, not just a role label.
7. Switch back to the student → booking now shows APPROVED.

## 5:00–5:45 — Technical Depth
The content engine: one Strapi schema, `category` enum, covers announcements through library hours. Show the schema briefly. Mention the test suite (76+ tests against real emulators, plus the committed E2E suite) as evidence RBAC and workflows aren't just a UI illusion — and that the department-boundary tests specifically prove a staff member outside the right department is rejected server-side.

## 5:45–6:30 — Innovation
Not a gimmick bolted on — the AI assistant is grounded in the platform's own content, and its fallback mode (no external API call) had to be good enough to stand on its own, which drove two real engineering fixes (category-aware ranking, whole-word matching) found during testing. Equally, mention the forensic audit itself as a deliberate part of the process: we found and fixed a public API draft-content leak and a booking-approval workflow with zero conflict checking by treating our own documentation as a claim to verify, not a fact — and we're presenting that process, not hiding it.

## 6:30–7:15 — Requirements + Prioritisation
29/33 business requirements complete, 2 honestly partial (sports booking, textbook self-listing), 1 partial specifically because its AI call has never executed here (say this plainly if asked — see judge-qa.md). The two visibility-only ones were deprioritised because they'd need a bespoke workflow rather than reusing an existing one, and reuse was where the time budget went.

## 7:15–7:45 — Impact
One place for a first-year student to find everything from orientation info to exam dates to counselling support, with staff able to publish once and have it reach the right audience automatically via targeting.

## 7:45–8:00 — Closing
UCL ONE: one trusted channel, built on a reusable foundation that a real UCL IT team could maintain and extend — not a hackathon demo that only works on stage.
