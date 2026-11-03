import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Providers stay behind ports: Supabase is named in a few files only, data goes
// through Kysely over pg, and migrations are plain Postgres (C557).
const NAMED_DIRS = /^(?:app|features|lib|server|scripts)\//;
const TEST_FILE = /(?:^|\/)__tests__\/|\.(?:test|spec)\./;
const ALLOWED =
  /^(?:server\/auth\/supabase-[^/]*\.mts|server\/adapters\.mts|server\/env\.mts|scripts\/account-add\.mts)$/;
const CODE = /\.(?:[cm]?[jt]sx?)$/;
const MIGRATION = /^server\/db\/migrations\/.*\.sql$/;
const SELF = 'scripts/__tests__/providers.test.ts';
const PACKAGE_IMPORTS = [
  /\bfrom\s+['"]@supabase\//,
  /\b(?:import|require)\s*\(\s*['"]@supabase\//,
  /^\s*import\s+['"]@supabase\//m,
];

/** Each `file: rule` line where a provider leaks out of its port. */
const violations = (files: Record<string, string>): string[] =>
  Object.entries(files).flatMap(([path, source]) => {
    const found: string[] = [];

    if (
      NAMED_DIRS.test(path) &&
      !TEST_FILE.test(path) &&
      !ALLOWED.test(path) &&
      /supabase/i.test(source)
    ) {
      found.push(`${path}: names Supabase outside its allowlisted files`);
    }

    if (
      path !== SELF &&
      CODE.test(path) &&
      PACKAGE_IMPORTS.some(pattern => pattern.test(source))
    ) {
      found.push(`${path}: imports @supabase/*`);
    }

    if (
      MIGRATION.test(path) &&
      /\b(?:auth|storage)\.|create\s+policy/i.test(source)
    ) {
      found.push(`${path}: migration uses auth., storage. or create policy`);
    }

    return found;
  });

const tracked = (): Record<string, string> =>
  Object.fromEntries(
    execFileSync('git', ['ls-files'], { encoding: 'utf8' })
      .split('\n')
      .filter(path => path !== '' && (CODE.test(path) || MIGRATION.test(path)))
      .map(path => [path, readFileSync(path, 'utf8')])
  );

describe('the tracked files', () => {
  it('keep providers behind their ports', () => {
    const files = tracked();

    expect(Object.keys(files)).toEqual(
      expect.arrayContaining([
        'server/adapters.mts',
        'server/db/migrations/0001_accounts_and_trees.sql',
      ])
    );
    expect(violations(files)).toEqual([]);
  });
});

describe('violations', () => {
  it.each([
    [
      'a name in server/trees',
      'server/trees/repository.mts',
      "const x = 'supabase';",
    ],
    ['a name in any case', 'lib/a.mts', 'const x = "SupaBase";'],
    ['a name in a script', 'scripts/a.mts', '// Supabase'],
  ])('flags %s', (_name, path, source) => {
    expect(violations({ [path]: source })).toEqual([
      `${path}: names Supabase outside its allowlisted files`,
    ]);
  });

  it.each([
    [
      'a from import',
      'e2e/a.mts',
      "import { c } from '@supabase/supabase-js';",
    ],
    ['a dynamic import', 'tests/a.ts', "await import('@supabase/ssr');"],
    ['a require', 'e2e/a.ts', "require('@supabase/ssr');"],
    ['a side-effect import', 'e2e/a.ts', "import '@supabase/supabase-js';"],
  ])('flags %s of a package', (_name, path, source) => {
    expect(violations({ [path]: source })).toEqual([
      `${path}: imports @supabase/*`,
    ]);
  });

  it.each([
    ['create policy', 'create  POLICY p on t;'],
    ['auth.', 'select auth.uid();'],
    ['storage.', 'insert into storage.objects values (1);'],
  ])('flags a migration using %s', (_name, source) => {
    expect(violations({ 'server/db/migrations/0002_x.sql': source })).toEqual([
      'server/db/migrations/0002_x.sql: migration uses auth., storage. or create policy',
    ]);
  });

  it('allows the named files, tests and other directories', () => {
    expect(
      violations({
        'docs/requirements.md': 'Supabase',
        'playwright.config.ts': 'supabase',
        'scripts/account-add.mts': 'supabase',
        'server/__tests__/adapters.test.ts': 'supabase',
        'server/adapters.mts': "const issuer = 'supabase';",
        'server/auth/supabase-session.mts': 'supabase',
        'server/db/migrations/0001_x.sql': 'create table author (id int);',
        'server/env.mts': 'SUPABASE_URL',
      })
    ).toEqual([]);
  });

  it('skips its own fixtures', () => {
    expect(violations({ [SELF]: "import '@supabase/supabase-js';" })).toEqual(
      []
    );
  });
});
