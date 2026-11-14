import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

import type { Step } from '@ks/scripts/__tests__/types';

// The steps of the review job in claude-code-review.yml, for the tests that read them.
type Job = { permissions?: Record<string, string>; steps: Step[] };
type Workflow = {
  jobs: Record<string, Job>;
  on: { pull_request: Record<string, unknown> };
};

export const MAIN_COPY_CHECK = "Check that this workflow is main's";
// What the steps that Claude, or a post to the PR, need besides main's copy: not a plans-only PR.
export const NOT_PLANS_ONLY =
  "steps.same.outputs.same == 'true' && steps.plans.outputs.plans_only != 'true'";

export const reviewWorkflow = () =>
  parse(
    readFileSync(
      join(process.cwd(), '.github/workflows/claude-code-review.yml'),
      'utf8'
    )
  ) as Workflow;
export const reviewJob = () => reviewWorkflow().jobs['claude-review'];
export const stepIndex = (name: string) =>
  reviewJob().steps.findIndex(step => step.name === name);
export const stepNamed = (name: string) => reviewJob().steps[stepIndex(name)];
