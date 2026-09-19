# UCL ONE

UCL ONE is a unified campus experience designed to bring official student information, support services, engagement activities, and action flows into a single trusted platform.

## What it does

- Personalised campus dashboard with announcements relevant to the student profile
- Event discovery and interest registration with duplicate protection
- Society engagement and membership interest flow
- Room booking with overlap validation for scheduling conflicts
- Lost & found, support, FAQ and staff directory access
- Search across campus content
- Grounded AI assistant for campus guidance

## Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Auth: JWT + bcryptjs
- Data: seeded in-memory JSON for rapid prototype execution

## Run locally

1. Install dependencies:
   npm install
2. Start the backend:
   npm run dev --workspace backend
3. Start the frontend:
   npm run dev --workspace frontend

## Validate

- Backend tests:
  node --test backend/server.test.js
- Frontend build:
  cd frontend && npm run build

## Key project files

- [backend/server.js](backend/server.js)
- [backend/server.test.js](backend/server.test.js)
- [backend/data.js](backend/data.js)
- [frontend/src/App.tsx](frontend/src/App.tsx)
- [docs/requirements-traceability.md](docs/requirements-traceability.md)
- [docs/presentation-outline.md](docs/presentation-outline.md)
- [docs/judge-qa.md](docs/judge-qa.md)
- [report/report.md](report/report.md)

## Status

This repository contains a working hackathon MVP that is testable, buildable and demo-ready, with the final documentation package included for judge and presentation use.
