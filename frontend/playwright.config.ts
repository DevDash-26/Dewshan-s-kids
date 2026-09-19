import { defineConfig } from '@playwright/test'

// A small, reliable smoke suite (e2e/smoke.spec.ts), not a large brittle E2E
// framework. See README > Testing for prerequisites: the Firebase emulators
// (Auth + Firestore) and Strapi must already be running with demo data
// seeded, since this config only starts the frontend dev server itself.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
