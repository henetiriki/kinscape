import { describe, expect, it, vi } from 'vitest';

import type { PlanNewDeps as Deps } from '@ks/scripts/types.ts';

import { run } from '@ks/scripts/plan-new.mts';

type Issue = {
  body?: string;
  title: string;
  type?: null | string;
};
type Related = { body?: string; number: number; state: string; title: string };

const notFound = () => {
  throw new Error('gh: Not Found (HTTP 404)');
};

const setup = (
  issue: Issue,
  options: {
    blocking?: Related[];
    branches?: string;
    files?: string[];
    parent?: 'broken' | 'none' | ({ type?: { name: string } } & Related);
    siblings?: Related[];
  } = {}
) => {
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
        issueType: issue.type === null ? null : { name: issue.type ?? 'Spec' },
        number: 7,
        title: issue.title,
      });
    }

    const path = args[args.length - 3] ?? '';
    const target = args.find(a => a.startsWith('repos/')) ?? path;

    if (target.endsWith('/dependencies/blocking')) {
      return lines(options.blocking ?? []);
    }

    if (target.endsWith('/parent')) {
      if (options.parent === 'broken') {
        throw new Error('gh: Server Error (HTTP 500)');
      }

      if (options.parent === undefined || options.parent === 'none') {
        return notFound();
      }

      return JSON.stringify(options.parent);
    }

    if (target.endsWith('/sub_issues')) {
      return lines(options.siblings ?? []);
    }

    throw new Error(`unexpected ${args.join(' ')}`);
  });
  const deps: Deps = {
    files: {
      list: () => options.files ?? [],
      read: () => '# Plan: x\n\n- **Spec:** #\n- **Status:** draft\n',
      write: (path, text) => {
        written.push([path, text]);
      },
    },
    gh,
    git: args => {
      gitCalls.push(args);

      return args[0] === 'for-each-ref' ? (options.branches ?? '') : '';
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
        parent: {
          number: 5,
          state: 'open',
          title: 'The intent',
          type: { name: 'Intent' },
        },
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
        parent: {
          number: 5,
          state: 'open',
          title: 'Intent',
          type: { name: 'Intent' },
        },
        siblings: [
          { body: body('PIN-02'), number: 20, state: 'open', title: 'Shares' },
          { body: body('MAP-01'), number: 21, state: 'open', title: 'Other' },
          { body: body('PIN-01'), number: 22, state: 'closed', title: 'Done' },
          { body: body('PIN-01'), number: 7, state: 'open', title: 'Self' },
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

  it('lists no parent that is not an Intent', () => {
    const { calls, deps } = setup(
      { title: 'Spec: M1.1 A' },
      {
        parent: {
          number: 5,
          state: 'open',
          title: 'Not intent',
          type: { name: 'Spec' },
        },
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

  it('sets up the branch and the plan file', () => {
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
    expect(out).toContain('Set up chore/C7-do-it and plans/chores/C7-do-it.md');
  });

  it('skips the setup if the branch or the plan file exists', () => {
    const branch = setup(
      { title: 'Chore: Do it', type: 'Chore' },
      { branches: 'origin/chore/C7-other\n' }
    );
    const file = setup(
      { title: 'Chore: Do it', type: 'Chore' },
      { files: ['C7-other.md', 'C70-x.md', 'notes.txt'] }
    );
    const none = setup(
      { title: 'Chore: Do it', type: 'Chore' },
      { files: ['C70-x.md', 'C7-x.txt'] }
    );
    const b = go(['7', 'do-it'], branch.deps);
    const f = go(['7', 'do-it'], file.deps);

    expect(b.out).toContain('Skipped the setup: origin/chore/C7-other exists.');
    expect(f.out).toContain(
      'Skipped the setup: plans/chores/C7-other.md exists.'
    );
    expect(branch.written).toEqual([]);
    expect(file.written).toEqual([]);
    expect(
      [...branch.gitCalls, ...file.gitCalls].some(c => c[0] === 'switch')
    ).toBe(false);
    expect(go(['7', 'do-it'], none.deps).out).toContain('Set up');
  });

  it('stops on a Type other than Spec, Bug or Chore', () => {
    const none = go(['7', 'a'], setup({ title: 'x', type: null }).deps);
    const intent = go(['7', 'a'], setup({ title: 'x', type: 'Intent' }).deps);

    expect(none.code).toBe(1);
    expect(none.err).toContain('no Type');
    expect(intent.code).toBe(1);
    expect(intent.err).toContain('Intent');
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
