import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // firestore.rules.test.ts, booking-conflict.integration.test.ts, and
    // auth.integration.test.ts need the Firebase emulators running and are
    // run separately via `npm run test:rules` / `npm run test:auth`.
    exclude: [
      '**/node_modules/**',
      '**/firestore.rules.test.ts',
      '**/booking-conflict.integration.test.ts',
      '**/auth.integration.test.ts',
    ],
  },
})
