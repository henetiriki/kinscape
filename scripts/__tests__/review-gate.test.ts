import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { runScript } from '@ks/scripts/__tests__/run-script';

// plans/chores/C836-review-gate.md: `Review` is a required check, so a PR that changes only plans/**
// gets a green job and no Claude run, and the job fails while the review has open findings.
type Step = {
  env?: Record<string, string>;
  id?: string;
  if?: string;
  name?: string;
  run?: string;
  shell?: string;
};
type Workflow = {
  jobs: Record<string, { steps: Step[] }>;
  on: { pull_request: Record<string, unknown> };
};

const workflow = () =>
  parse(
    readFileSync(
      join(process.cwd(), '.github/workflows/claude-code-review.yml'),
      'utf8'
    )
  ) as Workflow;
const steps = () => workflow().jobs['claude-review'].steps;
const at = (name: string) => steps().findIndex(step => step.name === name);
const step = (name: string) => steps()[at(name)];

const SAME = "Check that this workflow is main's";
const PLANS = 'Find a PR that changes only plans';
const GATE = 'Fail on open findings';
const NOT_PLANS_ONLY =
  "steps.same.outputs.same == 'true' && steps.plans.outputs.plans_only != 'true'";

describe('the steps of the review job that gate Review', () => {
  it('has no path filter: a skipped required workflow stays pending', () => {
    expect(workflow().on.pull_request).not.toHaveProperty('paths-ignore');
    expect(workflow().on.pull_request).not.toHaveProperty('paths');
  });

  it('lists the PR files after the check on main’s copy and before the first step it gates, and fails last', () => {
    expect(at(PLANS)).toBeGreaterThan(at(SAME));
    expect(at(PLANS)).toBeLessThan(at('Show that the review started'));
    expect(step(PLANS).id).toBe('plans');
    expect(at(GATE)).toBe(steps().length - 1);
  });

  it.each([
    'Show that the review started',
    'Write the changes since the last review',
    'Run Claude Code',
  ])('skips %s for a plans-only PR', name => {
    expect(step(name).if).toBe(NOT_PLANS_ONLY);
  });

  it('leaves a plans-only PR green: nothing reports a missing review', () => {
    expect(step('Report a missing review').if).toBe(
      "!cancelled() && steps.claude-review.outputs.conclusion == '' && steps.plans.outputs.plans_only != 'true'"
    );
  });

  // The gate turns a run red when its review has open findings, so the next push is reviewed for what
  // changed since that run too (plans/chores/C836-review-gate.md, D1).
  it('reads a red run as a review for the changes since, but not a cancelled one', () => {
    const { run } = step('Write the changes since the last review');

    expect(run).not.toContain('--status');
    expect(run).toContain(
      '(.conclusion == "success" or .conclusion == "failure")'
    );
  });

  it('runs the gate only after Claude succeeded', () => {
    expect(step(GATE).if).toBe("steps.claude-review.outcome == 'success'");
    expect(step(GATE).shell).toBe('bash');
  });

  it('passes the PR’s text through env, not into the script', () => {
    for (const name of [PLANS, GATE]) {
      expect(step(name).run, name).not.toContain('${{');
    }
    expect(step(GATE).env).toMatchObject({
      GH_REPO: '${{ github.repository }}',
      HEAD_SHA: '${{ github.event.pull_request.head.sha }}',
      PR_NUMBER: '${{ github.event.pull_request.number }}',
    });
  });
});

describe('the step that finds a PR that changes only plans', () => {
  // `gh` prints $FILES, one path a line; it fails when $FAIL is set.
  const gh = `echo "$*" >> "$LOG"
[ -z "$FAIL" ] || exit 1
printf '%s' "$FILES"`;
  const find = (files: string[], fail = '') =>
    runScript(
      step(PLANS).run,
      { gh },
      {
        FAIL: fail,
        FILES: files.join('\n'),
        GH_REPO: 'owner/repo',
        PR_NUMBER: '7',
      }
    );

  it('reads the files of the PR', () => {
    expect(find(['plans/a.md']).log).toBe(
      'api --paginate repos/owner/repo/pulls/7/files --jq .[].filename\n'
    );
  });

  it.each([
    [['plans/chores/C1-a.md'], 'true'],
    [['plans/chores/C1-a.md', 'plans/README.md'], 'true'],
    [['plans/a.md', 'docs/b.md'], 'false'],
    [['scripts/plans/a.md'], 'false'],
    [['plans-old/a.md'], 'false'],
    [[], 'false'],
  ])('for %j says plans_only=%s', (files, expected) => {
    const { outputs, status } = find(files);

    expect({ outputs, status }).toEqual({
      outputs: `plans_only=${expected}\n`,
      status: 0,
    });
  });

  it('says false when the list fails, so Claude runs', () => {
    const { outputs, status } = find([], '1');

    expect({ outputs, status }).toEqual({
      outputs: 'plans_only=false\n',
      status: 0,
    });
  });
});

describe('the step that fails on open findings', () => {
  const HEAD = 'a'.repeat(40);
  const OLD = 'b'.repeat(40);
  const BOT = 'github-actions[bot]';
  const inline = (
    login: string,
    commit: string,
    reply: null | number = null
  ) => ({
    in_reply_to_id: reply,
    original_commit_id: commit,
    user: { login },
  });
  const issue = (login: string, body: string) => ({ body, user: { login } });

  // `gh` answers each of the two calls from a fixture file, and applies the call's --jq with jq,
  // as gh does. It fails when $FAIL is set.
  const gh = `echo "$*" >> "$LOG"
[ -z "$FAIL" ] || exit 1
case "$*" in
  *"/pulls/7/comments"*) file="$INLINE" ;;
  *"/issues/7/comments"*) file="$ISSUE" ;;
  *) echo "unexpected gh call: $*" >&2; exit 1 ;;
esac
while [ "$#" -gt 0 ]; do
  [ "$1" != --jq ] || expr="$2"
  shift
done
jq -r "$expr" "$file"`;

  const gate = (
    inlineComments: object[],
    issueComments: object[] = [],
    fail = ''
  ) => {
    const dir = mkdtempSync(join(tmpdir(), 'review-gate-'));

    try {
      writeFileSync(join(dir, 'inline.json'), JSON.stringify(inlineComments));
      writeFileSync(join(dir, 'issue.json'), JSON.stringify(issueComments));

      return runScript(
        step(GATE).run,
        { gh },
        {
          FAIL: fail,
          GH_REPO: 'owner/repo',
          HEAD_SHA: HEAD,
          INLINE: join(dir, 'inline.json'),
          ISSUE: join(dir, 'issue.json'),
          PR_NUMBER: '7',
        },
        ['-e', '-o', 'pipefail']
      );
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  };

  it('passes a review with nothing open', () => {
    expect(
      gate([], [issue(BOT, 'Open findings: 0\n\nAll addressed.')])
    ).toMatchObject({
      status: 0,
    });
  });

  it('fails on an inline comment by the bot on the head commit, and counts it', () => {
    const { status, stdout } = gate([inline(BOT, HEAD), inline(BOT, HEAD)]);

    expect(status).toBe(1);
    expect(stdout).toContain('::error::');
    expect(stdout).toContain('2');
  });

  it('counts comments from every run on the head commit: a re-run adds none', () => {
    expect(gate([inline(BOT, HEAD)]).status).toBe(1);
  });

  it.each([
    ['one on an earlier commit', [inline(BOT, OLD)]],
    ['a reply', [inline(BOT, HEAD, 123)]],
    ['one by someone else', [inline('kinscape-agent[bot]', HEAD)]],
  ])('does not count %s', (_, comments) => {
    expect(gate(comments).status).toBe(0);
  });

  it('fails on the count in the latest Open findings comment of the bot', () => {
    const { status, stdout } = gate(
      [],
      [issue(BOT, 'Open findings: 2\n\nSee the threads.')]
    );

    expect(status).toBe(1);
    expect(stdout).toContain('2');
  });

  it('adds the earlier findings that are still open to the inline ones', () => {
    const { status, stdout } = gate(
      [inline(BOT, HEAD)],
      [issue(BOT, 'Open findings: 2')]
    );

    expect(status).toBe(1);
    expect(stdout).toContain('3');
  });

  it('reads only the latest Open findings comment', () => {
    expect(
      gate([], [issue(BOT, 'Open findings: 2'), issue(BOT, 'Open findings: 0')])
        .status
    ).toBe(0);
  });

  it.each([
    ['one by a person', issue('someone', 'Open findings: 3')],
    ['one that does not start the comment', issue(BOT, 'See Open findings: 3')],
    ['a comment with no count', issue(BOT, 'Reviewing…')],
  ])('ignores %s', (_, comment) => {
    expect(gate([], [comment]).status).toBe(0);
  });

  it('fails when a call fails, so a broken gate never passes', () => {
    expect(gate([], [], '1').status).not.toBe(0);
  });
});
