import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Simulationstests spielen ganze Schichten durch.
    testTimeout: 60_000,
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts'],
      thresholds: {
        'packages/sim/src/**': { lines: 85, functions: 85, branches: 80, statements: 85 },
      },
    },
  },
});
