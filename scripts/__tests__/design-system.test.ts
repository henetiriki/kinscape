import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { SystemTokens } from '@ks/lib/design/types.ts';

import {
  bundleHeader,
  checkScript,
  checkStyle,
  checkTypes,
  CONTROLS,
} from '@ks/lib/design/bundle.mts';

import { run } from '../design-system.mts';

let first: string;
let second: string;
let written: string[];

const filesIn = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => join(entry.parentPath, entry.name).slice(dir.length + 1))
    .toSorted();

beforeAll(async () => {
  first = mkdtempSync(join(tmpdir(), 'design-system-'));
  second = mkdtempSync(join(tmpdir(), 'design-system-'));
  written = await run('.', first);
  await run('.', second);
}, 120_000);

const component = (name: string): string =>
  readFileSync(join(first, 'project/components', name), 'utf8');

afterAll(() => {
  rmSync(first, { force: true, recursive: true });
  rmSync(second, { force: true, recursive: true });
});

describe('run', () => {
  it('gives byte-identical outputs on the same commit', () => {
    const names = filesIn(first);

    expect(names).toEqual(filesIn(second));

    for (const name of names) {
      expect(
        readFileSync(join(first, name)).equals(readFileSync(join(second, name)))
      ).toBe(true);
    }
  });

  it('returns the files it wrote, all under project/ with relative paths', () => {
    expect(written.toSorted()).toEqual(filesIn(first));
    expect(
      written.filter(
        path =>
          !path.startsWith('project/') ||
          path.includes('..') ||
          path.split('/').some(part => part.startsWith('.'))
      )
    ).toEqual([]);
  });

  it('writes no manifest.json or api/', () => {
    expect(written.filter(path => /manifest\.json|\/api\//.test(path))).toEqual(
      []
    );
  });

  it('writes the index, tokens, stylesheet, README and cover', () => {
    for (const name of [
      'design-system.json',
      'tokens.json',
      'tokens.css',
      'README.md',
      'components/Cover/preview.html',
    ]) {
      expect(existsSync(join(first, 'project', name))).toBe(true);
    }

    expect(readFileSync(join(first, 'project/tokens.css'), 'utf8')).toContain(
      'unicode-range: U+0100-02BA'
    );
  });

  it('writes every font tokens.json lists, and every icon', () => {
    const tokens = JSON.parse(
      readFileSync(join(first, 'project/tokens.json'), 'utf8')
    ) as SystemTokens;
    const sources = readdirSync('design/source').filter(name =>
      /^kse-.+\.svg$/.test(name)
    );

    expect(tokens.type.fonts).toHaveLength(8);
    expect(
      tokens.type.fonts.filter(
        ({ file }) => !existsSync(join(first, 'project', file))
      )
    ).toEqual([]);
    expect(sources).toHaveLength(10);
    expect(
      sources.filter(
        name => !existsSync(join(first, 'project/assets/Icons', name))
      )
    ).toEqual([]);
    expect(
      readFileSync(join(first, 'project/assets/Logos/icon0.svg'), 'utf8')
    ).toBe(readFileSync('app/icon0.svg', 'utf8'));
  });

  it('empties the folder first', async () => {
    await run('.', first);

    expect(filesIn(first)).toEqual(written.toSorted());
  }, 60_000);
});

describe('the controls bundle', () => {
  const names = CONTROLS.map(({ name }) => name);

  it('writes the three files under components/', () => {
    expect(
      written.filter(path => /components\/(bundle|index)/.test(path)).toSorted()
    ).toEqual([
      'project/components/bundle.css',
      'project/components/bundle.js',
      'project/components/index.d.ts',
    ]);
  });

  it('starts bundle.js with the header listing the controls, and is clean', () => {
    const script = component('bundle.js');

    expect(script.split('\n')[0]).toBe(bundleHeader(names));
    expect(() => checkScript(script)).not.toThrow();
    expect(script).not.toMatch(/^import |\brequire\(/m);
  });

  it('leaves React to the page: the app React 19 is not inside', () => {
    expect(component('bundle.js')).not.toContain('react.transitional.element');
  });

  it('makes bundle.css from tokens.css, then the controls', () => {
    const css = component('bundle.css');
    const tokens = readFileSync('app/tokens.css', 'utf8');

    expect(css.startsWith(tokens)).toBe(true);
    expect(css.length).toBeGreaterThan(tokens.length);
    expect(() => checkStyle(css)).not.toThrow();
  });

  it('declares each control and exports its Props', () => {
    const types = component('index.d.ts');

    expect(() => checkTypes(types)).not.toThrow();

    for (const name of names) {
      expect(types).toContain(`export declare const ${name}:`);
      expect(types).toContain(
        `export type ${name}Props = Parameters<typeof ${name}>[0];`
      );
    }
  });

  it('exports exactly the controls as values', () => {
    const values = [
      ...component('index.d.ts').matchAll(
        /^export (?:declare )?(?:const|function|class|enum) ([\w$]+)/gm
      ),
    ].map(match => match[1]);

    expect(values.toSorted()).toEqual(names.toSorted());
    expect(component('index.d.ts')).toMatch(/^export \{\};$/m);
  });
});

describe('the output folder', () => {
  it('is ignored by git and nothing under it is tracked', () => {
    expect(
      execFileSync('git', ['check-ignore', '.design-system/project/x'], {
        encoding: 'utf8',
      }).trim()
    ).toBe('.design-system/project/x');
    expect(
      execFileSync('git', ['ls-files', '.design-system'], {
        encoding: 'utf8',
      }).trim()
    ).toBe('');
  });
});
