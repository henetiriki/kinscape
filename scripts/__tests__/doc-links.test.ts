import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ALLOWLIST, checkDocLinks, docFiles } from '@ks/scripts/doc-links.mts';

describe('checkDocLinks', () => {
  let root: string;

  const write = (name: string, content: string) => {
    const path = join(root, name);

    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  };

  const check = (files: string[], allowlist: string[][] = []) =>
    checkDocLinks(root, files, allowlist);

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'doc-links-'));
  });

  afterEach(() => {
    rmSync(root, { force: true, recursive: true });
  });

  it('passes a link to a file and to a heading', () => {
    write('a.md', '[b](b.md) and [heading](b.md#whats-set) [x](docs/c.md)');
    write('b.md', '# Title\n\n## What’s set\n');
    write('docs/c.md', 'text');

    expect(check(['a.md', 'b.md'])).toEqual([]);
  });

  it('builds a heading anchor the way GitHub does', () => {
    write(
      'a.md',
      [
        '[1](b.md#whats-set-and-why)',
        '[2](b.md#roles-and-labels-whose-turn-is-it)',
        '[3](b.md#a-code-link)',
        '[4](b.md#same)',
        '[5](b.md#same-1)',
        '[6](b.md#anchor-id)',
      ].join('\n')
    );
    write(
      'b.md',
      [
        "## What's set and why",
        '## Roles and labels: whose turn is it?',
        '## A `code` [link](x.md)',
        '## Same',
        '## Same',
        '<a id="anchor-id"></a>',
      ].join('\n')
    );

    expect(check(['a.md'])).toEqual([]);
  });

  it('checks a link to a heading in the same file, and adds no edge', () => {
    write('a.md', '# Top\n\n[ok](#top) [bad](#nope) [self](a.md)');

    expect(check(['a.md'])).toEqual(['a.md: no heading "#nope" in a.md']);
  });

  it('reports a missing file', () => {
    write('a.md', '[gone](missing.md)');

    expect(check(['a.md'])).toEqual(['a.md: missing.md does not exist']);
  });

  it('reports a missing anchor', () => {
    write('a.md', '[b](b.md#nope)');
    write('b.md', '# Title');

    expect(check(['a.md'])).toEqual(['a.md: no heading "#nope" in b.md']);
  });

  it('skips an anchor in a file that is not Markdown', () => {
    write('a.md', '[b](b.html#nope) [d](docs/)');
    write('b.html', '<p>x</p>');
    mkdirSync(join(root, 'docs'));

    expect(check(['a.md'])).toEqual([]);
  });

  it('skips external links, code spans and code blocks', () => {
    write(
      'a.md',
      [
        '[x](https://example.com/none.md) [y](mailto:a@b.c) [z](//cdn/none.md)',
        '`[no](none.md)`',
        '```',
        '[no](none.md)',
        '## Not a heading',
        '```',
        '~~~',
        '[no](none.md)',
        '~~~',
        '[ok](b.md)',
      ].join('\n')
    );
    write('b.md', 'x');

    expect(check(['a.md'])).toEqual([]);
  });

  it('reads @ imports, src and srcset', () => {
    write(
      'a.md',
      '@b.md\n<img src="img/x.svg">\n<source srcset="img/y.svg" />\n<img src="img/gone.svg">'
    );
    write('b.md', 'x');
    write('img/x.svg', '<svg/>');
    write('img/y.svg', '<svg/>');

    expect(check(['a.md'])).toEqual(['a.md: img/gone.svg does not exist']);
  });

  it('decodes a link and drops its query', () => {
    write('a.md', '[b](my%20file.md?x=1)');
    write('my file.md', 'x');

    expect(check(['a.md'])).toEqual([]);
  });

  it('fails a link cycle that no entry holds', () => {
    write('a.md', '[b](b.md)');
    write('b.md', '[a](a.md)');

    expect(check(['a.md', 'b.md'])).toEqual([
      'link cycle not on the allowlist: a.md > b.md > a.md',
    ]);
  });

  it('passes a link cycle whose files an entry holds', () => {
    write('a.md', '[b](b.md) [c](c.md)');
    write('b.md', '[a](a.md)');
    write('c.md', '[a](a.md)');

    expect(check(['a.md', 'b.md', 'c.md'], [['a.md', 'b.md', 'c.md']])).toEqual(
      []
    );
  });

  it('fails a cycle that holds a file outside the entry', () => {
    write('a.md', '[b](b.md)');
    write('b.md', '[c](c.md)');
    write('c.md', '[a](a.md)');

    expect(check(['a.md', 'b.md', 'c.md'], [['a.md', 'b.md']])).toEqual([
      'link cycle not on the allowlist: a.md > b.md > c.md > a.md',
      'allowlist entry matches no link cycle: a.md, b.md',
    ]);
  });

  it('fails an entry that matches no cycle', () => {
    write('a.md', '[b](b.md)');
    write('b.md', 'x');

    expect(check(['a.md', 'b.md'], [['a.md', 'b.md']])).toEqual([
      'allowlist entry matches no link cycle: a.md, b.md',
    ]);
  });
});

describe('docFiles', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'doc-links-'));
    execFileSync('git', ['init', '--quiet'], { cwd: root });
  });

  afterEach(() => {
    rmSync(root, { force: true, recursive: true });
  });

  it('lists tracked Markdown files except plans and the design copies', () => {
    for (const name of [
      'README.md',
      'docs/a.md',
      'plans/p.md',
      'design/canvas/c.md',
      'design/source/s.md',
      'design/DESIGN.md',
      'notes.txt',
    ]) {
      mkdirSync(dirname(join(root, name)), { recursive: true });
      writeFileSync(join(root, name), 'x');
    }

    execFileSync('git', ['add', '-A'], { cwd: root });

    expect(docFiles(root)).toEqual([
      'README.md',
      'design/DESIGN.md',
      'docs/a.md',
    ]);
  });
});

describe('the repo docs', () => {
  it('have no broken link, no new cycle and no stale entry', () => {
    expect(checkDocLinks('.', docFiles('.'), ALLOWLIST)).toEqual([]);
  });
});
