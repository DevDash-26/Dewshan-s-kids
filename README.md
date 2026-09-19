# UCL ONE

UCL ONE is a campus experience prototype designed to centralize official student information, engagement opportunities, support services, and action flows in one place.

## Current implementation status

### Implemented
- React + TypeScript + Vite frontend
- Node.js + Express API
- JWT authentication with role-based access control
- Seeded local data layer for students, staff, announcements, events, rooms, support content and FAQs
- Dashboard, search, announcements, event interest, society interest, room booking, lost & found, support, FAQ, staff directory and AI guidance
- API validation and duplicate/conflict protections

### Optional / configurable
- Firebase helper configuration in the frontend for future authentication/data integration when environment variables are supplied
- Gemini helper integration in the backend/frontend when `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY` is provided
- These are optional enhancement paths and are not required for the current demo

### Not currently deployed
- No live Firebase Authentication/Firestore backend is active in this repository
- No live Strapi CMS deployment is running here
- No live Firebase Hosting deployment is configured in this repo
- No production Gemini service is required for the current MVP; the app falls back to grounded local responses when no API key is provided

## Architecture

- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- UI icons: Lucide React
- Backend: Express.js
- Auth: JWT + bcryptjs
- Data layer: seeded in-memory JSON data
- AI layer: grounded campus data fallback with optional Gemini provider integration

## Local setup

1. Install dependencies:
   npm install
2. Start the backend:
   npm run dev --workspace backend
3. Start the frontend:
   npm run dev --workspace frontend

## Environment variables

Create a `.env` file if you want to enable optional integrations.

Backend example:
```bash
PORT=3001
JWT_SECRET=change-me
GEMINI_API_KEY=
```

Frontend example:
```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_GEMINI_API_KEY=
```

A template exists in `frontend/.env.example`.

## Demo credentials

Student:
- Email: nimali@student.ucl.ac.lk
- Password: student123

Staff:
- Email: staff@ucl.ac.lk
- Password: staff123

Admin:
- Email: admin@ucl.ac.lk
- Password: admin123

## Testing

Run backend tests:
```bash
npm --workspace backend run test
```

Run frontend production build:
```bash
npm --workspace frontend run build
```

## Known limitations
- The app uses in-memory seeded data rather than a persistent production database
- Content management is not a full CMS workflow
- Notifications and reminders are not yet production-grade
- AI responses are grounded in local campus data, with optional external API enhancement
- No live cloud services are being claimed beyond these optional config paths

## Technology disclosure

This repository contains a working MVP built with a real frontend and backend stack. Optional service integrations are included as configuration hooks only. They are not treated as active runtime dependencies unless the required environment variables and external services are present.

## Important project files
- [backend/server.js](backend/server.js)
- [backend/data.js](backend/data.js)
- [backend/server.test.js](backend/server.test.js)
- [frontend/src/App.tsx](frontend/src/App.tsx)
- [frontend/src/lib/firebase.ts](frontend/src/lib/firebase.ts)
- [frontend/src/lib/gemini.ts](frontend/src/lib/gemini.ts)
- [docs/requirements-traceability.md](docs/requirements-traceability.md)
- [report/report.md](report/report.md)
