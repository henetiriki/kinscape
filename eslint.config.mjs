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
      '@typescript-eslint/no-unused-vars': 'error',
      'import/no-default-export': 'error',
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
    // Next.js and tool config loaders require a default export here.
    files: [
      'app/**/{page,layout,loading,error,global-error,not-found,template,default}.tsx',
      'app/**/{robots,sitemap,manifest}.ts',
      'app/**/{icon,apple-icon,opengraph-image,twitter-image}.tsx',
      '*.config.{ts,mts,mjs}',
    ],
    rules: { 'import/no-default-export': 'off' },
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
