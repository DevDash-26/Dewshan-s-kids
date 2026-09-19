# Presentation Outline — UCL ONE (8 minutes)

## 0:00–0:45 — Problem
UCL students have no single trusted channel for campus information — WhatsApp groups, notice boards, and word of mouth are the status quo. Open with one concrete failure: a student who missed an exam schedule change because it was only posted in a WhatsApp group they'd left.

## 0:45–1:30 — Solution
UCL ONE: one platform, two halves — a reusable content engine covering 22 information categories, and purpose-built action workflows (booking, reporting, requesting) on top. Not 20 mini-apps; one coherent product.

## 1:30–2:00 — Architecture
React + Firebase for the student/staff app and real-time actions; Strapi as the reusable content engine so one content type covers 20 of the 33 business requirements; Firestore Security Rules — not hidden buttons — enforce who can do what.

## 2:00–5:00 — Live Demo
Follow the golden path exactly (this is the one path rehearsed end-to-end and verified with zero console errors — see `/report/report.md` § 19):
1. Student login → dashboard shows an emergency notice and a faculty-targeted announcement.
2. Ask the AI Assistant "Are there any events this week?" — show it returning real, dated events, not a canned response.
3. Register interest in an event, show the count update live.
4. Check classroom availability, submit a booking request.
5. Switch to staff login → Staff Console → approve the booking.
6. Switch back to the student → booking now shows APPROVED.

## 5:00–5:45 — Technical Depth
The content engine: one Strapi schema, `category` enum, covers announcements through library hours. Show the schema briefly. Mention the Firestore rules test suite (22 tests against a real emulator) as evidence RBAC isn't just a UI illusion.

## 5:45–6:30 — Innovation
Not a gimmick bolted on — the AI assistant is grounded in the platform's own content, and its fallback mode (no external API call) had to be good enough to stand on its own, which drove a real engineering fix (category-aware ranking) found during testing.

## 6:30–7:15 — Requirements + Prioritisation
31/33 business requirements complete, 2 honestly partial (sports booking, textbook self-listing) — both were deprioritised because they'd need a bespoke workflow rather than reusing an existing one, and reuse was where the time budget went.

## 7:15–7:45 — Impact
One place for a first-year student to find everything from orientation info to exam dates to counselling support, with staff able to publish once and have it reach the right audience automatically via targeting.

## 7:45–8:00 — Closing
UCL ONE: one trusted channel, built on a reusable foundation that a real UCL IT team could maintain and extend — not a hackathon demo that only works on stage.
