import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrChecksDeps } from '@ks/scripts/types.ts';

import { CAP, run } from '@ks/scripts/pr-checks.mts';

const ENV = { GH_REPO: 'owner/repo' };
const BASE = 'b'.repeat(40);
const HEAD = 'a'.repeat(40);
const PLAN_PATH = 'plans/chores/C1-x.md';

type File = {
  additions?: number;
  deletions?: number;
  filename: string;
  previous_filename?: string;
  status?: string;
};

type World = {
  basePackage?: string;
  body?: string;
  branch?: string;
  failing?: string[];
  files?: File[];
  headPackage?: string;
  issue?: { issueType: { name: string } | null; state: string };
  labels?: string[];
  plans?: Record<string, string>;
};

const plan = (rows: string, deviations = ''): string => `# Plan

## Files that change

| File | What |
| ---- | ---- |
${rows}

## Deviations
${deviations}
`;

const pkg = (dependencies: Record<string, string>) =>
  JSON.stringify({ dependencies, devDependencies: { vitest: '1' } });

// A fake `gh` that answers from `world`; a name in `failing` throws.
const setup = (world: World = {}) => {
  const append = vi.fn();
  const gh = vi.fn((args: string[]): string => {
    const [first, second] = args;
    const call = args.join(' ');
    const fail = (name: string) => {
      if (world.failing?.includes(name)) {
        throw new Error(`${name} down`);
      }
    };

    if (first === 'pr') {
      fail('view');

      return JSON.stringify({
        baseRefOid: BASE,
        body: world.body ?? 'Closes #7',
        headRefName: world.branch ?? 'chore/x',
        headRefOid: HEAD,
        labels: (world.labels ?? []).map(name => ({ name })),
      });
    }

    if (first === 'issue') {
      fail('issue');

      return JSON.stringify(
        world.issue ?? { issueType: { name: 'Chore' }, state: 'OPEN' }
      );
    }

    if (second === '--paginate') {
      fail('files');

      return (world.files ?? [{ filename: 'lib/a.ts' }])
        .map(file =>
          JSON.stringify({
            additions: 1,
            deletions: 1,
            status: 'added',
            ...file,
          })
        )
        .join('\n');
    }

    const path = /contents\/([^?]+)\?ref=(\w+)/.exec(call);
    const [, name, ref] = path ?? [];

    if (name === 'package.json') {
      fail(ref === BASE ? 'base' : 'head');

      return ref === BASE
        ? (world.basePackage ?? pkg({}))
        : (world.headPackage ?? pkg({}));
    }

    fail('plan');

    return world.plans?.[decodeURIComponent(name)] ?? '';
  });
  const deps: PrChecksDeps = { append, gh };

  return { append, deps, gh };
};

const check = (world: World = {}, env: Record<string, string> = {}) => {
  const { append, deps, gh } = setup(world);
  const code = run(['9'], { ...ENV, ...env }, deps);
  const lines = vi
    .mocked(console.log)
    .mock.calls.map(([text]) => String(text))
    .join('\n');

  return { append, code, gh, lines };
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('usage', () => {
  it('fails without a PR number or repo', () => {
    const { deps } = setup();

    expect(run([], ENV, deps)).toBe(1);
    expect(run(['9'], {}, deps)).toBe(1);
    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it('fails when the PR or its files cannot be read', () => {
    for (const failing of ['view', 'files']) {
      const { code, lines } = check({ failing: [failing] });

      expect(code).toBe(1);
      expect(lines).toContain(
        `- PR checks: reading the PR failed: ${failing} down`
      );
    }
  });
});

describe('Closes', () => {
  it('passes with one open Spec, Bug or Chore', () => {
    const { code, lines } = check();

    expect(code).toBe(0);
    expect(lines).toContain('Closes: pass.');
  });

  it('counts a repeated number once, ignoring case and comments', () => {
    const body = '<!-- Closes #1 -->\ncloses #7\nCloses #7';

    expect(check({ body }).code).toBe(0);
  });

  it('strips a comment that a removed comment leaves behind', () => {
    const body = '<!<!-- x -->-- Closes #1 -->\nCloses #7';

    expect(check({ body }).code).toBe(0);
  });

  it('fails with no Closes line', () => {
    const { code, lines } = check({ body: 'Fixes #7' });

    expect(code).toBe(1);
    expect(lines).toContain('holds 0 `Closes #n` lines');
  });

  it('fails with two different numbers', () => {
    expect(check({ body: 'Closes #7\nCloses #8' }).lines).toContain(
      'holds 2 `Closes #n` lines'
    );
  });

  it('fails for a closed issue', () => {
    const issue = { issueType: { name: 'Spec' }, state: 'CLOSED' };

    expect(check({ issue }).lines).toContain('issue #7 is not open.');
  });

  it('fails for an Intent and for an untyped issue', () => {
    const intent = { issueType: { name: 'Intent' }, state: 'OPEN' };
    const untyped = { issueType: null, state: 'OPEN' };

    expect(check({ issue: intent }).lines).toContain(
      'issue #7 has the Type "Intent", not Spec, Bug or Chore.'
    );
    expect(check({ issue: untyped }).lines).toContain(
      'issue #7 has the Type "", not Spec, Bug or Chore.'
    );
  });

  it('fails with the reason when the issue call fails', () => {
    expect(check({ failing: ['issue'] }).lines).toContain(
      '- Closes: reading issue #7 failed: issue down'
    );
  });
});

describe('Edited tests', () => {
  const edited = (status: string, extra: Partial<File> = {}): File => ({
    filename: 'lib/__tests__/a.test.ts',
    status,
    ...extra,
  });
  const listing = (path: string) => ({
    [PLAN_PATH]: plan(`| \`${path}\` | Changed | x |`),
  });
  const files = (file: File): File[] => [file, { filename: PLAN_PATH }];

  it('passes an added test and an edit to a listed test', () => {
    expect(check({ files: [edited('added')] }).lines).toContain(
      'Edited tests: pass.'
    );
    expect(
      check({
        files: files(edited('modified')),
        plans: listing('lib/__tests__/a.test.ts'),
      }).code
    ).toBe(0);
  });

  it('fails each edit status without a row', () => {
    for (const status of ['modified', 'removed', 'renamed', 'changed']) {
      expect(check({ files: files(edited(status)) }).lines).toContain(
        "- Edited tests: `lib/__tests__/a.test.ts` is edited, but the plan's Files that change table does not list it."
      );
    }
  });

  it('fails an e2e edit and with no plan in the diff', () => {
    const e2e = { filename: 'e2e/a.spec.ts', status: 'modified' };

    expect(check({ files: [e2e] }).code).toBe(1);
  });

  it('accepts a row for the old or the new path of a rename', () => {
    const renamed = edited('renamed', {
      previous_filename: 'lib/__tests__/old.test.ts',
    });

    for (const path of [
      'lib/__tests__/old.test.ts',
      'lib/__tests__/a.test.ts',
    ]) {
      expect(check({ files: files(renamed), plans: listing(path) }).code).toBe(
        0
      );
    }
  });

  it('reads a rename out of a test path', () => {
    const renamed = {
      filename: 'lib/b.ts',
      previous_filename: 'lib/__tests__/old.test.ts',
      status: 'renamed',
    };

    expect(check({ files: files(renamed) }).code).toBe(1);
  });

  it('reads each changed plan, but not a removed one', () => {
    const second = 'plans/chores/C2-y.md';
    const both = [
      edited('modified'),
      { filename: PLAN_PATH },
      { filename: second },
    ];

    expect(
      check({
        files: both,
        plans: { [second]: listing('lib/__tests__/a.test.ts')[PLAN_PATH] },
      }).code
    ).toBe(0);
    expect(
      check({
        files: [edited('modified'), { filename: PLAN_PATH, status: 'removed' }],
        plans: listing('lib/__tests__/a.test.ts'),
      }).code
    ).toBe(1);
  });

  it('fails with the reason when a plan cannot be read', () => {
    expect(
      check({ failing: ['plan'], files: files(edited('modified')) }).lines
    ).toContain('- Edited tests: reading the plans failed: plan down');
  });
});

describe('New dependencies', () => {
  const changed: File[] = [
    { filename: 'package.json', status: 'modified' },
    { filename: PLAN_PATH },
  ];
  const added = { basePackage: pkg({}), headPackage: pkg({ zod: '1' }) };

  it('passes when package.json is not in the diff', () => {
    expect(check().lines).toContain('New dependencies: pass.');
  });

  it('passes a version change and a removed package', () => {
    expect(
      check({
        basePackage: pkg({ old: '1', zod: '1' }),
        files: changed,
        headPackage: pkg({ zod: '2' }),
      }).code
    ).toBe(0);
  });

  it('passes a package named in a package.json row', () => {
    const plans = {
      [PLAN_PATH]: plan('| `package.json` | Changed | Add zod |'),
    };

    expect(check({ ...added, files: changed, plans }).code).toBe(0);
  });

  it('passes a package named in a Big: line', () => {
    for (const bullet of ['', '- ', '* ']) {
      const plans = {
        [PLAN_PATH]: plan('', `${bullet}Big: add zod, for the parser.`),
      };

      expect(check({ ...added, files: changed, plans }).code).toBe(0);
    }
  });

  it('fails a package that the plan does not name', () => {
    const plans = {
      [PLAN_PATH]: plan(
        '| `lib/a.ts` | Changed | zod |\n| `package.json` | Changed | Add zodiac |',
        'Add zod later.\nBig: add zod-x.\n\n## Risks\n\nBig: add zod.'
      ),
    };

    expect(check({ ...added, files: changed, plans }).lines).toContain(
      '- New dependencies: `zod` is a new dependency, but the plan names it in no `package.json` row and no Big: line.'
    );
  });

  it('fails with no plan, and for each dependency section', () => {
    const headPackage = JSON.stringify({
      devDependencies: { a: '1' },
      optionalDependencies: { b: '1' },
      peerDependencies: { c: '1' },
    });
    const { lines } = check({
      basePackage: '{}',
      files: [changed[0]],
      headPackage,
    });

    for (const name of ['a', 'b', 'c']) {
      expect(lines).toContain(`\`${name}\` is a new dependency`);
    }
  });

  it('finds a plan with no Deviations section', () => {
    const plans = { [PLAN_PATH]: '# Plan\n' };

    expect(check({ ...added, files: changed, plans }).code).toBe(1);
  });

  it('fails with the reason when a call fails', () => {
    for (const failing of ['base', 'head']) {
      expect(check({ failing: [failing], files: changed }).lines).toContain(
        `- New dependencies: reading package.json failed: ${failing} down`
      );
    }
    expect(
      check({ ...added, failing: ['plan'], files: changed }).lines
    ).toContain('- New dependencies: reading the plans failed: plan down');
  });
});

describe('Size', () => {
  const lines = (count: number, filename = 'lib/a.ts'): File[] => [
    { additions: count - 1, deletions: 1, filename },
  ];

  it('has the cap of 660', () => {
    expect(CAP).toBe(660);
  });

  it('passes 660 lines and fails 661', () => {
    expect(check({ files: lines(660) }).code).toBe(0);
    expect(check({ files: lines(661) }).lines).toContain(
      '- Size: 661 changed lines, over the cap of 660. A collaborator can accept the size with the `size: accepted` label.'
    );
  });

  it('passes 661 lines with the label', () => {
    expect(check({ files: lines(661), labels: ['size: accepted'] }).code).toBe(
      0
    );
  });

  it('does not count generated, data and plan paths', () => {
    const paths = [
      'package-lock.json',
      'data/a.json',
      'plans/chores/x.md',
      'design/canvas/a.html',
      'design/source/a.html',
      'design/home.jpg',
      'design/cards/a.html',
    ];

    expect(
      check({
        files: [...paths.flatMap(path => lines(700, path)), ...lines(1)],
      }).code
    ).toBe(0);
    expect(check({ files: lines(700, 'design/other/a.jpg') }).code).toBe(1);
  });
});

describe('skips', () => {
  const bad: File[] = [
    { additions: 900, filename: 'lib/__tests__/a.test.ts', status: 'modified' },
  ];

  it('skips all four checks on three head branches', () => {
    for (const branch of [
      'bot/update-action-pins',
      'revert-12-x',
      'dependabot/npm_and_yarn/x',
    ]) {
      const { code, lines } = check({ body: '', branch, files: bad });

      expect(code).toBe(0);
      expect(lines).toContain(
        `Closes: skipped, because the head branch is \`${branch}\`.`
      );
      expect(lines).toContain('Size: skipped');
    }
  });

  it('does not skip other branches', () => {
    expect(check({ branch: 'revert', files: bad }).code).toBe(1);
  });

  it('skips checks 2 to 4 for a diff of only plans', () => {
    const files: File[] = [
      { additions: 900, filename: PLAN_PATH },
      { filename: 'plans/b.md', previous_filename: 'plans/a.md' },
    ];
    const { code, lines } = check({ files });

    expect(code).toBe(0);
    expect(lines).toContain('Closes: pass.');
    expect(lines).toContain(
      'Size: skipped, because each changed path is under `plans/`.'
    );
  });

  it('does not skip a rename out of plans/', () => {
    const files = [{ filename: 'lib/a.md', previous_filename: 'plans/a.md' }];

    expect(check({ files }).lines).toContain('Size: pass.');
  });
});

describe('summary', () => {
  it('appends the lines to $GITHUB_STEP_SUMMARY', () => {
    const { append } = check({}, { GITHUB_STEP_SUMMARY: '/tmp/summary' });

    expect(append).toHaveBeenCalledWith(
      '/tmp/summary',
      expect.stringContaining('Size: pass.')
    );
  });

  it('only logs when $GITHUB_STEP_SUMMARY is not set', () => {
    expect(check().append).not.toHaveBeenCalled();
  });
});
