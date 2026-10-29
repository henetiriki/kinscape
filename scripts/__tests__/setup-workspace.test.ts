import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const root = process.cwd();

type Step = {
  run?: string;
  uses?: string;
  with?: Record<string, string>;
};
type Workflow = { jobs: Record<string, { steps: Step[] }> };

const steps = (file: string, job: string) =>
  (
    parse(
      readFileSync(join(root, '.github/workflows', file), 'utf8')
    ) as Workflow
  ).jobs[job].steps;

// Callers name the action by repo and `@main`: see .github/actions/setup-workspace/action.yml.
const ACTION = 'henetiriki/kinscape/.github/actions/setup-workspace@main';

// The inputs are strings: `persist-credentials` keeps the PAT for the push that starts CI.
const CALLERS = [
  [
    'claude.yml',
    'claude',
    {
      'persist-credentials': 'true',
      playwright: 'true',
      token: '${{ secrets.KINSCAPE_BOT_PAT }}',
    },
  ],
  [
    'claude-run.yml',
    'run',
    {
      'persist-credentials': 'false',
      playwright: '${{ inputs.playwright }}',
      ref: '${{ inputs.ref }}',
    },
  ],
] as const;

describe('the setup-workspace action', () => {
  it.each(CALLERS)(
    'is called once by %s (%s) with its inputs',
    (file, job, inputs) => {
      const calls = steps(file, job).filter(step => step.uses === ACTION);

      expect(calls, `${file} needs one call to ${ACTION}`).toHaveLength(1);
      expect(calls[0].with).toEqual(inputs);
    }
  );

  it.each(CALLERS)('leaves no copy of its steps in %s (%s)', (file, job) => {
    const copied = steps(file, job).filter(
      step =>
        step.run?.includes('npm ci') ||
        step.uses?.startsWith('actions/checkout@') ||
        step.uses?.startsWith('actions/setup-node@') ||
        step.uses?.startsWith('actions/cache') ||
        Object.values(step.with ?? {}).some(value =>
          /ms-playwright|\.next\/cache/.test(value)
        )
    );

    expect(copied, `${file} copies steps the action already runs`).toEqual([]);
  });
});
