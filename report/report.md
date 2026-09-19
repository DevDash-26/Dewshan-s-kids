# UCL ONE Hackathon Report

## Problem

Students typically move across disconnected systems for announcements, service information, events, classroom bookings, and campus support. The challenge was to provide a trusted single experience that surfaces official information and enables key student workflows without relying on an enterprise stack during a six-hour build window.

## Solution

UCL ONE is a campus experience prototype that brings together a personalised dashboard, event and society engagement, room booking, support/resources, FAQ, search, and a grounded AI assistant behind a single authenticated interface. The application focuses on the highest-value student actions and keeps the architecture lightweight enough to be reliable and demo-ready.

## Architecture

- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- Icons: Lucide React
- API: Express.js
- Identity and authorization: JWT with bcryptjs
- Data layer: seeded in-memory JSON data
- AI: grounded local response engine with optional Gemini enhancement when configured

## Requirement prioritization

The implementation prioritizes the core student journey:
1. Sign in and role-aware access
2. Personalized dashboard and official announcements
3. Event and society engagement
4. Room booking and conflict validation
5. Support resources, FAQs and staff access
6. AI guidance and search

This prioritization preserves a coherent demo path and keeps the prototype focused on the features that matter most to the judge and the users.

## Implementation

The platform includes the following working flows:
- Student login and role-aware dashboard access
- Targeted announcements filtered by role and profile metadata
- Event listing and duplicate-safe interest registration
- Society browsing and membership interest
- Classroom request flow with overlap detection
- Lost & found reporting and browsing
- FAQ and support resource access
- Staff/admin announcement creation with authorization checks
- Search across campus data
- AI assistance grounded in app data with safe fallback behaviour

## Authentication and authorization

Authentication is handled through JWT tokens issued on successful login. Passwords are hashed with bcryptjs before comparison. The backend enforces authentication and role checks with middleware for student-only and staff/admin-only actions. This is the core security mechanism used on the MVP.

## AI

The AI route is designed to work even without an external provider. When `GEMINI_API_KEY` is not configured, the backend returns a grounded response built from local campus data. When a real Gemini key is present, the system can optionally route the request to the external model. The fall-back path keeps the demo stable and reproducible.

## Testing

The implementation was validated using the real backend suite and a frontend production build:
- `npm --workspace backend run test` → passed with 11 tests, 0 failed
- `npm --workspace frontend run build` → succeeded

The backend tests cover login, role enforcement, duplicate handling, room conflicts, validation, and AI input rejection.

## Security

Security in the current prototype is intentionally pragmatic and relevant for a hackathon MVP:
- JWT-based session protection
- Password hashing
- Role restrictions for privileged actions
- Input validation for required fields and duplicate/conflict cases
- Default secrets only for local demonstration; real secret management would be required in production

## Robustness

The backend includes validation for required inputs, duplicate event/society interest, room overlap, invalid credentials, and empty AI prompts. These checks prevent common user errors and keep the demo stable.

## Innovation

The key innovation is the integration of trust, access, and action in one place: the user receives canonical campus information, can act directly from the same interface, and benefits from AI guidance grounded in campus data rather than open-ended unstructured answers.

## Limitations

This is not a production-scale deployment. The prototype intentionally uses:
- in-memory JSON data instead of a durable database
- no live CMS or content management backend
- no production cloud authentication system
- no live multi-tenant deployment infrastructure
- optional external service integrations that are not required for the demo

## Future improvements

- Replace the local data store with PostgreSQL or another durable database
- Add real staff/admin content management workflows
- Integrate live Firebase or similar identity/storage services when needed
- Connect a production-grade AI provider behind the fallback layer
- Expand support and service modules for broader campus operations

## Final assessment

The project demonstrates a working, testable, demo-ready campus platform MVP. It is technically defensible within the constraints of a six-hour hackathon build, but it should be described honestly as a prototype with optional service hooks rather than a deployed cloud-native production system.
