import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      '@ks': fileURLToPath(new URL('.', import.meta.url)),
      // The real package throws outside Next's server build.
      'server-only': fileURLToPath(
        new URL('./node_modules/server-only/empty.js', import.meta.url)
      ),
    },
  },
  test: {
    coverage: {
      exclude: [
        '.claude/**',
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
      ],
      include: ['{app,design,lib,scripts,server}/**/*.{ts,tsx,js,mjs,mts}'],
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    css: { modules: { classNameStrategy: 'non-scoped' } },
    environment: 'jsdom',
    include: [
      '{app,design,lib,scripts,server}/**/__tests__/**/*.test.{ts,tsx}',
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
