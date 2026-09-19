import { defineConfig } from 'vitest/config'

// Separate config for tests that need the Firestore emulator running
// (`firebase emulators:start --only firestore` from the repo root) and are
// intentionally excluded from the default `npm test` run.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/test/firestore.rules.test.ts', 'src/test/booking-conflict.integration.test.ts'],
    testTimeout: 15000,
  },
})
