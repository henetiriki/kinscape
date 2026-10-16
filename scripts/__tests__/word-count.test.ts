import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { budgetFor, checkFiles, countWords, run } from '../word-count.mts';

const words = (count: number) => Array(count).fill('word').join(' ');

describe('countWords', () => {
  it('counts tokens that contain a letter or digit', () => {
    expect(countWords('one two3 | --- ## `x` — 4')).toBe(4);
  });

  it('counts nothing in an empty file', () => {
    expect(countWords('')).toBe(0);
  });
});

describe('budgetFor', () => {
  it.each([
    ['CLAUDE.md', 150],
    ['AGENTS.md', 800],
    ['docs/how-we-work.md', 800],
    ['plans/M0.1-hello-vercel.md', 600],
    ['plans/TEMPLATE.md', 600],
    ['.claude/skills/refine/SKILL.md', 600],
    ['.claude/skills/refine/nested/deep.md', 600],
  ])('%s has a budget of %i', (path, budget) => {
    expect(budgetFor(path)).toBe(budget);
  });

  it.each([
    'docs/requirements.md',
    'README.md',
    '.claude/skills/refine/NOTICE.md',
    '.claude/skills/NOTICE.md',
    'plans/sub/file.md',
  ])('%s has no budget', path => {
    expect(budgetFor(path)).toBeUndefined();
  });
});

describe('checkFiles and run', () => {
  let root: string;

  const write = (name: string, content: string) => {
    const path = join(root, name);

    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);

    return path;
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'word-count-'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    rmSync(root, { force: true, recursive: true });
    vi.restoreAllMocks();
  });

  it('passes a file at its budget', () => {
    write('CLAUDE.md', words(150));

    expect(checkFiles(root, ['CLAUDE.md'])).toEqual([]);
  });

  it('names a file over its budget', () => {
    write('CLAUDE.md', words(151));

    expect(checkFiles(root, ['CLAUDE.md'])).toEqual([
      'CLAUDE.md: 151 words, budget 150',
    ]);
  });

  it('ignores a path with no budget and a path that is gone', () => {
    write('docs/requirements.md', words(5000));

    expect(checkFiles(root, ['docs/requirements.md', 'plans/gone.md'])).toEqual(
      []
    );
  });

  it('checks every budgeted file when given no paths', () => {
    write('CLAUDE.md', words(151));
    write('plans/a.md', words(10));
    write('plans/b.md', words(601));
    write('.claude/skills/x/SKILL.md', words(601));
    write('.claude/skills/x/NOTICE.md', words(5000));

    expect(run(root, [], '')).toBe(1);
    expect(console.error).toHaveBeenCalledTimes(3);
    expect(console.error).toHaveBeenCalledWith(
      'CLAUDE.md: 151 words, budget 150'
    );
  });

  it('passes when nothing is over budget', () => {
    write('CLAUDE.md', words(5));

    expect(run(root, [], '')).toBe(0);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('passes when none of the budgeted files exist', () => {
    expect(run(root, [], '')).toBe(0);
  });

  it('checks only the paths given', () => {
    write('CLAUDE.md', words(151));
    write('plans/a.md', words(601));

    expect(run(root, ['plans/a.md'], '')).toBe(1);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  describe('--hook', () => {
    const input = (path: string) =>
      JSON.stringify({ tool_input: { file_path: path } });

    it('exits 2 and names the file and budget when over', () => {
      const path = write('CLAUDE.md', words(151));

      expect(run(root, ['--hook'], input(path))).toBe(2);
      expect(console.error).toHaveBeenCalledWith(
        'CLAUDE.md: 151 words, budget 150'
      );
    });

    it('accepts a path relative to the repo', () => {
      write('CLAUDE.md', words(151));

      expect(run(root, ['--hook'], input('CLAUDE.md'))).toBe(2);
    });

    it('exits 0 when within budget', () => {
      const path = write('CLAUDE.md', words(10));

      expect(run(root, ['--hook'], input(path))).toBe(0);
    });

    it('exits 0 for a file outside the repo', () => {
      expect(run(root, ['--hook'], input('/elsewhere/CLAUDE.md'))).toBe(0);
    });

    it.each([
      ['not json', 'nope'],
      ['no file path', '{}'],
      ['null', 'null'],
    ])('exits 0 on input with %s', (_name, stdin) => {
      expect(run(root, ['--hook'], stdin)).toBe(0);
    });
  });
});
