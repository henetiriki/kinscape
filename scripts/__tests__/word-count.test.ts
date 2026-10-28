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

  it('skips each block that Next.js manages, and counts the text around them', () => {
    const rules =
      '<!-- BEGIN:nextjs-agent-rules -->\nskipped words\n<!-- END:nextjs-agent-rules -->';
    const feedback =
      '<!-- BEGIN:nextjs-agent-feedback -->\nskipped too\n<!-- END:nextjs-agent-feedback -->';

    expect(countWords(`one\n${rules}\ntwo\n${feedback}\nthree`)).toBe(3);
  });

  it('counts a block whose markers do not match, or that is not Next.js', () => {
    expect(
      countWords('<!-- BEGIN:nextjs-a -->\nx\n<!-- END:nextjs-b -->')
    ).toBe(3);
    expect(countWords('<!-- BEGIN:other -->\nx\n<!-- END:other -->')).toBe(3);
  });
});

describe('budgetFor', () => {
  it.each([
    ['CLAUDE.md', 150],
    ['AGENTS.md', 650],
    ['docs/security.md', 200],
    ['docs/how-we-work.md', 850],
    ['docs/building.md', 400],
    ['docs/dependencies.md', 200],
    ['docs/architecture.md', 800],
    ['docs/architecture-target.md', 650],
    ['plans/README.md', 700],
    ['plans/M0.1-hello-vercel.md', 600],
    ['plans/TEMPLATE.md', 600],
    ['plans/bugs/B1-x.md', 600],
    ['plans/chores/C1-x.md', 300],
    ['.github/agent/rules.md', 300],
    ['.github/agent/review.md', 400],
    ['.claude/skills/refine/SKILL.md', 650],
    ['.claude/skills/refine/nested/deep.md', 650],
  ])('%s has a budget of %i', (path, budget) => {
    expect(budgetFor(path)).toBe(budget);
  });

  it.each([
    'docs/requirements.md',
    'README.md',
    '.claude/skills/refine/NOTICE.md',
    '.claude/skills/NOTICE.md',
    'plans/sub/file.md',
    'plans/bugs/sub/file.md',
    'plans/chores/sub/file.md',
    '.github/agent/sub/file.md',
    '.github/agent/settings.json',
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

  it('budgets a bug plan at 600 words', () => {
    write('plans/bugs/B1-x.md', words(600));
    expect(checkFiles(root, ['plans/bugs/B1-x.md'])).toEqual([]);

    write('plans/bugs/B1-x.md', words(601));
    expect(checkFiles(root, ['plans/bugs/B1-x.md'])).toEqual([
      'plans/bugs/B1-x.md: 601 words, budget 600',
    ]);
  });

  it('budgets a chore plan at 300 words', () => {
    write('plans/chores/C1-x.md', words(300));
    expect(checkFiles(root, ['plans/chores/C1-x.md'])).toEqual([]);

    write('plans/chores/C1-x.md', words(301));
    expect(checkFiles(root, ['plans/chores/C1-x.md'])).toEqual([
      'plans/chores/C1-x.md: 301 words, budget 300',
    ]);
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
    write('plans/bugs/B1-x.md', words(601));
    write('plans/chores/C1-x.md', words(301));
    write('.github/agent/rules.md', words(301));
    write('.claude/skills/x/SKILL.md', words(651));
    write('.claude/skills/x/NOTICE.md', words(5000));

    expect(run(root, [], '')).toBe(1);
    expect(console.error).toHaveBeenCalledTimes(6);
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
