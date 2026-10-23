import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { run } from '../approve-plan.mts';

const PLAN = `# Plan: X

- **Status:** draft

## Decisions

**D1 · First** · Decides: PO

- **A.** One.
- **B.** Two.
- **Other:** your own.

Recommended: A, because.

**D2 · Second** · Decides: Tech lead

- **A.** One.
- **B.** Two.

## Files that change

Nothing here.
`;

let root: string;
let errors: string[];

const read = () => readFileSync(join(root, 'plan.md'), 'utf8');

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'approve-plan-'));
  errors = [];
  vi.spyOn(console, 'error').mockImplementation((message: string) => {
    errors.push(message);
  });
  writeFileSync(join(root, 'plan.md'), PLAN);
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(root, { force: true, recursive: true });
});

describe('run', () => {
  it('records every answer and approves', () => {
    expect(run(root, ['plan.md', '@alex', 'D1=a', 'D2=B'])).toBe(0);
    expect(read()).toBe(
      PLAN.replace('draft', 'approved')
        .replace('Recommended: A, because.', '**Answer: A** (@alex)')
        .replace(
          '- **B.** Two.\n\n## Files',
          '- **B.** Two.\n\n**Answer: B** (@alex)\n\n## Files'
        )
    );
  });

  it('records an Other answer with the reviewer', () => {
    expect(run(root, ['plan.md', 'alex', 'D1=other:  my way ', 'D2=A'])).toBe(
      0
    );
    expect(read()).toContain('**Answer: Other:** my way (@alex)');
  });

  it('replaces an earlier answer', () => {
    run(root, ['plan.md', 'alex', 'D1=A', 'D2=A']);

    expect(run(root, ['plan.md', 'sam', 'D2=B'])).toBe(0);
    expect(read()).toContain('**Answer: B** (@sam)');
    expect(read()).not.toContain('D2=A');
    expect(read().match(/\*\*Answer/g)).toHaveLength(2);
  });

  it('removes a Recommended line left beside an earlier answer', () => {
    writeFileSync(
      join(root, 'plan.md'),
      PLAN.replace(
        'Recommended: A, because.',
        '**Answer: A** (@x)\nRecommended: B.'
      )
    );

    expect(run(root, ['plan.md', 'alex', 'D1=B', 'D2=A'])).toBe(0);
    expect(read()).not.toContain('Recommended');
    expect(read()).toContain('**Answer: B** (@alex)');
  });

  it('records what it has, lists the open decisions and stays draft', () => {
    expect(run(root, ['plan.md', 'alex', 'D1=A'])).toBe(1);
    expect(read()).toContain('**Answer: A** (@alex)');
    expect(read()).toContain('Status:** draft');
    expect(errors).toEqual(['Open decisions: D2. Status stays draft.']);
  });

  it('approves a plan with no decisions', () => {
    writeFileSync(join(root, 'plan.md'), '- **Status:** draft\n\n## Files\n');

    expect(run(root, ['plan.md', 'alex'])).toBe(0);
    expect(read()).toBe('- **Status:** approved\n\n## Files\n');
  });

  it('approves a plan whose Decisions section is last', () => {
    writeFileSync(
      join(root, 'plan.md'),
      '- **Status:** draft\n\n## Decisions\n\n**D1 · X** · Decides: PO\n- **A.** Yes.'
    );

    expect(run(root, ['plan.md', 'alex', 'D1=A'])).toBe(0);
    expect(read()).toMatch(
      /- \*\*A\.\*\* Yes\.\n\n\*\*Answer: A\*\* \(@alex\)$/
    );
  });

  it.each([
    [['D3=A'], 'D3: no such decision in plan.md'],
    [['D1=C'], 'D1: C is not an option'],
    [['D1'], 'D1: not D<n>=<letter> or D<n>=other: <text>'],
  ])('writes nothing for %j', (answers, message) => {
    expect(run(root, ['plan.md', 'alex', 'D2=A', ...answers])).toBe(1);
    expect(read()).toBe(PLAN);
    expect(errors).toEqual([message]);
  });

  it.each([
    [[]],
    [['plan.md']],
    [['plan.md', 'bad login']],
    [['plan.md', '-x']],
  ])('prints usage for %j', args => {
    expect(run(root, args)).toBe(1);
    expect(errors[0]).toMatch(/^Usage/);
  });
});
