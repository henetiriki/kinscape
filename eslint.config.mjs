import stylistic from '@stylistic/eslint-plugin';
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import packageJson from 'eslint-plugin-package-json';
import perfectionist from 'eslint-plugin-perfectionist';
import { defineConfig, globalIgnores } from 'eslint/config';

import { plugin as layers } from './scripts/layers.mts';
import { NODE_MESSAGE, nodeLoadedFiles } from './scripts/node-loaded.mts';

const RELATIVE = {
  message:
    'Import by full path through @ks/, as in @ks/app/components/<folder>/<Name>.',
  regex: String.raw`^\.{1,2}/`,
};

const ARROW_FUNCTIONS = [
  {
    message: 'Use an arrow function assigned to a const.',
    selector: 'FunctionDeclaration',
  },
  {
    message: 'Use an arrow function.',
    selector: 'FunctionExpression',
  },
];

// A skip, focus or placeholder needs an `eslint-disable-next-line` with its reason, so review sees it.
const TEST_MODIFIERS = [
  {
    message:
      'Don’t commit a skipped, focused or unfinished test (plans/README.md rule 10).',
    selector:
      'MemberExpression[property.name=/^(only|skip|skipIf|runIf|todo|fixme|fail|fails)$/]:matches([object.name=/^(describe|it|suite|test)$/], [object.property.name=/^(describe|concurrent|sequential|shuffle|serial|parallel|step)$/])',
  },
  {
    message:
      'Don’t commit a skipped, focused or unfinished test (plans/README.md rule 10).',
    selector:
      'CallExpression:matches([callee.name=/^(describe|it|suite|test)$/], [callee.object.name=/^(describe|it|suite|test)$/], [callee.object.object.name=/^(describe|it|suite|test)$/], [callee.callee.object.name=/^(describe|it|suite|test)$/], [callee.callee.object.object.name=/^(describe|it|suite|test)$/]) > ObjectExpression > Property[key.name=/^(only|skip|todo|fails)$/]',
  },
];

export default defineConfig([
  globalIgnores([
    '.claude-pr/**',
    '.claude/worktrees/**',
    '.next/**',
    'coverage/**',
    'design/canvas/**/canvas.json',
    'node_modules/**',
    'next-env.d.ts',
    'playwright-report/**',
    'test-results/**',
  ]),
  ...coreWebVitals,
  ...typescript,
  perfectionist.configs['recommended-alphabetical'],
  {
    rules: {
      'perfectionist/sort-imports': [
        'error',
        {
          // A module's own stylesheet loads after the ones of what it imports, and the kit's
          // `kit.module.css` before a board's, so a later rule keeps winning the cascade.
          customGroups: [
            {
              elementNamePattern: String.raw`design-kit/kit\.module\.css$`,
              groupName: 'kit-style',
            },
          ],
          groups: [
            'type-import',
            ['value-builtin', 'value-external'],
            'type-internal',
            'value-internal',
            ['type-parent', 'type-sibling', 'type-index'],
            ['value-parent', 'value-sibling', 'value-index'],
            'kit-style',
            'style',
            'ts-equals-import',
            'unknown',
          ],
          internalPattern: ['^~/.+', '^@ks/.+'],
        },
      ],
    },
  },
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
      'prefer-arrow-callback': 'error',
    },
  },
  {
    files: ['**/*.{js,jsx,mjs,mts,ts,tsx}'],
    ignores: ['**/types.ts', 'types/*.d.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...ARROW_FUNCTIONS,
        ...TEST_MODIFIERS,
        {
          message: 'Export types from the folder’s types.ts.',
          selector: 'ExportNamedDeclaration > TSTypeAliasDeclaration',
        },
        {
          message: 'Export types from the folder’s types.ts.',
          selector: 'ExportNamedDeclaration > TSInterfaceDeclaration',
        },
      ],
    },
  },
  {
    files: ['**/types.ts', 'types/*.d.ts'],
    rules: { 'no-restricted-syntax': ['error', ...ARROW_FUNCTIONS] },
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
    // Import by full path, so a move can't leave a stale relative one. Each block replaces
    // the rule's options, so each lists every pattern that applies to its files.
    files: ['**/*.{js,jsx,mjs,mts,ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [RELATIVE] }] },
  },
  {
    // The layer map in docs/architecture.md, read from scripts/layers.mts.
    files: [
      'app/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}',
      'design/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}',
      'lib/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}',
      'features/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}',
      'server/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}',
    ],
    plugins: { layers },
    rules: { 'layers/imports': 'error' },
  },
  {
    // Node loads these files without aliases, so they import relatively.
    files: nodeLoadedFiles(),
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: nodeLoadedFiles(),
    ignores: ['**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              allowTypeImports: true,
              group: ['@ks/**'],
              message: NODE_MESSAGE,
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
