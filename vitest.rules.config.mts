import { defineConfig } from 'vitest/config';

// Security rules tests; run them through `npm run test:rules`, which starts the Firestore emulator.
export default defineConfig({
  test: {
    include: ['test/rules/**/*.test.ts'],
    environment: 'node',
  },
});
