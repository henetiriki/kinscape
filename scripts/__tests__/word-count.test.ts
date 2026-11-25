import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  budgetFor,
  checkFiles,
  countWords,
  run,
} from '@ks/scripts/word-count.mts';

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
    ['README.md', 300],
    ['docs/README.md', 200],
    ['AGENTS.md', 750],
    ['docs/security.md', 350],
    ['docs/code-rules.md', 320],
    ['docs/code-rules/scale.md', 200],
    ['docs/writing.md', 600],
    ['docs/how-we-work.md', 1110],
    ['docs/building.md', 450],
    ['docs/dependencies.md', 275],
    ['docs/repo-settings.md', 900],
    ['docs/infrastructure.md', 1000],
    ['docs/architecture.md', 600],
    ['docs/patterns/tree-data.md', 130],
    ['docs/architecture-target.md', 650],
    ['docs/glossary.md', 1200],
    ['design/DESIGN.md', 950],
    ['design/topics/foundations.md', 800],
    ['design/topics/layout.md', 350],
    ['design/topics/components.md', 1900],
    ['design/topics/feedback.md', 750],
    ['design/topics/map.md', 550],
    ['design/topics/tokens.md', 640],
    ['design/CANVAS.md', 1650],
    ['design/COMPONENTS.md', 600],
    ['plans/BUILD.md', 570],
    ['plans/README.md', 790],
    ['plans/DL.17-motion-rules.md', 1500],
    ['plans/M0.1-hello-vercel.md', 1500],
    ['plans/TEMPLATE.md', 1500],
    ['plans/bugs/B1-x.md', 1500],
    ['plans/chores/C1-x.md', 1500],
    ['.github/agent/rules.md', 300],
    ['.github/agent/build.md', 600],
    ['.github/agent/fix-review.md', 540],
    ['.github/agent/review.md', 550],
    ['.github/agent/review-code.md', 750],
    ['.claude/skills/refine/SKILL.md', 1020],
    ['.claude/skills/refine/nested/deep.md', 650],
  ])('%s has a budget of %i', (path, budget) => {
    expect(budgetFor(path)).toBe(budget);
  });

  it.each([
    'docs/requirements.md',
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

  const track = () => {
    execFileSync('git', ['add', '-A'], { cwd: root });
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'word-count-'));
    execFileSync('git', ['init', '--quiet'], { cwd: root });
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

  it.each([
    ['plans/M0.1-x.md', 1500],
    ['plans/bugs/B1-x.md', 1500],
    ['plans/chores/C1-x.md', 1500],
  ])('budgets %s at %i words', (path, budget) => {
    write(path, words(budget));
    expect(checkFiles(root, [path])).toEqual([]);

    write(path, words(budget + 1));
    expect(checkFiles(root, [path])).toEqual([
      `${path}: ${budget + 1} words, budget ${budget}`,
    ]);
  });

  it.each([
    ['plans/M0.1-x.md', 1500],
    ['plans/bugs/B1-x.md', 1500],
    ['plans/chores/C1-x.md', 1500],
  ])('does not count the Deviations section of %s', (path, budget) => {
    const deviations = Array(5)
      .fill(`- ${words(20)}`)
      .join('\n');

    write(path, `${words(budget)}\n\n## Deviations\n\n${deviations}\n`);

    expect(checkFiles(root, [path])).toEqual([]);
  });

  it('counts the sections around a Deviations section', () => {
    write(
      'plans/chores/C1-x.md',
      `${words(1200)}\n## Deviations\n${words(500)}\n## Risks\n${words(301)}`
    );

    expect(checkFiles(root, ['plans/chores/C1-x.md'])).toEqual([
      'plans/chores/C1-x.md: 1502 words, budget 1500',
    ]);
  });

  it.each([
    ['CLAUDE.md', 150],
    ['plans/BUILD.md', 570],
    ['plans/README.md', 790],
  ])(
    'counts a Deviations section in %s, which is not a plan',
    (path, budget) => {
      write(path, `## Deviations\n${words(budget)}`);

      expect(checkFiles(root, [path])).toEqual([
        `${path}: ${budget + 1} words, budget ${budget}`,
      ]);
    }
  );

  it('names a file over its budget', () => {
    write('CLAUDE.md', words(151));

    expect(checkFiles(root, ['CLAUDE.md'])).toEqual([
      'CLAUDE.md: 151 words, budget 150',
    ]);
  });

  // The target of a symlink has its own budget, so a link would count the same words twice.
  it('skips a symlink', () => {
    write('docs/requirements.md', words(5000));
    symlinkSync('requirements.md', join(root, 'docs/README.md'));

    expect(checkFiles(root, ['docs/README.md'])).toEqual([]);
    expect(run(root, [], '')).toBe(0);
  });

  it('ignores a path with no budget and a path that is gone', () => {
    write('docs/requirements.md', words(5000));

    expect(checkFiles(root, ['docs/requirements.md', 'plans/gone.md'])).toEqual(
      []
    );
  });

  it('checks every tracked file that has a budget when given no paths', () => {
    write('CLAUDE.md', words(151));
    write('README.md', words(301));
    write('docs/README.md', words(201));
    write('plans/a.md', words(10));
    write('plans/b.md', words(1501));
    write('plans/bugs/B1-x.md', words(1501));
    write('plans/chores/C1-x.md', words(1501));
    write('.github/agent/rules.md', words(301));
    write('.claude/skills/x/SKILL.md', words(651));
    write('.claude/skills/x/NOTICE.md', words(5000));
    write('docs/requirements.md', words(5000));
    track();

    expect(run(root, [], '')).toBe(1);
    expect(console.error).toHaveBeenCalledTimes(8);
    expect(console.error).toHaveBeenCalledWith(
      'docs/README.md: 201 words, budget 200'
    );
  });

  it('checks a budgeted file that git does not track yet', () => {
    write('CLAUDE.md', words(151));

    expect(run(root, [], '')).toBe(1);
  });

  it('skips a tracked file that is gone from disk', () => {
    const path = write('CLAUDE.md', words(151));

    track();
    rmSync(path);

    expect(run(root, [], '')).toBe(0);
  });

  it('passes when nothing is over budget', () => {
    write('CLAUDE.md', words(5));
    track();

    expect(run(root, [], '')).toBe(0);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('passes when none of the budgeted files exist', () => {
    expect(run(root, [], '')).toBe(0);
  });

  it('checks only the paths given', () => {
    write('CLAUDE.md', words(151));
    write('plans/a.md', words(1501));

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
