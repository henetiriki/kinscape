import stylistic from '@stylistic/eslint-plugin';
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import packageJson from 'eslint-plugin-package-json';
import perfectionist from 'eslint-plugin-perfectionist';
import { defineConfig, globalIgnores } from 'eslint/config';

import { plugin as layers } from '#ks/scripts/layers.mts';
import {
  ADAPTERS_PATTERN,
  APP_SERVER_PATTERN,
  plugin as safety,
  TOP_LEVEL,
} from '#ks/scripts/safety.mts';

const RELATIVE = String.raw`^\.{1,2}/`;
const TS_FILE = String.raw`\.tsx?$`;
const NODE_ALIAS_PATTERNS = [
  {
    message:
      'Import by full path through #ks/, as in #ks/lib/domain/<folder>/<name>.mts.',
    regex: RELATIVE,
  },
  {
    message:
      'Node loads this file and ignores tsconfig paths: use #ks/, not @ks/.',
    regex: String.raw`^@ks/`,
  },
];
const MTS_TS_PATTERN = {
  allowTypeImports: true,
  message:
    'Node can’t run .ts or .tsx files: move the shared code to a .mts file, or use import type.',
  regex: TS_FILE,
};
const TS_ALIAS_PATTERNS = [
  {
    message:
      'Import by full path through @ks/, as in @ks/app/components/<folder>/<Name>.',
    regex: RELATIVE,
  },
  {
    message: 'Use @ks/ in this file; #ks/ is for .mts and .mjs.',
    regex: String.raw`^#ks/`,
  },
];

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
      'Don’t commit a skipped, focused or unfinished test (plans/README.md, failing-tests rule).',
    selector:
      'MemberExpression[property.name=/^(only|skip|skipIf|runIf|todo|fixme|fail|fails)$/]:matches([object.name=/^(describe|it|suite|test)$/], [object.property.name=/^(describe|concurrent|sequential|shuffle|serial|parallel|step)$/])',
  },
  {
    message:
      'Don’t commit a skipped, focused or unfinished test (plans/README.md, failing-tests rule).',
    selector:
      'CallExpression:matches([callee.name=/^(describe|it|suite|test)$/], [callee.object.name=/^(describe|it|suite|test)$/], [callee.object.object.name=/^(describe|it|suite|test)$/], [callee.callee.object.name=/^(describe|it|suite|test)$/], [callee.callee.object.object.name=/^(describe|it|suite|test)$/]) > ObjectExpression > Property[key.name=/^(only|skip|todo|fails)$/]',
  },
];

const TYPE_EXPORTS = [
  {
    message: 'Export types from the folder’s types.ts.',
    selector: 'ExportNamedDeclaration > TSTypeAliasDeclaration',
  },
  {
    message: 'Export types from the folder’s types.ts.',
    selector: 'ExportNamedDeclaration > TSInterfaceDeclaration',
  },
];

// Each block replaces the options of `no-restricted-syntax`, so each lists BASE_SYNTAX again.
const BASE_SYNTAX = [...ARROW_FUNCTIONS, ...TEST_MODIFIERS, ...TYPE_EXPORTS];

// The `KINSCAPE_` rows that docs/infrastructure.md marks "Test-only"; a test keeps the two in step.
export const TEST_ONLY_VARIABLES = [
  'KINSCAPE_DATABASE_CA_FILE',
  'KINSCAPE_DEV_PAGES',
  'KINSCAPE_MEMORY_ADAPTERS',
  'KINSCAPE_MEMORY_SIGN_IN',
  'KINSCAPE_TEST_DATABASE_URL',
];

// A read of a `KINSCAPE_` variable from `process.env`: a member, a computed string or a destructured
// key. `allowed` names the variables that the rule does not report.
const envReads = (allowed = []) => {
  const env = "[object.object.name='process'][object.property.name='env']";
  const named = path =>
    `[${path}=/^KINSCAPE_/]${allowed.length > 0 ? `:not([${path}=/^(${allowed.join('|')})$/])` : ''}`;

  return [
    {
      message:
        'Read a KINSCAPE_ variable only in server/env.mts. To pass the environment, give process.env to parseEnv, parseCaFile or devPagesVisible.',
      selector: [
        `MemberExpression[computed=false]${env}${named('property.name')}`,
        `MemberExpression[computed=true]${env}${named('property.value')}`,
        `MemberExpression[computed=true]${env}[property.expressions.length=0]${named('property.quasis.0.value.cooked')}`,
        `VariableDeclarator[init.object.name='process'][init.property.name='env'] > ObjectPattern > Property[computed=false]${named('key.name')}`,
        `VariableDeclarator[init.object.name='process'][init.property.name='env'] > ObjectPattern > Property${named('key.value')}`,
      ].join(', '),
    },
  ];
};

// design/DESIGN.md#in-the-repo: a page composes components. A Page under app/screens/ is exempt.
const PAGE_LOOK = [
  {
    message:
      'A page composes components and has no look of its own (design/DESIGN.md#in-the-repo). Move the part into a component.',
    selector:
      'JSXAttribute[name.name=/^(className|style)$/], ImportDeclaration[source.value=/\\.css$/]',
  },
];

export default defineConfig([
  globalIgnores([
    '.claude-pr/**',
    '.claude/worktrees/**',
    '.design-system/**',
    '.next/**',
    'coverage/**',
    'design/canvas/project/**',
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
          // A module's own stylesheet loads after the stylesheets of its imports, so its rules win
          // the cascade.
          groups: [
            'type-import',
            ['value-builtin', 'value-external'],
            'type-internal',
            'value-internal',
            ['type-parent', 'type-sibling', 'type-index'],
            ['value-parent', 'value-sibling', 'value-index'],
            'style',
            'ts-equals-import',
            'unknown',
          ],
          internalPattern: ['^~/.+', '^@ks/.+', '^#ks/.+'],
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
      'no-restricted-syntax': ['error', ...BASE_SYNTAX, ...envReads()],
    },
  },
  {
    files: ['**/types.ts', 'types/*.d.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...ARROW_FUNCTIONS, ...envReads()],
    },
  },
  {
    // The page rule of design/DESIGN.md#in-the-repo.
    files: ['app/**/page.tsx'],
    ignores: ['app/screens/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_SYNTAX,
        ...envReads(),
        ...PAGE_LOOK,
      ],
    },
  },
  {
    // Only server/env.mts reads a KINSCAPE_ variable; test code reads the Test-only ones.
    files: ['server/env.mts'],
    rules: { 'no-restricted-syntax': ['error', ...BASE_SYNTAX] },
  },
  {
    files: [
      '**/__tests__/**',
      'e2e/**',
      'playwright.config.ts',
      'vitest.config.mts',
    ],
    ignores: ['**/types.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_SYNTAX,
        ...envReads(TEST_ONLY_VARIABLES),
      ],
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
      'e2e/*.config.ts',
      'e2e/design-reporter.ts',
      'types/*.d.ts',
    ],
    rules: { 'import/no-default-export': 'off' },
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
    // Import by full path, so a move can't leave a stale relative one. Node resolves `#ks/` and
    // ignores tsconfig `paths`; the bundlers and TypeScript resolve `@ks/`. Each block replaces
    // the rule's options, so each lists every pattern that applies to its files.
    files: ['**/*.mts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [...NODE_ALIAS_PATTERNS, MTS_TS_PATTERN] },
      ],
    },
  },
  {
    // Node parses .mjs as plain JavaScript, so even `import type` is a syntax error there.
    files: ['**/*.mjs'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...NODE_ALIAS_PATTERNS,
            {
              message:
                'Node can’t run .ts or .tsx files: move the shared code to a .mts file.',
              regex: TS_FILE,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: TS_ALIAS_PATTERNS }],
    },
  },
  {
    // The scoping rule of docs/architecture.md › Patterns, from scripts/safety.mts: app/ and
    // features/ and lib/ take values from server/ only through its entry points; appAdapters
    // stays in the files that open a Tree. Tests are outside the rule; the kit is below server/ already.
    files: [
      'app/**/*.{js,jsx,ts,tsx}',
      'features/**/*.{js,jsx,ts,tsx}',
      'lib/**/*.{js,jsx,ts,tsx}',
    ],
    ignores: ['**/__tests__/**', 'app/components/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [...TS_ALIAS_PATTERNS, APP_SERVER_PATTERN] },
      ],
    },
  },
  {
    files: ['server/**/*.mts'],
    ignores: [
      '**/__tests__/**',
      'server/action.mts',
      'server/auth/current.mts',
      'server/trees/**',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [...NODE_ALIAS_PATTERNS, MTS_TS_PATTERN, ADAPTERS_PATTERN],
        },
      ],
    },
  },
  {
    files: ['server/**/*.{js,jsx,ts,tsx}', ...TOP_LEVEL],
    ignores: ['**/__tests__/**', 'server/trees/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [...TS_ALIAS_PATTERNS, ADAPTERS_PATTERN] },
      ],
    },
  },
  {
    // The boundary rule: a 'use client' file imports no value from server/.
    files: [
      'app/**/*.{js,jsx,ts,tsx}',
      'features/**/*.{js,jsx,ts,tsx}',
      'lib/**/*.{js,jsx,ts,tsx}',
    ],
    plugins: { safety },
    rules: { 'safety/client-imports': 'error' },
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
