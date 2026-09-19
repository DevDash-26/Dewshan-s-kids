import { defineConfig } from 'vitest/config'

// Separate config for firestore.rules.test.ts, which needs the Firestore
// emulator running (`firebase emulators:start --only firestore` from the
// repo root) and is intentionally excluded from the default `npm test` run.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/test/firestore.rules.test.ts'],
  },
})
