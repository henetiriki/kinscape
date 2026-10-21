import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    coverage: {
      exclude: [
        '.claude/**',
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
      ],
      include: ['{app,lib,scripts}/**/*.{ts,tsx,js,mjs,mts}'],
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    environment: 'jsdom',
    include: ['{app,lib,scripts}/**/__tests__/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
