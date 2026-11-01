import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const requireHere = createRequire(import.meta.url);

const TESTS =
  '{app,design,features,lib,scripts,server}/**/__tests__/**/*.test.{ts,tsx}';
const REACT_18_TEST = 'lib/design/__tests__/react-18.test.tsx';

export default defineConfig({
  resolve: {
    alias: {
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
        'design/canvas/**',
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
      ],
      include: [
        '{app,design,features,lib,scripts,server}/**/*.{ts,tsx,js,mjs,mts}',
      ],
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
    projects: [
      {
        extends: true,
        test: {
          exclude: ['**/node_modules/**', REACT_18_TEST],
          include: [TESTS],
          name: 'react-19',
        },
      },
      {
        // The shared controls also run on React 18 (DS.5). The optimiser bundles Testing Library and
        // react-dom-18 with the aliased `react`, so there is one React in the run.
        extends: true,
        resolve: {
          alias: [
            { find: /^react$/, replacement: 'react-18' },
            { find: /^react\/(.*)$/, replacement: 'react-18/$1' },
            { find: /^react-dom$/, replacement: 'react-dom-18' },
            { find: /^react-dom\/(.*)$/, replacement: 'react-dom-18/$1' },
          ],
        },
        test: {
          deps: {
            optimizer: {
              client: {
                enabled: true,
                include: [
                  '@testing-library/react',
                  'react-18',
                  'react-18/jsx-dev-runtime',
                  'react-dom-18',
                  'react-dom-18/client',
                  'react-dom-18/test-utils',
                ],
                rolldownOptions: {
                  plugins: [
                    {
                      name: 'react-18',
                      resolveId: (id: string) => {
                        const swap = /^(react(?:-dom)?)(\/.*)?$/.exec(id);

                        return swap
                          ? requireHere.resolve(`${swap[1]}-18${swap[2] ?? ''}`)
                          : null;
                      },
                    },
                  ],
                },
              },
            },
          },
          include: [REACT_18_TEST],
          name: 'react-18',
        },
      },
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
