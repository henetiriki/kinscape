import stylistic from '@stylistic/eslint-plugin';
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import packageJson from 'eslint-plugin-package-json';
import perfectionist from 'eslint-plugin-perfectionist';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    '.claude-pr/**',
    '.claude/worktrees/**',
    '.next/**',
    'coverage/**',
    'node_modules/**',
    'next-env.d.ts',
    'playwright-report/**',
    'test-results/**',
  ]),
  ...coreWebVitals,
  ...typescript,
  perfectionist.configs['recommended-alphabetical'],
  {
    files: ['**/*.{js,jsx,mjs,mts,ts,tsx}'],
    plugins: { '@stylistic': stylistic },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', next: 'return', prev: '*' },
        { blankLine: 'always', next: '*', prev: ['const', 'let', 'var'] },
        {
          blankLine: 'any',
          next: ['const', 'let', 'var'],
          prev: ['const', 'let', 'var'],
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': 'error',
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import/no-default-export': 'error',
      'import/no-unresolved': ['error', { ignore: [String.raw`\.css$`] }],
      'no-restricted-syntax': [
        'error',
        {
          message: 'Use an arrow function assigned to a const.',
          selector: 'FunctionDeclaration',
        },
        {
          message: 'Use an arrow function.',
          selector: 'FunctionExpression',
        },
      ],
      'prefer-arrow-callback': 'error',
    },
  },
  {
    // Next.js, Playwright and tool config loaders require a default export here, and
    // type declarations mirror the default exports of the packages they describe.
    files: [
      'app/**/{page,layout,loading,error,global-error,not-found,template,default}.tsx',
      'app/**/{robots,sitemap,manifest}.ts',
      'app/**/{icon,apple-icon,opengraph-image,twitter-image}.tsx',
      '*.config.{ts,mts,mjs}',
      'e2e/design-reporter.ts',
      'types/*.d.ts',
    ],
    rules: { 'import/no-default-export': 'off' },
  },
  {
    // Import a component by its full path, so a move can't leave a stale relative one.
    files: ['app/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../**'],
              message: 'Import by full path: @/app/components/<folder>/<Name>.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['app/**/*.{ts,tsx}'],
    ignores: ['app/components/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              message: 'Import by full path: @/app/components/<folder>/<Name>.',
              regex: String.raw`^\.{1,2}/(.*/)?components/`,
            },
          ],
        },
      ],
    },
  },
  {
    ...packageJson.configs.recommended,
    files: ['package.json'],
    rules: {
      'package-json/sort-collections': ['error', ['scripts']],
    },
  },
  prettier,
]);
