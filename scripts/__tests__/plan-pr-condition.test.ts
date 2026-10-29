import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) =>
  readFileSync(join(root, '.github/workflows', file), 'utf8');

// "A draft plan PR the owner approved" is written out four times: in the `run-name` and the job's
// `if:` of claude.yml (which skips it) and of claude-build.yml (which runs on it). The title can't
// see job results, so the copies can't share a variable; this keeps them from drifting.
const CONDITION =
  /github\.event\.review\.state == 'approved'[\s\S]*?endsWith\(github\.event\.pull_request\.title, '\(plan\)'\)/g;

const copies = (file: string) =>
  (read(file).match(CONDITION) ?? []).map(copy => copy.replace(/\s+/g, ' '));

describe('the plan-PR condition', () => {
  const [reference] = copies('claude-build.yml');

  it('is written in the run-name and the job of claude-build.yml', () => {
    expect(reference).toBeDefined();
    expect(copies('claude-build.yml')).toHaveLength(2);
  });

  it.each(['claude.yml', 'claude-build.yml'])(
    'is the same in both copies in %s',
    file => {
      expect(
        copies(file),
        `${file} has two copies of the plan-PR condition (run-name and job \`if:\`); each must match claude-build.yml's`
      ).toEqual([reference, reference]);
    }
  );
});
