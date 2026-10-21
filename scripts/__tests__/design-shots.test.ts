import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  findProblems,
  render,
  screenNames,
  shotFor,
  snapshotNames,
} from '../design-shots.mts';

let root: string;

const put = (path: string, content: string) => {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), content);
};

const screens = (...names: string[]) =>
  put(
    'design/DESIGN.md',
    `| Screen | File |\n| --- | --- |\n${names.map(n => `| Name | [${n}.jpg](${n}.jpg) |`).join('\n')}\n`
  );

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'design-shots-'));
});

afterEach(() => {
  rmSync(root, { force: true, recursive: true });
});

describe('the real snapshots', () => {
  it('match the Screens table and the rules', () => {
    expect(findProblems('.')).toEqual([]);
  });
});

describe('shotFor', () => {
  it.each([
    ['map-phone', 390, 844, 2, false],
    ['sign-in-phone-error', 390, 844, 2, false],
    ['style-4-states', 1440, 900, 1, true],
    ['map-style', 1440, 900, 1, true],
    ['map-desktop', 1440, 900, 1, false],
  ])('%s', (name, width, height, scale, fullPage) => {
    expect(shotFor(name)).toEqual({ fullPage, height, scale, width });
  });
});

describe('screenNames and snapshotNames', () => {
  it('read the table rows and the html files', () => {
    screens('b', 'a');
    put('design/source/b.html', '');
    put('design/source/a.html', '');
    put('design/source/fonts.css', '');

    expect(
      screenNames(readFileSync(join(root, 'design/DESIGN.md'), 'utf8'))
    ).toEqual(['b', 'a']);
    expect(snapshotNames(root)).toEqual(['a', 'b']);
  });
});

describe('findProblems', () => {
  const good =
    '<svg><defs><g id="x"/></defs><use href="#x"/></svg><a href="#"></a>';

  it('passes sound snapshots', () => {
    screens('a');
    put('design/a.jpg', '');
    put('design/source/a.html', `${good}<img src="logo.svg">`);
    put('design/source/logo.svg', '');

    expect(findProblems(root)).toEqual([]);
  });

  it('reports a row without a snapshot or JPG, and a snapshot without a row', () => {
    screens('a');
    put('design/source/b.html', good);

    expect(findProblems(root)).toEqual([
      'a: no snapshot in design/source',
      'a: no design/a.jpg',
      'b.html: no row in the DESIGN.md Screens table',
    ]);
  });

  it.each([
    ['<script>', '<script>x</script>', '<script'],
    ['var(', '<i style="color: var(--x)">', 'var('],
    ['calc(', '<i style="width: calc(1px + 2px)">', 'calc('],
    [
      'a linked http page',
      '<link href="https://x.test/a.css">',
      'an http(s) load',
    ],
    [
      'a css url',
      '<i style="background: url(https://x.test/a.png)">',
      'an http(s) load',
    ],
    ['@import', '<style>@import "a.css";</style>', 'an http(s) load'],
  ])('rejects %s', (_label, html, label) => {
    screens('a');
    put('design/a.jpg', '');
    put('design/source/a.html', html);

    expect(findProblems(root)).toEqual([`a.html: contains ${label}`]);
  });

  it('rejects a reference that does not resolve', () => {
    screens('a');
    put('design/a.jpg', '');
    put(
      'design/source/a.html',
      '<img src="missing.svg"><i style="fill: url(#nope)"></i><img src="data:image/png;base64,AA">'
    );

    expect(findProblems(root)).toEqual([
      'a.html: missing.svg does not resolve',
      'a.html: #nope matches no id',
    ]);
  });
});

describe('render', () => {
  const setup = () => {
    put('design/source/a.html', '');
    put('design/source/b.html', '');
    put('design/a.jpg', 'same');
  };

  it('writes only the JPGs whose bytes changed', async () => {
    setup();

    const shoot = vi.fn(async () => Buffer.from('same'));

    expect(await render(root, [], { shoot })).toEqual(['b']);
    expect(shoot).toHaveBeenCalledTimes(2);
    expect(readFileSync(join(root, 'design/b.jpg'), 'utf8')).toBe('same');
  });

  it('rewrites a changed JPG', async () => {
    setup();

    expect(
      await render(root, ['a'], { shoot: async () => Buffer.from('new') })
    ).toEqual(['a']);
    expect(readFileSync(join(root, 'design/a.jpg'), 'utf8')).toBe('new');
  });

  it('renders only the named snapshots, from a file URL', async () => {
    setup();

    const shoot = vi.fn(async (url: string) => Buffer.from(url ? 'same' : ''));

    await render(root, ['b'], { shoot });

    expect(shoot).toHaveBeenCalledOnce();
    expect(shoot.mock.calls[0][0]).toMatch(
      /^file:\/\/.*design\/source\/b\.html$/
    );
  });

  it('rejects a name with no snapshot', async () => {
    setup();

    await expect(render(root, ['c', 'a'], { shoot: vi.fn() })).rejects.toThrow(
      'No snapshot named: c'
    );
  });
});
