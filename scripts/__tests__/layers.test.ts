import { RuleTester } from 'eslint';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { sep } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import {
  fileBreak,
  importsRule,
  isBuiltin,
  layerBreak,
  layerOf,
  MODULE_CALL,
  SOURCE_EXTENSION,
  targetOf,
} from '../layers.mts';

// NFR-09. The same file types as the lint rule's globs in eslint.config.mjs.
const ROOTS = ['app', 'design', 'lib', 'features', 'server'];

/** The module a node names, if it is an import, re-export, `import()`, `import('…').T`, `import x = require()`, `require()` or `vi.mock()`. */
const moduleOf = (node: ts.Node): ts.Node | undefined => {
  if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
    return node.moduleSpecifier;
  }

  if (ts.isCallExpression(node)) {
    return node.expression.kind === ts.SyntaxKind.ImportKeyword ||
      MODULE_CALL.test(node.expression.getText())
      ? node.arguments[0]
      : undefined;
  }

  if (ts.isImportTypeNode(node)) {
    return ts.isLiteralTypeNode(node.argument)
      ? node.argument.literal
      : undefined;
  }

  return ts.isImportEqualsDeclaration(node) &&
    ts.isExternalModuleReference(node.moduleReference)
    ? node.moduleReference.expression
    : undefined;
};

/** The specifiers a source names, read from the syntax tree. */
const specifiersOf = (path: string, source: string): string[] => {
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    const target = moduleOf(node);

    if (target !== undefined && ts.isStringLiteralLike(target)) {
      found.push(target.text);
    }

    ts.forEachChild(node, visit);
  };

  visit(ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true));

  return found;
};

/** Each `file: message` break in the sources. */
const problems = (files: Record<string, string>): string[] => {
  const broken = Object.entries(files).flatMap(([path, source]) =>
    specifiersOf(path, source).flatMap(specifier => {
      const message = layerBreak(path, specifier);

      return message === undefined ? [] : [`${path}: ${message}`];
    })
  );
  const misplaced = Object.keys(files).flatMap(path => {
    const message = fileBreak(path);

    return message === undefined ? [] : [`${path}: ${message}`];
  });

  return [...misplaced, ...broken];
};

const sources = (): Record<string, string> =>
  Object.fromEntries(
    ROOTS.filter(dir => existsSync(dir)).flatMap(dir =>
      readdirSync(dir, { recursive: true })
        .map(name => `${dir}/${String(name).split(sep).join('/')}`)
        .filter(path => SOURCE_EXTENSION.test(path))
        .map(path => [path, readFileSync(path, 'utf8')])
    )
  );

describe('the repo', () => {
  it('breaks no layer rule', () => {
    const files = sources();

    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(['app/layout.tsx', 'features/map/style.ts'])
    );
    expect(problems(files)).toEqual([]);
  });
});

describe('problems', () => {
  const kit = {
    'app/components/forms/X.tsx': "import { a } from '@ks/lib/domain/a';",
  };

  it('names a break', () => {
    expect(problems(kit)).toEqual([
      'app/components/forms/X.tsx: Layer rule: app/components may not import lib/domain.',
    ]);
  });

  it('reads imports from the syntax, not the text', () => {
    expect(
      problems({
        'app/components/forms/X.tsx': [
          "// import { a } from '@ks/lib/domain/a';",
          'const s = "import { a } from \'@ks/lib/domain/a\'";',
          'import {',
          '  a,',
          "} from '@ks/server/db';",
          'const c = import(`@ks/lib/domain/c`);',
        ].join('\n'),
      })
    ).toEqual([
      'app/components/forms/X.tsx: Layer rule: app/components may not import server.',
      'app/components/forms/X.tsx: Layer rule: app/components may not import lib/domain.',
    ]);
  });

  it.each([
    ['import(…).T', "export type R = import('@ks/server/db').Row;"],
    ['typeof import(…)', "export type R = typeof import('@ks/server/db');"],
    ['import x = require(…)', "import x = require('@ks/server/db');"],
    ['require()', "const x = require('@ks/server/db');"],
    ['vi.mock()', "vi.mock('@ks/server/db');"],
  ])('finds %s', (_form, source) => {
    expect(problems({ 'app/components/forms/X.tsx': source })).toEqual([
      'app/components/forms/X.tsx: Layer rule: app/components may not import server.',
    ]);
  });

  it('ignores calls and type imports that name no module', () => {
    expect(
      problems({
        'app/components/forms/X.tsx': [
          'import Y = Z.Y;',
          "type T = import('@ks/design/tokens.json').T;",
          'type U = typeof import(name);',
          'const a = require();',
          'const b = other();',
        ].join('\n'),
      })
    ).toEqual([]);
  });

  it('names a file directly in features/', () => {
    expect(problems({ 'features/index.ts': 'export {};' })).toEqual([
      'features/index.ts: Layer rule: features/ holds only feature folders.',
    ]);
  });

  it('names a lib/ui file that imports the kit', () => {
    expect(
      problems({
        'lib/ui/X.tsx':
          "import { Text } from '@ks/app/components/foundation/Text';",
      })
    ).toEqual([
      'lib/ui/X.tsx: Layer rule: lib/ui may not import app/components.',
    ]);
  });
});

describe('fileBreak', () => {
  it.each(['features/index.ts', 'features/types.mts'])('fires on %s', file => {
    expect(fileBreak(file)).toBe(
      'Layer rule: features/ holds only feature folders.'
    );
  });

  it.each([
    'features/map/A.tsx',
    'features/map.test.ts',
    'features/__tests__/a.ts',
    'lib/domain/a.ts',
  ])('passes %s', file => {
    expect(fileBreak(file)).toBeUndefined();
  });
});

describe('isBuiltin', () => {
  it.each(['node:fs', 'fs', 'fs/promises', 'events', 'util'])(
    'is true for %s',
    specifier => {
      expect(isBuiltin(specifier)).toBe(true);
    }
  );

  it.each(['react', 'maplibre-gl', 'fs-extra', 'next/image'])(
    'is false for %s',
    specifier => {
      expect(isBuiltin(specifier)).toBe(false);
    }
  );

  it('is false for a built-in name that package.json lists', () => {
    expect(isBuiltin('events', ['events'])).toBe(false);
    expect(isBuiltin('events/index.js', ['events'])).toBe(false);
    expect(isBuiltin('fs/promises', ['fs'])).toBe(false);
  });

  it('is still true for node: and for other built-ins when package.json lists a package', () => {
    expect(isBuiltin('node:events', ['events'])).toBe(true);
    expect(isBuiltin('util', ['events'])).toBe(true);
  });
});

describe('layerOf', () => {
  it.each([
    ['design/tokens.json', 'design'],
    ['design/tokens.mts', 'design'],
    ['lib/design/tokens.mts', undefined],
    ['lib/domain/map/map-date.ts', 'domain'],
    ['lib/domain/boundaries/model.mts', 'domain'],
    ['lib/domain', 'domain'],
    ['lib/ui/EventGlyph.tsx', 'ui'],
    ['lib/ui', 'ui'],
    ['lib/uikit/a.ts', undefined],
    ['lib/other/a.ts', undefined],
    ['lib/mapping/a.ts', undefined],
    ['server/db.ts', 'server'],
    ['app/components/forms/X.tsx', 'kit'],
    ['features/map/A.tsx', 'features/map'],
    ['app/page.tsx', 'routes'],
    ['lib/design/tokens', undefined],
    ['server', 'server'],
    ['features', undefined],
    ['lib/design/check.mts', undefined],
    ['app/design-kit/page.tsx', undefined],
    ['app/__tests__/page.test.tsx', undefined],
    ['lib/ui/__tests__/a.test.ts', undefined],
    ['scripts/a.mts', undefined],
  ])('puts %s in %s', (path, layer) => {
    expect(layerOf(path)).toBe(layer);
  });
});

describe('targetOf', () => {
  it('reads @ks/ and relative specifiers as repo paths', () => {
    expect(targetOf('lib/domain/a.ts', '@ks/server/db')).toBe('server/db');
    expect(targetOf('lib/domain/a.ts', './b')).toBe('lib/domain/b');
  });

  it('is undefined for a package, a path above the root and the retired @/ alias', () => {
    expect(targetOf('lib/domain/a.ts', 'react')).toBeUndefined();
    expect(targetOf('lib/domain/a.ts', '../../../x')).toBeUndefined();
    expect(targetOf('lib/domain/a.ts', `@/server/db`)).toBeUndefined();
  });
});

describe('layerBreak', () => {
  it.each([
    [
      'design',
      'design/a.ts',
      '@ks/lib/domain/a',
      'design may not import lib/domain',
    ],
    [
      'design importing lib/ui',
      'design/a.ts',
      '@ks/lib/ui/types',
      'design may not import lib/ui',
    ],
    [
      'lib/domain',
      'lib/domain/a.ts',
      '@ks/server/db',
      'lib/domain may not import server',
    ],
    [
      'lib/domain',
      'lib/domain/a.ts',
      'node:fs',
      'lib/domain may not import node:fs',
    ],
    [
      'lib/domain',
      'lib/domain/a.ts',
      'maplibre-gl',
      'lib/domain may not import maplibre-gl',
    ],
    ['lib/domain', 'lib/domain/a.ts', 'fs', 'lib/domain may not import fs'],
    [
      'lib/domain',
      'lib/domain/a.ts',
      'fs/promises',
      'lib/domain may not import fs/promises',
    ],
    [
      'lib/domain',
      'lib/domain/a.ts',
      'events',
      'lib/domain may not import events',
    ],
    [
      'lib/domain importing lib/ui',
      'lib/domain/a.ts',
      '@ks/lib/ui/types',
      'lib/domain may not import lib/ui',
    ],
    [
      'lib/ui importing the kit',
      'lib/ui/EventGlyph.tsx',
      '@ks/app/components/foundation/Text',
      'lib/ui may not import app/components',
    ],
    [
      'lib/ui importing lib/domain',
      'lib/ui/a.ts',
      '@ks/lib/domain/a',
      'lib/ui may not import lib/domain',
    ],
    [
      'lib/ui importing a feature',
      'lib/ui/a.ts',
      '@ks/features/map/a',
      'lib/ui may not import features/map',
    ],
    [
      'app/components',
      'app/components/forms/X.tsx',
      '@ks/server',
      'app/components may not import server',
    ],
    [
      'app/components importing a server file',
      'app/components/forms/X.tsx',
      '@ks/server/boundaries/app-data',
      'app/components may not import server',
    ],
    [
      'app/components',
      'app/components/forms/X.tsx',
      '@ks/lib/domain',
      'app/components may not import lib/domain',
    ],
    [
      'app/components',
      'app/components/forms/X.tsx',
      '@ks/design/../lib/domain/a',
      'app/components may not import lib/domain',
    ],
    [
      'lib/domain',
      'lib/domain/a.ts',
      '@ks/design/tokens.mts',
      'lib/domain may not import design',
    ],
    [
      'app/components importing the CSS half',
      'app/components/forms/X.tsx',
      '@ks/lib/design/css.mts',
      'app/components may not import dev-only code',
    ],
    [
      'lib/domain',
      'lib/domain/a.ts',
      '@ks/scripts/layers.mts',
      'lib/domain may not import dev-only code',
    ],
    [
      'app/ routes',
      'app/page.tsx',
      '@ks/e2e/a',
      'routes may not import dev-only code',
    ],
    [
      'app/ routes',
      'app/page.tsx',
      '@ks/app/design-kit/a',
      'may not import dev-only code',
    ],
    [
      'lib/domain',
      'lib/domain/a.ts',
      '@ks/lib/design/check.mts',
      'may not import dev-only code',
    ],
    [
      'lib/domain',
      'lib/domain/a.ts',
      '@ks/lib/domain/__tests__/a',
      'may not import dev-only code',
    ],
    [
      'server',
      'server/a.ts',
      '@ks/features/map/a',
      'server may not import features/map',
    ],
    [
      'app/components',
      'app/components/forms/X.tsx',
      '@ks/lib/domain/a',
      'app/components may not import lib/domain',
    ],
    [
      'features',
      'features/map/a.ts',
      '@ks/features/pins/a',
      'features never import each other',
    ],
    [
      'features',
      'features/map/a.ts',
      '@ks/app/page',
      'features/map may not import routes',
    ],
    [
      'a route importing below a feature',
      'app/page.tsx',
      '@ks/features/map/components/MapView',
      'Layer rule: import features/map through its index.ts.',
    ],
    [
      'a route importing a feature file',
      'app/page.tsx',
      '@ks/features/map/style',
      'Layer rule: import features/map through its index.ts.',
    ],
  ])('fires in %s', (_layer, file, specifier, text) => {
    expect(layerBreak(file, specifier)).toContain(text);
  });

  it.each([
    ['design', 'design/a.ts', './b'],
    ['lib/domain', 'lib/domain/a.ts', '../boundaries/model.mts'],
    ['lib/domain', 'lib/domain/a.ts', 'react'],
    ['server', 'server/a.ts', '@ks/lib/domain/a'],
    ['app/components', 'app/components/forms/X.tsx', '@ks/design/tokens.json'],
    ['app/components', 'app/components/forms/X.tsx', '@ks/design/tokens.mts'],
    [
      'app/components',
      'app/components/forms/X.tsx',
      '@ks/app/components/foundation/Text',
    ],
    [
      'app/components importing lib/ui',
      'app/components/a/X.tsx',
      '@ks/lib/ui/types',
    ],
    ['lib/ui importing design', 'lib/ui/hatch.ts', '@ks/design/tokens.json'],
    ['lib/ui importing itself', 'lib/ui/a.ts', '@ks/lib/ui/types'],
    ['features importing lib/ui', 'features/map/a.ts', '@ks/lib/ui/types'],
    ['app/ routes importing lib/ui', 'app/page.tsx', '@ks/lib/ui/types'],
    ['features', 'features/map/a.ts', '@ks/server/db'],
    ['features', 'features/map/a.ts', '@ks/app/components/forms/X'],
    ['features', 'features/map/a.ts', './b'],
    ['app/ routes', 'app/page.tsx', '@ks/features/map'],
    ['app/ routes', 'app/page.tsx', '@ks/features/map/index'],
    ['app/ routes', 'app/page.tsx', '@ks/features/map/'],
    ['app/ routes', 'app/page.tsx', '@ks/server/boundaries/app-data'],
    [
      'a feature importing its own files',
      'features/map/a.ts',
      '@ks/features/map/b',
    ],
    [
      'a feature test',
      'features/map/__tests__/a.test.ts',
      '@ks/features/map/b',
    ],
    ['a test file', 'lib/__tests__/a.test.ts', '@ks/server/db'],
    ['a path outside the repo', 'lib/domain/a.ts', '../../../x'],
    ['a path above the root', 'lib/domain/a.ts', '@ks/../x'],
    ['a path outside the map', 'lib/domain/a.ts', '@ks/types/modules'],
    ['the retired @/ alias', 'app/components/forms/X.tsx', `@/lib/domain/a`],
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
          code: "import { a } from '@ks/lib/domain/a';",
          errors: [{ message: /app\/components may not import lib\/domain/ }],
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: "export { a } from '@ks/lib/domain/a';",
          errors: 1,
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: "export * from '@ks/lib/domain/a';",
          errors: 1,
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: "const a = import('@ks/lib/domain/a');",
          errors: 1,
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: 'const a = import(`@ks/lib/domain/a`);',
          errors: 1,
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: "const a = require('@ks/lib/domain/a');",
          errors: 1,
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: "vi.mock('@ks/lib/domain/a');",
          errors: 1,
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: "import { a } from '@ks/app/components/foundation/Text';",
          errors: [{ message: /lib\/ui may not import app\/components/ }],
          filename: `${process.cwd()}/lib/ui/X.tsx`,
        },
        {
          code: 'export const a = 1;',
          errors: [{ message: /features\/ holds only feature folders/ }],
          filename: `${process.cwd()}/features/index.ts`,
        },
      ],
      valid: [
        {
          code: 'const a = require(); const b = other(); vi.spy(name);',
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: 'const a = import(`@ks/lib/${name}`);',
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: "import { a } from '@ks/app/components/foundation/Text';",
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
        {
          code: "import { a } from '@ks/lib/ui/EventGlyph';",
          filename: `${process.cwd()}/app/components/actions/X.tsx`,
        },
        {
          code: 'const a = import(name); export const b = 1; export {};',
          filename: `${process.cwd()}/app/components/forms/X.tsx`,
        },
      ],
    });
  });
});
