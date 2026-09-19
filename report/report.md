# UCL ONE Hackathon Report

## Project overview

UCL ONE is a unified campus platform prototype designed to centralize official student information, services, and actions into a single digital experience. The system combines a role-aware dashboard, announcement filtering, event and society engagement, room booking, support resources, and a grounded AI assistant.

## Why this project matters

Students typically navigate multiple disconnected systems: social groups, email threads, noticeboards, physical service desks, and informal word-of-mouth. UCL ONE addresses this by creating a trusted single experience for official campus information and core student workflows.

## Product goals

- Reduce information fragmentation across student life
- Improve discoverability of official events, support and resources
- Empower students to act directly from one platform
- Ensure role-aware access across student, staff and admin flows
- Provide a grounded AI assistant for quick campus guidance

## Key features implemented

- Student dashboard with personalised announcements
- Event listing and interest registration with duplicate prevention
- Society interest registration
- Room booking request flow with schedule overlap detection
- Lost & found submission and browsing
- Support resources, FAQ and staff information
- Search service for campus content
- Local AI-backed responder grounded in app data
- Authenticated access with JWT and role restrictions

## Architecture

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Authentication: JWT with bcrypt password hashing
- Data layer: in-memory seeded JSON for rapid prototype development
- Validation: Node test runner with API-level checks

## Validation evidence

The implementation was validated with the following commands:

- `cd "F:/Downloads/HACKEN/CODE/Dewshan-s-kids" && node --test backend/server.test.js`
  - Result: 9 tests passed, 0 failed
- `cd "F:/Downloads/HACKEN/CODE/Dewshan-s-kids/frontend" && npm run build`
  - Result: production build succeeded in 2.48s

## Scope and trade-offs

This is a six-hour hackathon MVP and therefore prioritises a working, testable campus experience over deep production-scale infrastructure. The prototype intentionally uses in-memory data to keep the app reliable and demo-ready during the event window.

## Recommended next steps

- Replace the in-memory store with PostgreSQL or a real database layer
- Add proper CMS/admin tooling for content management
- Add real notifications and reminders
- Integrate a production AI service behind the grounded local fallback
- Expand the support and service modules for broader campus operations

## Final assessment

The project successfully demonstrates a realistic and usable campus platform MVP that is technically defensible, tested, and demo-ready within the challenge constraints.
