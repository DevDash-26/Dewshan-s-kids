import { defineConfig } from 'vitest/config'

// Separate config for auth.integration.test.ts, which needs the Auth
// emulator running (`firebase emulators:start --only auth` from the repo
// root) and is intentionally excluded from the default `npm test` run.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/test/auth.integration.test.ts'],
  },
})
