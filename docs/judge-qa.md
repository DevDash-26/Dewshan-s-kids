# Judge Q&A guide

## 1. Why this architecture?
We used a small full-stack architecture with React on the frontend and Express on the backend so the application could be built quickly, remain testable, and still demonstrate a realistic campus platform.

## 2. Why this technology stack?
React and TypeScript provide a clear UI foundation, while Express is lightweight and fast for a hackathon prototype. The stack is familiar, reliable and maintainable without unnecessary infrastructure.

## 3. Why JSON instead of PostgreSQL/Prisma?
The repository started empty and the hackathon window was six hours. JSON-backed data avoids setup risk while keeping the data model explicit and the product demonstrable. This is a pragmatic prototype choice, not a long-term production architecture.

## 4. How does RBAC work?
The backend checks a JWT token and reads the user role. Student, staff and admin actions are gate-kept using middleware. Students can view and request, while announcement publishing and admin-level actions are restricted to authorized roles.

## 5. How do you prevent unauthorized publishing?
Only `STAFF` and `ADMIN` users can create announcements. The route checks the authenticated user role before creating content.

## 6. How does AI get its information?
The AI route uses the current app data for announcements, events, academic dates and support resources. It does not fabricate facts; it responds from the local campus dataset and offers route suggestions.

## 7. How do you reduce AI hallucination?
We ground the AI in in-app data, restrict answers to known categories and clearly label the response as grounded. If the question is outside the campus dataset, the assistant gives a safe, limited answer.

## 8. What happens if the AI API fails?
The prototype uses a deterministic local fallback with structured answers. It remains functional without external credentials and clearly documents the limitation.

## 9. How does classroom conflict detection work?
A room request is rejected when the proposal overlaps an existing approved or pending booking for the same room and date. This prevents double-booking in the core workflow.

## 10. How did you test the system?
We ran automated backend tests covering auth, authorization, duplicate prevention, room conflict validation and AI validation. The results were executed and reviewed before finalizing the prototype.

## 11. How is personal information protected?
User passwords are hashed with bcrypt, JWTs are used for session validation, and authorization is enforced server-side. We do not expose unnecessary information in the UI.

## 12. How does the system scale?
The architecture is simple and modular. It is suitable for a university prototype and can be extended with a real database and service layer without redesigning the product concept.

## 13. How is the system maintainable?
The code is organized by feature area and uses middleware-based auth and validation. The model is straightforward enough for future student developers to extend and support.

## 14. What did you prioritize?
We prioritized the student dashboard, announcements, search, onboarding, events, society sign-up, room booking, lost & found, support resources and AI discovery. These workflows form the core campus experience.

## 15. What did you leave out?
Some optional modules such as textbook exchange, alumni engagement, sports scheduling and some deeper administrative workflows were not implemented in the six-hour build window.

## 16. What would you build next?
A production version would add PostgreSQL/Prisma, real staff CMS tools, notification pipelines, uploads, persistent storage and a proper external AI integration.

## 17. What makes the approach innovative?
The product combines unified content, profile-aware targeting, action flows and grounded AI discovery in one coherent university hub rather than disconnected feature modules.

## 18. Which requirements are fully implemented?
The prototype has strong coverage for the core campus platform, including dashboard, search, targeted announcements, events, societies, rooms, lost and found, AI and support flows.

## 19. Which requirements are partial?
Certain broad content modules such as alumni, sports, volunteering, textbook exchange and long-form onboarding are intentionally simplified or omitted in this hackathon MVP.

## 20. What trade-offs did you make?
We chose a fast, reliable, low-infra architecture to maximize working functionality under the six-hour constraint. Real database persistence and broader content coverage were deferred to preserve a working demo.
