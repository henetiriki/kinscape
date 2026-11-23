import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import type { PlanNewDeps as Deps } from '@ks/scripts/types.ts';

import { run } from '@ks/scripts/plan-new.mts';

type Issue = {
  body?: string;
  title: string;
  type?: null | string;
};
type Parent = {
  repository_url?: string;
  type?: { name: string };
} & Related;
type Related = {
  body?: string;
  html_url?: string;
  number: number;
  state: string;
  title: string;
};

const HOME = 'https://api.github.com/repos/owner/home';
const SELF = 'https://github.com/owner/home/issues/7';
const FOLDERS = { Bug: 'plans/bugs', Chore: 'plans/chores', Spec: 'plans' };
const PREFIXES = { Bug: 'bug', Chore: 'chore', Spec: 'spec' };

// The error that execFileSync throws: the message starts with the command, and stderr holds the reason.
const ghError = (stderr: string, message = 'Command failed: gh api') =>
  Object.assign(new Error(`${message}\n${stderr}`), { stderr });

const setup = (
  issue: Issue,
  options: {
    blocking?: Related[];
    branches?: string;
    dirty?: string;
    files?: string[];
    parent?: 'broken' | 'none' | Error | Parent;
    patterns?: Record<string, string>;
    remote?: string;
    siblings?: Related[];
  } = {}
) => {
  const type = (issue.type ?? 'Spec') as keyof typeof FOLDERS;
  const id = type === 'Spec' ? 'M1.1' : `${type[0]}7`;
  const calls: string[][] = [];
  const written: [string, string][] = [];
  const gitCalls: string[][] = [];
  const lines = (list: unknown[]) =>
    list.map(x => JSON.stringify(x)).join('\n');
  const gh = vi.fn((args: string[]): string => {
    calls.push(args);

    if (args[0] === 'issue') {
      return JSON.stringify({
        body: issue.body ?? '',
        issueType: issue.type === null ? null : { name: type },
        number: 7,
        title: issue.title,
        url: SELF,
      });
    }

    const target = args.find(a => a.startsWith('repos/'));

    if (target === 'repos/{owner}/{repo}/issues/7/dependencies/blocking') {
      return lines(options.blocking ?? []);
    }

    if (target === 'repos/{owner}/{repo}/issues/7/parent') {
      if (options.parent === 'broken') {
        throw ghError('gh: Server Error (HTTP 500)');
      }

      if (options.parent instanceof Error) {
        throw options.parent;
      }

      if (options.parent === undefined || options.parent === 'none') {
        throw ghError('gh: Not Found (HTTP 404)');
      }

      return JSON.stringify({ repository_url: HOME, ...options.parent });
    }

    if (target?.endsWith('/sub_issues')) {
      return lines(options.siblings ?? []);
    }

    throw new Error(`unexpected ${args.join(' ')}`);
  });
  const deps: Deps = {
    files: {
      // Only the plan folder of the Type holds the files, so a wrong folder finds nothing.
      list: dir =>
        dir === 'docs/patterns'
          ? Object.keys(options.patterns ?? {})
          : dir === 'design/topics'
            ? readdirSync('design/topics')
            : dir === FOLDERS[type]
              ? (options.files ?? [])
              : [],
      read: path =>
        path.startsWith('docs/patterns/')
          ? (options.patterns?.[path.slice('docs/patterns/'.length)] ?? '')
          : path.startsWith('design/topics/')
            ? readFileSync(path, 'utf8')
            : '# Plan: x\n\n- **Spec:** #\n- **Status:** draft\n',
      write: (path, text) => {
        written.push([path, text]);
      },
    },
    gh,
    git: args => {
      gitCalls.push(args);

      const local = [
        'for-each-ref',
        '--format=%(refname:short)',
        `refs/heads/${PREFIXES[type]}/${id}-*`,
      ];
      const remote = [
        'ls-remote',
        '--heads',
        'origin',
        `refs/heads/${PREFIXES[type]}/${id}-*`,
      ];

      if (args.join(' ') === local.join(' ')) {
        return options.branches ?? '';
      }

      if (args.join(' ') === remote.join(' ')) {
        return options.remote ?? '';
      }

      if (args.join(' ') === 'status --porcelain --untracked-files=no') {
        return options.dirty ?? '';
      }

      return '';
    },
  };

  return { calls, deps, gitCalls, written };
};

const capture = () => {
  const out: string[] = [];
  const err: string[] = [];
  const log = vi.spyOn(console, 'log').mockImplementation(m => {
    out.push(String(m));
  });
  const error = vi.spyOn(console, 'error').mockImplementation(m => {
    err.push(String(m));
  });

  return {
    err,
    out,
    restore: () => {
      log.mockRestore();
      error.mockRestore();
    },
  };
};

const go = (args: string[], deps: Deps) => {
  const c = capture();
  const code = run(args, deps);

  c.restore();

  return { code, err: c.err.join('\n'), out: c.out.join('\n') };
};

const intent: Parent = {
  number: 5,
  state: 'open',
  title: 'The intent',
  type: { name: 'Intent' },
};

describe('plan-new', () => {
  it('gives the item-types values for a Spec, a Bug and a Chore', () => {
    const spec = go(
      ['7', 'pin-cache'],
      setup({ title: 'Spec: M2.15.3 Cache Pin writes' }).deps
    );
    const bug = go(
      ['7', 'wrong-pin'],
      setup({ title: 'Bug: Pin is wrong', type: 'Bug' }).deps
    );
    const chore = go(
      ['7', 'plan-new'],
      setup({ title: 'Chore: Set up a plan', type: 'Chore' }).deps
    );

    expect(spec.out).toContain('Id: M2.15.3');
    expect(spec.out).toContain('Plan path: plans/M2.15.3-pin-cache.md');
    expect(spec.out).toContain('Branch: spec/M2.15.3-pin-cache');
    expect(spec.out).toContain(
      'Plan PR title: M2.15.3: Cache Pin writes (plan)'
    );
    expect(bug.out).toContain('Id: B7');
    expect(bug.out).toContain('Plan path: plans/bugs/B7-wrong-pin.md');
    expect(bug.out).toContain('Branch: bug/B7-wrong-pin');
    expect(bug.out).toContain('Plan PR title: B.7: Pin is wrong (plan)');
    expect(chore.out).toContain('Id: C7');
    expect(chore.out).toContain('Plan path: plans/chores/C7-plan-new.md');
    expect(chore.out).toContain('Branch: chore/C7-plan-new');
    expect(chore.out).toContain('Plan PR title: C.7: Set up a plan (plan)');
  });

  it('takes a two-part Spec id', () => {
    const { out } = go(
      ['7', 'x'],
      setup({ title: 'Spec: DM.9 Data model' }).deps
    );

    expect(out).toContain('Id: DM.9');
  });

  it('lists each blocking issue and the Intent parent', () => {
    const { deps } = setup(
      { title: 'Chore: A', type: 'Chore' },
      {
        blocking: [{ number: 11, state: 'open', title: 'Blocked one' }],
        parent: intent,
      }
    );
    const { out } = go(['7', 'a'], deps);

    expect(out).toContain('#11 Blocked one (blocked by this issue)');
    expect(out).toContain('#5 The intent (parent Intent)');
  });

  it('lists only open siblings that share an ID', () => {
    const body = (ids: string) =>
      `### Requirement IDs covered\n\n${ids}\n\n### Summary\n\nPIN-09 here`;
    const { deps } = setup(
      { body: body('PIN-01, PIN-02'), title: 'Spec: M1.1 A' },
      {
        parent: intent,
        siblings: [
          { body: body('PIN-02'), number: 20, state: 'open', title: 'Shares' },
          { body: body('MAP-01'), number: 21, state: 'open', title: 'Other' },
          { body: body('PIN-01'), number: 22, state: 'closed', title: 'Done' },
          {
            body: body('PIN-01'),
            html_url: SELF,
            number: 7,
            state: 'open',
            title: 'Self',
          },
          { body: 'PIN-09 only', number: 23, state: 'open', title: 'No sect' },
          { number: 24, state: 'open', title: 'No body' },
        ],
      }
    );
    const { out } = go(['7', 'a'], deps);

    expect(out).toContain('#20 Shares (shares PIN-02)');
    expect(out).not.toContain('#21');
    expect(out).not.toContain('#22');
    expect(out).not.toContain('#23');
    expect(out).not.toContain('#7 ');
  });

  it('lists a sibling in another repo that has the same number', () => {
    const { deps } = setup(
      {
        body: '### Requirement IDs covered\n\nPIN-01',
        title: 'Spec: M1.1 A',
      },
      {
        parent: intent,
        siblings: [
          {
            body: '### Requirement IDs covered\n\nPIN-01',
            html_url: 'https://github.com/other/place/issues/7',
            number: 7,
            state: 'open',
            title: 'Twin',
          },
        ],
      }
    );

    expect(go(['7', 'a'], deps).out).toContain('#7 Twin (shares PIN-01)');
  });

  it("reads the siblings from the parent's own repo", () => {
    const { calls, deps } = setup(
      { title: 'Spec: M1.1 A' },
      {
        parent: {
          ...intent,
          repository_url: 'https://api.github.com/repos/other/place',
        },
      }
    );

    expect(go(['7', 'a'], deps).code).toBe(0);
    expect(calls).toContainEqual([
      'api',
      '--paginate',
      'repos/other/place/issues/5/sub_issues',
      '--jq',
      '.[] | @json',
    ]);
  });

  it('stops on a parent with no repo URL', () => {
    const { code, err } = go(
      ['7', 'a'],
      setup(
        { title: 'Spec: M1.1 A' },
        { parent: { ...intent, repository_url: 'https://evil.test/x' } }
      ).deps
    );

    expect(code).toBe(1);
    expect(err).toContain('repo URL');
  });

  it('lists no parent that is not an Intent', () => {
    const { calls, deps } = setup(
      { title: 'Spec: M1.1 A' },
      {
        parent: { ...intent, type: { name: 'Spec' } },
        siblings: [{ number: 20, state: 'open', title: 'S' }],
      }
    );
    const { out } = go(['7', 'a'], deps);

    expect(out).not.toContain('#5');
    expect(out).not.toContain('#20');
    expect(calls.some(c => c.join(' ').includes('sub_issues'))).toBe(false);
  });

  it('lists a parent that has no Type as no parent', () => {
    const { deps } = setup(
      { title: 'Spec: M1.1 A' },
      { parent: { number: 5, state: 'open', title: 'T' } }
    );

    expect(go(['7', 'a'], deps).out).not.toContain('#5');
  });

  describe('the pattern files', () => {
    const patterns = {
      'domain.md': "---\npaths:\n  - 'lib/domain/**'\n---\n# Domain\n",
      'tree-data.md': "---\npaths:\n  - 'server/trees/**'\n---\n# Tree\n",
    };

    it('lists the file whose paths match a path that the issue cites', () => {
      const { out } = go(
        ['7', 'x'],
        setup(
          {
            body: 'Change `server/trees/repository.mts:40`.',
            title: 'Chore: A',
            type: 'Chore',
          },
          { patterns }
        ).deps
      );

      expect(out).toContain('Pattern files:\n- docs/patterns/tree-data.md');
      expect(out).not.toContain('domain.md');
    });

    it('lists none when the issue cites no matching path', () => {
      const { out } = go(
        ['7', 'x'],
        setup(
          {
            body: 'Change `README.md` and server/trees/repository.mts.',
            title: 'Chore: A',
            type: 'Chore',
          },
          { patterns }
        ).deps
      );

      expect(out).toContain('Pattern files: none');
    });

    it('lists them when the setup is skipped too', () => {
      const { out } = go(
        ['7', 'x'],
        setup(
          { body: '`lib/domain/a.mts`', title: 'Chore: A', type: 'Chore' },
          { branches: 'chore/C7-x', patterns }
        ).deps
      );

      expect(out).toContain('Pattern files:\n- docs/patterns/domain.md');
      expect(out).toContain('Skipped the setup');
    });
  });

  describe('the design files', () => {
    it('lists the file whose paths match a path that the issue cites', () => {
      const { out } = go(
        ['7', 'x'],
        setup({
          body: 'Change `features/map/style.ts`.',
          title: 'Chore: A',
          type: 'Chore',
        }).deps
      );

      expect(out).toContain('Design files:\n- design/topics/map.md');
    });

    it('lists none when the issue cites no design path', () => {
      const { out } = go(
        ['7', 'x'],
        setup({
          body: 'Change `server/trees/repository.mts`.',
          title: 'Chore: A',
          type: 'Chore',
        }).deps
      );

      expect(out).toContain('Design files: none');
    });
  });

  it('prints none when nothing is related', () => {
    const { out } = go(['7', 'a'], setup({ title: 'Spec: M1.1 A' }).deps);

    expect(out).toContain('Related issues: none');
  });

  it('stops on a failed parent read that is not a 404', () => {
    const { code, err } = go(
      ['7', 'a'],
      setup({ title: 'Spec: M1.1 A' }, { parent: 'broken' }).deps
    );

    expect(code).toBe(1);
    expect(err).toContain('Server Error');
  });

  it('reads a 404 from stderr only, not from the message', () => {
    const inCommand = ghError(
      'gh: Server Error (HTTP 500)',
      'Command failed: gh api repos/{owner}/{repo}/issues/1404/parent'
    );
    const noStderr = new Error('gh: Not Found (HTTP 404)');

    for (const parent of [inCommand, noStderr]) {
      const { code } = go(
        ['7', 'a'],
        setup({ title: 'Spec: M1.1 A' }, { parent }).deps
      );

      expect(code).toBe(1);
    }
  });

  it('stops on a failed issue read', () => {
    const { deps } = setup({ title: 'Spec: M1.1 A' });
    const failing: Deps = {
      ...deps,
      gh: () => {
        throw 'plain failure';
      },
    };
    const { code, err } = go(['7', 'a'], failing);

    expect(code).toBe(1);
    expect(err).toContain('plain failure');
  });

  it('makes the branch and the plan file', () => {
    const { deps, gitCalls, written } = setup({
      title: 'Chore: Do it',
      type: 'Chore',
    });
    const { out } = go(['7', 'do-it'], deps);

    expect(gitCalls).toContainEqual(['fetch', 'origin', 'main']);
    expect(gitCalls).toContainEqual([
      'switch',
      '-c',
      'chore/C7-do-it',
      'origin/main',
    ]);
    expect(written).toEqual([
      [
        'plans/chores/C7-do-it.md',
        '# Plan: x\n\n- **Spec:** #7\n- **Status:** draft\n',
      ],
    ]);
    expect(out).toContain('Made chore/C7-do-it and plans/chores/C7-do-it.md');
  });

  it('stops before the switch if the working tree has changes', () => {
    const { deps, gitCalls, written } = setup(
      { title: 'Chore: Do it', type: 'Chore' },
      { dirty: ' M package.json\n' }
    );
    const { code, err } = go(['7', 'do-it'], deps);

    expect(code).toBe(1);
    expect(err).toContain('changes');
    expect(gitCalls.some(c => c[0] === 'switch')).toBe(false);
    expect(written).toEqual([]);
  });

  it('skips the setup if a local branch, a branch on origin or a plan file exists', () => {
    const chore = { title: 'Chore: Do it', type: 'Chore' };
    const local = setup(chore, { branches: 'chore/C7-old\n' });
    const remote = setup(chore, {
      remote: 'abc123\trefs/heads/chore/C7-other\n',
    });
    const file = setup(chore, {
      files: ['C7-plan.md', 'C70-x.md', 'notes.txt'],
    });
    const none = setup(chore, { files: ['C70-x.md', 'C7-x.txt'] });
    const l = go(['7', 'do-it'], local.deps);
    const r = go(['7', 'do-it'], remote.deps);
    const f = go(['7', 'do-it'], file.deps);

    expect(l.out).toContain('Skipped the setup: chore/C7-old exists.');
    expect(r.out).toContain('Skipped the setup: origin/chore/C7-other exists.');
    expect(f.out).toContain(
      'Skipped the setup: plans/chores/C7-plan.md exists.'
    );

    for (const { gitCalls, written } of [local, remote, file]) {
      expect(written).toEqual([]);
      expect(gitCalls.some(c => c[0] === 'switch')).toBe(false);
    }

    expect(go(['7', 'do-it'], none.deps).out).toContain('Made');
  });

  it('prints the names that it found, not the names of the new slug', () => {
    const { deps } = setup(
      { title: 'Chore: Do it', type: 'Chore' },
      { remote: 'abc123\trefs/heads/chore/C7-old\n' }
    );
    const { out } = go(['7', 'new-slug'], deps);

    expect(out).toContain('Plan path: plans/chores/C7-old.md');
    expect(out).toContain('Branch: chore/C7-old');
    expect(out).not.toContain('new-slug');
  });

  it('takes the slug of a found plan file', () => {
    const { deps } = setup(
      { title: 'Spec: M1.1 A' },
      { files: ['M1.1-found.md'] }
    );
    const { out } = go(['7', 'new-slug'], deps);

    expect(out).toContain('Plan path: plans/M1.1-found.md');
    expect(out).toContain('Branch: spec/M1.1-found');
  });

  it('stops on a Type other than Spec, Bug or Chore', () => {
    const none = go(['7', 'a'], setup({ title: 'x', type: null }).deps);
    const intentType = go(
      ['7', 'a'],
      setup({ title: 'x', type: 'Intent' }).deps
    );

    expect(none.code).toBe(1);
    expect(none.err).toContain('no Type');
    expect(intentType.code).toBe(1);
    expect(intentType.err).toContain('Intent');
  });

  it('stops on a Spec title with no id', () => {
    const { code, err } = go(
      ['7', 'a'],
      setup({ title: 'Spec: Pins without an id' }).deps
    );

    expect(code).toBe(1);
    expect(err).toContain('no id');
  });

  it('stops on a slug that is not lower-case words with hyphens', () => {
    const { deps } = setup({ title: 'Spec: M1.1 A' });

    for (const slug of ['Bad', 'a_b', '-a', 'a--b', 'a-', '']) {
      const { code, err } = go(['7', slug], deps);

      expect(code).toBe(1);
      expect(err).toContain('slug');
    }
  });

  it('stops on a bad usage', () => {
    const { deps } = setup({ title: 'Spec: M1.1 A' });

    expect(go([], deps).code).toBe(1);
    expect(go(['x', 'a'], deps).err).toContain('Usage');
    expect(go(['7'], deps).code).toBe(1);
  });
});
