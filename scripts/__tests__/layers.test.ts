import { RuleTester } from 'eslint';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { sep } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import {
  ALLOWLIST,
  covers,
  importsRule,
  layerBreak,
  layerOf,
  listed,
} from '../layers.mts';

// NFR-09. Same file types as the lint rule's globs in eslint.config.mjs.
const ROOTS = ['app', 'lib', 'features', 'server'];
const SOURCE = /\.(?:tsx?|mts)$/;

/** The specifiers a source imports, re-exports or dynamically imports, read from the syntax tree. */
const specifiersOf = (path: string, source: string): string[] => {
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    const target =
      ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
        ? node.moduleSpecifier
        : ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword
          ? node.arguments[0]
          : undefined;

    if (target !== undefined && ts.isStringLiteralLike(target)) {
      found.push(target.text);
    }

    ts.forEachChild(node, visit);
  };

  visit(ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true));

  return found;
};

/** Each `file: message` break in the sources, minus those the allowlist lists. */
const problems = (
  files: Record<string, string>,
  allowlist: Record<string, string>
): string[] => {
  const broken = Object.entries(files).flatMap(([path, source]) =>
    specifiersOf(path, source).flatMap(specifier => {
      const message = layerBreak(path, specifier);

      return message === undefined ? [] : [{ message, path, specifier }];
    })
  );
  const unlisted = broken
    .filter(({ path, specifier }) => !listed(path, specifier, allowlist))
    .map(({ message, path }) => `${path}: ${message}`);
  const stale = Object.keys(allowlist)
    .filter(
      entry =>
        !broken.some(
          ({ path, specifier }) =>
            covers(entry, path) && listed(path, specifier, allowlist)
        )
    )
    .map(entry => `${entry}: no longer breaks a layer rule; delete the entry.`);

  return [...unlisted, ...stale];
};

const sources = (): Record<string, string> =>
  Object.fromEntries(
    ROOTS.filter(dir => existsSync(dir)).flatMap(dir =>
      readdirSync(dir, { recursive: true })
        .map(name => `${dir}/${String(name).split(sep).join('/')}`)
        .filter(path => SOURCE.test(path))
        .map(path => [path, readFileSync(path, 'utf8')])
    )
  );

describe('the repo', () => {
  it('breaks exactly the layer rules on the allowlist', () => {
    const files = sources();

    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(['app/layout.tsx', 'lib/map/style.ts'])
    );
    expect(problems(files, ALLOWLIST)).toEqual([]);
  });
});

describe('problems', () => {
  const kit = {
    'app/components/forms/X.tsx': "import { a } from '@/lib/map/a';",
  };

  it('names a new break that is not on the allowlist', () => {
    expect(problems(kit, {})).toEqual([
      'app/components/forms/X.tsx: Layer rule: app/components may not import lib/domain.',
    ]);
  });

  it('passes a listed break', () => {
    expect(problems(kit, { 'app/components/forms': 'features/map' })).toEqual(
      []
    );
  });

  it('names a new break inside a listed path', () => {
    expect(
      problems(
        {
          'app/components/map/X.tsx':
            "import { a } from '@/lib/map/a';\nimport { b } from '@/features/pins/b';",
        },
        { 'app/components/map': 'features/map' }
      )
    ).toEqual([
      'app/components/map/X.tsx: Layer rule: app/components may not import features/pins.',
    ]);
  });

  it('reads imports from the syntax, not the text', () => {
    expect(
      problems(
        {
          'app/components/forms/X.tsx': [
            "// import { a } from '@/lib/map/a';",
            'const s = "import { a } from \'@/lib/map/a\'";',
            'import {',
            '  a,',
            "} from '@/server/db';",
            'const c = import(`@/lib/map/c`);',
          ].join('\n'),
        },
        {}
      )
    ).toEqual([
      'app/components/forms/X.tsx: Layer rule: app/components may not import server.',
      'app/components/forms/X.tsx: Layer rule: app/components may not import lib/domain.',
    ]);
  });

  it('tells you to delete a listed break that is fixed', () => {
    expect(
      problems(
        { 'app/components/forms/X.tsx': "import { a } from './Y';" },
        { 'app/components/forms/X.tsx': 'features/map' }
      )
    ).toEqual([
      'app/components/forms/X.tsx: no longer breaks a layer rule; delete the entry.',
    ]);
  });
});

describe('layerOf', () => {
  it.each([
    ['design/tokens.json', 'design'],
    ['lib/design/tokens.mts', 'design'],
    ['lib/map/style.ts', 'domain'],
    ['server/db.ts', 'server'],
    ['app/components/forms/X.tsx', 'kit'],
    ['features/map/A.tsx', 'features/map'],
    ['app/page.tsx', 'routes'],
    ['lib/design/tokens', 'design'],
    ['server', 'server'],
    ['features', undefined],
    ['lib/design/check.mts', undefined],
    ['app/design-kit/page.tsx', undefined],
    ['app/__tests__/page.test.tsx', undefined],
    ['scripts/a.mts', undefined],
  ])('puts %s in %s', (path, layer) => {
    expect(layerOf(path)).toBe(layer);
  });
});

describe('layerBreak', () => {
  it.each([
    [
      'design',
      'design/a.ts',
      '@/lib/map/a',
      'design may not import lib/domain',
    ],
    [
      'lib/domain',
      'lib/map/a.ts',
      '@/server/db',
      'lib/domain may not import server',
    ],
    [
      'lib/domain',
      'lib/map/a.ts',
      'node:fs',
      'lib/domain may not import node:fs',
    ],
    [
      'lib/domain',
      'lib/map/a.ts',
      'maplibre-gl',
      'lib/domain may not import maplibre-gl',
    ],
    ['lib/domain', 'lib/map/a.ts', 'fs', 'lib/domain may not import fs'],
    [
      'lib/domain',
      'lib/map/a.ts',
      'fs/promises',
      'lib/domain may not import fs/promises',
    ],
    [
      'app/components',
      'app/components/forms/X.tsx',
      '@/server',
      'app/components may not import server',
    ],
    [
      'app/components',
      'app/components/forms/X.tsx',
      '@/lib',
      'app/components may not import lib/domain',
    ],
    [
      'lib/domain',
      'lib/map/a.ts',
      '@/lib/design/tokens',
      'lib/domain may not import design',
    ],
    [
      'lib/domain',
      'lib/map/a.ts',
      '@/scripts/layers.mts',
      'lib/domain may not import dev-only code',
    ],
    [
      'app/ routes',
      'app/page.tsx',
      '@/e2e/a',
      'routes may not import dev-only code',
    ],
    [
      'app/ routes',
      'app/page.tsx',
      '@/app/design-kit/a',
      'may not import dev-only code',
    ],
    [
      'lib/domain',
      'lib/map/a.ts',
      '@/lib/design/check.mts',
      'may not import dev-only code',
    ],
    [
      'lib/domain',
      'lib/map/a.ts',
      '@/lib/map/__tests__/a',
      'may not import dev-only code',
    ],
    [
      'server',
      'server/a.ts',
      '@/features/map/a',
      'server may not import features/map',
    ],
    [
      'app/components',
      'app/components/forms/X.tsx',
      '@/lib/map/a',
      'app/components may not import lib/domain',
    ],
    [
      'features',
      'features/map/a.ts',
      '@/features/pins/a',
      'features never import each other',
    ],
    [
      'features',
      'features/map/a.ts',
      '@/app/page',
      'features/map may not import routes',
    ],
  ])('fires in %s', (_layer, file, specifier, text) => {
    expect(layerBreak(file, specifier)).toContain(text);
  });

  it.each([
    ['design', 'design/a.ts', './b'],
    ['lib/domain', 'lib/map/a.ts', '../boundaries/model.mts'],
    ['lib/domain', 'lib/map/a.ts', 'react'],
    ['server', 'server/a.ts', '@/lib/map/a'],
    ['app/components', 'app/components/forms/X.tsx', '@/design/tokens.json'],
    [
      'app/components',
      'app/components/forms/X.tsx',
      '@/app/components/foundation/Text',
    ],
    ['features', 'features/map/a.ts', '@/server/db'],
    ['features', 'features/map/a.ts', '@/app/components/forms/X'],
    ['features', 'features/map/a.ts', './b'],
    ['app/ routes', 'app/page.tsx', '@/features/map/a'],
    ['app/ routes', 'app/page.tsx', '@/lib/boundaries/app-data'],
    ['a test file', 'lib/__tests__/a.test.ts', '@/server/db'],
    ['a path outside the repo', 'lib/map/a.ts', '../../../x'],
    ['a path outside the map', 'lib/map/a.ts', '@/types/modules'],
  ])('passes in %s', (_layer, file, specifier) => {
    expect(layerBreak(file, specifier)).toBeUndefined();
  });
});

describe('the lint rule', () => {
  const tester = new RuleTester({
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  });

  it('reports each kind of import, and passes the rest', () => {
    tester.run('layers/imports', importsRule as never, {
      invalid: [
        {
          code: "import { a } from '@/lib/map/a';",
          errors: [{ message: /app\/components may not import lib\/domain/ }],
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: "export { a } from '@/lib/map/a';",
          errors: 1,
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: "export * from '@/lib/map/a';",
          errors: 1,
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: "const a = import('@/lib/map/a');",
          errors: 1,
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: 'const a = import(`@/lib/map/a`);',
          errors: 1,
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
      ],
      valid: [
        {
          code: 'const a = import(`@/lib/${name}`);',
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: "import { a } from '@/app/components/foundation/Text';",
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: "import { a } from '@/lib/map/a';",
          filename: `${process.cwd()}/app/components/map/X.tsx`,
        },
        {
          code: 'const a = import(name); export const b = 1; export {};',
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
      ],
    });
  });
});
