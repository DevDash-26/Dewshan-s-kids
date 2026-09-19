# UCL Connect

**Your campus. Connected.**

UCL Connect is a hackathon-ready campus hub prototype for Universal College Lanka. It brings campus information, events, societies, rooms, support and trusted AI guidance into one responsive experience.

## Features

- Branded responsive dashboard with quick actions, announcements, events and academic calendar
- Demo sign-in flow, role model and staff dashboard
- Event interest, society membership interest and classroom booking flows
- AI assistant at `/assistant` with source links, suggested prompts and deterministic fallback mode
- Campus services, jobs, announcements, academic calendar, profile and support-ready routes
- Typed Firebase, Firestore, Strapi and Gemini service adapters
- Firestore security rules, validation tests and fictional demo data

The lower-priority destinations (`/lost-found`, `/academic-support`, `/support`, `/feedback`, `/onboarding`, `/wellbeing`, `/dining`, `/printing`, `/sports`, `/staff/content`, `/staff/reports`) are routed and ready for Strapi/Firebase content expansion through the shared page architecture.

## Technology stack

React, TypeScript, Vite, Tailwind CSS v4, Lucide React, React Router, Firebase Authentication/Firestore, Strapi Community Edition and Gemini API.

## Architecture

- `src/services/firebase.ts` initializes Firebase only when real values are present.
- `src/services/auth.ts` owns auth/role helpers and demo credentials.
- `src/services/firestore.ts` owns transactional application operations.
- `src/services/strapi.ts` owns CMS reads and falls back to demo content when Strapi is unavailable.
- `src/services/ai.ts` owns Gemini integration and a deterministic UCL-specific fallback.
- Strapi is intended for managed announcements, FAQs, services, academic information, jobs and support content. Firestore is intended for users, interests, bookings, reports, feedback and requests.

## Setup

```bash
npm install
npm run dev
```

The app works without external services by design. Copy `.env.example` to `.env`; a placeholder `.env` is included for local demo mode and is ignored by Git.

## Environment variables

- `VITE_FIREBASE_*`: copy the web app configuration from Firebase Console > Project settings > Your apps.
- `VITE_STRAPI_URL`: your Strapi URL, usually `http://localhost:1337` locally.
- `VITE_STRAPI_API_TOKEN`: a Strapi API token with read permissions.
- `VITE_GEMINI_API_KEY`: a Gemini API key from Google AI Studio.
- `VITE_AI_PROVIDER`: currently `gemini`; missing/placeholder Gemini keys use demo intelligence.

Vite exposes `VITE_*` variables to the browser. For production, privileged Gemini or Strapi secrets should be kept behind an authenticated server or Cloud Function rather than shipped in the client bundle.

## Firebase setup

1. Create a Firebase project and add a web app.
2. Enable Authentication > Sign-in method > Email/Password.
3. Create a Firestore database.
4. Add the web app config values to `.env`.
5. Deploy or paste `firestore.rules` in Firestore Rules.
6. Create user profile documents with roles: `student`, `admin`, `academic`, `society_manager`, `finance`, or `facilities`.

## Strapi setup

1. Create and run a Strapi Community Edition project.
2. Create an admin account.
3. Add collection types for `announcements`, `faqs`, `services` and `jobs`.
4. Grant read permissions or create a read-only API token.
5. Add the URL and token to `.env`.

## Gemini setup

Create a key in Google AI Studio and add it locally:

```env
VITE_GEMINI_API_KEY=YOUR_KEY_HERE
```

The browser integration is intentionally simple for this hackathon. A production deployment should proxy Gemini through a server-side function with rate limiting and authenticated access.

## Demo access

- Email: `aarav.perera@demo.ucl.lk`
- Password: `DemoPass123!`

These are fictional demo values and do not authenticate against a real service until Firebase Auth is connected.

## Validation and deployment

```bash
npm run test
npm run build
```

For Firebase Hosting, run `firebase init hosting`, choose `dist` as the public directory, configure SPA rewrites to `index.html`, then run `firebase deploy`.

## Security model

Firestore rules require authentication for application reads and writes, restrict user-owned records to their owner, and grant broader operational writes only to staff roles. Validate role claims again in Cloud Functions for production. Never use `allow read, write: if true;`.
