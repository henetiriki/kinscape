import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) =>
  readFileSync(join(root, '.github/workflows', file), 'utf8');

// "A draft plan PR the owner approved" is written out four times: in the `run-name` and the job's
// `if:` of claude.yml (which skips it) and of claude-build.yml (which runs on it). The title can't
// see job results, so the copies can't share a variable; this keeps them from drifting.
const PLAN_PR =
  /github\.event\.review\.state == 'approved'[\s\S]*?endsWith\(github\.event\.pull_request\.title, '\(plan\)'\)/g;

// claude.yml's two copies also share the bot check and the `@claude` mention around it.
const WHOLE = /github\.actor != 'henetiriki-bot'[\s\S]*?'@claude'\)/g;

// claude-plan.yml's `run-name` and plan job's `if:` share the label check and the owner check.
const START =
  /github\.event\.issue\.state == 'open'[\s\S]*?github\.actor == github\.repository_owner/g;

const copies = (file: string, pattern: RegExp) =>
  (read(file).match(pattern) ?? []).map(copy => copy.replace(/\s+/g, ' '));

describe('the plan-PR condition', () => {
  const [reference] = copies('claude-build.yml', PLAN_PR);

  it('is written in the run-name and the job of claude-build.yml', () => {
    expect(reference).toBeDefined();
    expect(copies('claude-build.yml', PLAN_PR)).toHaveLength(2);
  });

  it.each(['claude.yml', 'claude-build.yml'])(
    'is the same in both copies in %s',
    file => {
      expect(
        copies(file, PLAN_PR),
        `${file} has two copies of the plan-PR condition (run-name and job \`if:\`); each must match claude-build.yml's`
      ).toEqual([reference, reference]);
    }
  );

  it('is the same in the whole run-name and job condition of claude.yml', () => {
    const [runName, job] = copies('claude.yml', WHOLE);

    expect(
      copies('claude.yml', WHOLE),
      'claude.yml needs the run-name and the job `if:` to share one condition, from the bot check to `@claude`'
    ).toHaveLength(2);
    expect(job).toBe(runName);
  });
});

describe('the plan-start condition', () => {
  it('is the same in the run-name and the job of claude-plan.yml, and ends with the owner check', () => {
    const [runName, job] = copies('claude-plan.yml', START);

    expect(
      copies('claude-plan.yml', START),
      'claude-plan.yml needs the run-name and the plan job `if:` to share one condition, ending with `github.actor == github.repository_owner`'
    ).toHaveLength(2);
    expect(job).toBe(runName);
  });
});
