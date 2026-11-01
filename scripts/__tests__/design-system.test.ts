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
import { checkPreview, checkReadme } from '@ks/lib/design/cards.mts';
import { CARDS } from '@ks/lib/design/states.mts';

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

  it('defines every --next-font-* variable it uses', () => {
    const css = component('bundle.css');
    const used = new Set(css.match(/var\((--next-font-[\w-]+)\)/g));
    const defined = [...css.matchAll(/^\s*(--next-font-[\w-]+):/gm)].map(
      match => match[1]
    );

    expect(used.size).toBeGreaterThan(0);
    expect(
      [...used].filter(use => !defined.includes(use.slice('var('.length, -1)))
    ).toEqual([]);
  });

  it('sets each --next-font-* variable to the DESIGN.md family', () => {
    const css = component('bundle.css');

    for (const [name, family] of [
      ['bricolage-grotesque', 'Bricolage Grotesque'],
      ['public-sans', 'Public Sans'],
      ['jetbrains-mono', 'JetBrains Mono'],
    ]) {
      expect(css).toContain(`--next-font-${name}: '${family}';`);
    }
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

describe('the control cards', () => {
  const names = CONTROLS.map(({ name }) => name);
  const card = (name: string, file: string) => component(`${name}/${file}`);

  it('writes a README.md and a preview.html per control, and the cover', () => {
    expect(
      written
        .filter(path => /components\/[A-Z]\w+\/[^/]+$/.test(path))
        .toSorted()
    ).toEqual(
      [
        'project/components/Cover/preview.html',
        ...names.flatMap(name => [
          `project/components/${name}/README.md`,
          `project/components/${name}/preview.html`,
        ]),
      ].toSorted()
    );
    expect(names).toHaveLength(12);
  });

  it.each(names)(
    '%s: README under 64 KB, summary first, props listed',
    name => {
      const text = card(name, 'README.md');

      expect(() => checkReadme(name, text)).not.toThrow();
      expect(text.split('\n')[0]).not.toMatch(/^#/);
      expect(text).toContain('| Prop | Type | Required | Description |');
    }
  );

  it.each(names)('%s: preview names its group and links nothing', name => {
    const html = card(name, 'preview.html');
    const { group, height } = CARDS.find(each => each.name === name)!;

    expect(html.split('\n')[0]).toBe(
      `<!-- @dsCard group="${group}" height=${height} -->`
    );
    expect(() => checkPreview(name, html)).not.toThrow();
  });

  it('uses the summaries the plan gives the five controls', () => {
    const first = (name: string) => card(name, 'README.md').split('\n')[0];

    expect(first('Button')).toBe(
      'An action: primary for the one main action in a view, secondary for the rest.'
    );
    expect(first('IconButton')).toBe(
      'An action shown only as an icon, such as zoom, close or step, named by its `label`.'
    );
    expect(first('Chip')).toBe(
      'A pill that turns one filter on or off, such as an Event type.'
    );
    expect(first('Tabs')).toBe(
      'A row of tabs that switches panels, such as Layers and Filters.'
    );
    expect(first('Checkbox')).toBe(
      'A checkbox with no label of its own: name it with `aria-label`, or use `CheckboxField`.'
    );
  });

  it('lists the props declared in the repo, and says the rest go to the element', () => {
    const button = card('Button', 'README.md');
    const toast = card('Toast', 'README.md');

    expect(button).toContain(
      '| `variant` | `"primary" \\| "secondary"` | no |'
    );
    expect(button).toContain(
      '| `state` | `"active" \\| "focus" \\| "hover"` | no |'
    );
    expect(button).toContain(
      '| `full` | `boolean` | no | Fills the width of its container. |'
    );
    expect(button).not.toContain('`onClick`');
    expect(button).toContain('HTML element');
    expect(toast).not.toContain('HTML element');
    expect(button).toContain('## Design\n\n- **Buttons:**');
  });

  it('says which props each form of Button requires', () => {
    expect(card('Button', 'README.md')).toContain(
      'Required props: `children`; or `icon`, `label`.'
    );
    expect(card('Toast', 'README.md')).not.toContain('forms');
  });

  it('puts the canvas section last in the system README', () => {
    expect(readFileSync(join(first, 'project/README.md'), 'utf8')).toMatch(
      /## Using the controls on a canvas\n\n[^#]+$/
    );
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
