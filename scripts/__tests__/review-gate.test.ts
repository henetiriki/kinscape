import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  MAIN_COPY_CHECK,
  NOT_PLANS_ONLY,
  reviewJob,
  reviewWorkflow,
  stepIndex,
  stepNamed,
} from '@ks/scripts/__tests__/review-workflow';
import { runScript } from '@ks/scripts/__tests__/run-script';

// Plan C836: `Review` is a required check. A PR that changes only plans/** gets a green job and no
// Claude run. The job fails while the review has open findings.
const PLANS = 'Find a PR that changes only plans';
const SINCE = 'Write the changes since the last review';
const GATE = 'Fail on open findings';

describe('the steps of the review job that gate Review', () => {
  it('has no path filter: a skipped required workflow stays pending', () => {
    expect(reviewWorkflow().on.pull_request).not.toHaveProperty('paths-ignore');
    expect(reviewWorkflow().on.pull_request).not.toHaveProperty('paths');
  });

  it('lists the PR files after the check on main’s copy and before the first step it gates, and fails last', () => {
    expect(stepIndex(PLANS)).toBeGreaterThan(stepIndex(MAIN_COPY_CHECK));
    expect(stepIndex(PLANS)).toBeLessThan(
      stepIndex('Show that the review started')
    );
    expect(stepNamed(PLANS).id).toBe('plans');
    expect(stepIndex(GATE)).toBe(reviewJob().steps.length - 1);
  });

  it.each(['Show that the review started', SINCE, 'Run Claude Code'])(
    'skips %s for a plans-only PR',
    name => {
      expect(stepNamed(name).if).toBe(NOT_PLANS_ONLY);
    }
  );

  it('leaves a plans-only PR green: nothing reports a missing review', () => {
    expect(stepNamed('Report a missing review').if).toBe(
      "!cancelled() && steps.claude-review.outputs.conclusion == '' && steps.plans.outputs.plans_only != 'true'"
    );
  });

  it('runs the gate only after Claude succeeded', () => {
    expect(stepNamed(GATE).if).toBe("steps.claude-review.outcome == 'success'");
    expect(stepNamed(GATE).shell).toBe('bash');
  });

  it('passes the PR’s text through env, not into the script', () => {
    for (const name of [PLANS, SINCE, GATE]) {
      expect(stepNamed(name).run, name).not.toContain('${{');
    }
    expect(stepNamed(GATE).env).toMatchObject({
      GH_REPO: '${{ github.repository }}',
      HEAD_SHA: '${{ github.event.pull_request.head.sha }}',
      PR_NUMBER: '${{ github.event.pull_request.number }}',
    });
  });
});

describe('the step that finds a PR that changes only plans', () => {
  // `gh` prints $FILES, one path a line. It fails when $FAIL is set.
  const gh = `echo "$*" >> "$LOG"
[ -z "$FAIL" ] || exit 1
printf '%s' "$FILES"`;
  const find = (files: string[], fail = '') =>
    runScript(
      stepNamed(PLANS).run,
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

// `gh` answers each call from a fixture file under $FIX. It applies the call's --jq with jq, as gh
// does. Without a fixture, or with $FAIL set, it fails.
const GH_FIXTURES = `echo "$*" >> "$LOG"
[ -z "$FAIL" ] || exit 1
args="$*"
case "$args" in
  "run list "*) file="$FIX/runs.json" ;;
  *"/compare/"*) echo DIFF; exit 0 ;;
  "pr view "*) file="$FIX/commits.json" ;;
  *"/actions/runs/"*)
    id="\${args##*runs/}"; id="\${id%%/*}"
    case "$args" in
      *"/artifacts"*) file="$FIX/artifacts-$id.json" ;;
      *"/jobs"*) file="$FIX/jobs-$id.json" ;;
    esac ;;
  *"/pulls/7/comments"*) file="$FIX/inline.json" ;;
  *"/pulls/7/files"*) file="$FIX/files.json" ;;
  *"/issues/7/comments"*) file="$FIX/issue.json" ;;
esac
if [ -z "$file" ] || ! [ -f "$file" ]; then echo "unexpected gh call: $*" >&2; exit 1; fi
while [ "$#" -gt 0 ]; do
  [ "$1" != --jq ] || expr="$2"
  shift
done
jq -r "$expr" "$file"`;

// Runs a step over fixtures, given as file name and JSON.
const withFixtures = <T>(
  fixtures: Record<string, unknown>,
  run: (fix: string, dir: string) => T
) => {
  const dir = mkdtempSync(join(tmpdir(), 'review-gate-'));
  const fix = join(dir, 'fixtures');

  try {
    mkdirSync(fix);
    for (const [file, json] of Object.entries(fixtures)) {
      writeFileSync(join(fix, file), JSON.stringify(json));
    }

    return run(fix, dir);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
};

const HEAD = 'a'.repeat(40);
const OLD = 'b'.repeat(40);
const OLDER = 'c'.repeat(40);

describe('the step that writes the changes since the last review', () => {
  const run = (
    id: number,
    headSha: string,
    conclusion: string,
    { artifact = true, gate = '' } = {}
  ) => ({
    artifacts: {
      artifacts: artifact
        ? [{ expired: false, id: 1, name: 'claude-execution-output' }]
        : [],
    },
    id,
    jobs: {
      jobs: [
        {
          name: 'Review',
          steps: [{ conclusion: gate, name: GATE }],
        },
      ],
    },
    list: { conclusion, databaseId: id, headSha },
  });

  type Run = ReturnType<typeof run>;

  // Runs the step. The PR holds the commits in `commits`; `attempt` is the run attempt.
  const since = (runs: Run[], commits = [OLD, OLDER, HEAD], attempt = '1') =>
    withFixtures(
      {
        'commits.json': { commits: commits.map(oid => ({ oid })) },
        'runs.json': runs.map(r => r.list),
        ...Object.fromEntries(
          runs.flatMap(r => [
            [`artifacts-${r.id}.json`, r.artifacts],
            [`jobs-${r.id}.json`, r.jobs],
          ])
        ),
      },
      (fix, dir) => {
        const result = runScript(
          stepNamed(SINCE).run,
          { gh: GH_FIXTURES },
          {
            FIX: fix,
            GH_REPO: 'owner/repo',
            GITHUB_RUN_ATTEMPT: attempt,
            GITHUB_WORKSPACE: dir,
            HEAD_REF: 'branch',
            HEAD_SHA: HEAD,
            PR_NUMBER: '7',
            RUNNER_TEMP: dir,
          }
        );
        const file = join(dir, '.since-last-review.diff');

        return {
          ...result,
          diff: existsSync(file) ? readFileSync(file, 'utf8') : undefined,
        };
      }
    );

  it('lists up to 100 runs, since gh lists 20 and cancelled runs would fill them', () => {
    expect(since([]).log).toContain('--limit 100');
  });

  it('reviews the changes since the last green run that has Claude’s summary', () => {
    const { diff, log, outputs } = since([run(1, OLD, 'success')]);

    expect(outputs).toBe('scope=since\n');
    expect(diff).toBe('DIFF\n');
    expect(log).toContain(`repos/owner/repo/compare/${OLD}...${HEAD}`);
  });

  it('counts a red run whose gate step failed: the review found open findings', () => {
    const { diff, outputs } = since([
      run(1, OLD, 'failure', { gate: 'failure' }),
    ]);

    expect(outputs).toBe('scope=since\n');
    expect(diff).toBe('DIFF\n');
  });

  it('skips a red run whose gate step did not fail: Claude itself failed', () => {
    const { diff, outputs } = since([
      run(1, OLD, 'failure', { gate: 'skipped' }),
    ]);

    expect({ diff, outputs }).toEqual({ diff: undefined, outputs: '' });
  });

  it('goes on to an older run when the newest is a Claude failure', () => {
    const { log, outputs } = since([
      run(2, OLD, 'failure', { gate: 'skipped' }),
      run(1, OLDER, 'success'),
    ]);

    expect(outputs).toBe('scope=since\n');
    expect(log).toContain(`compare/${OLDER}...${HEAD}`);
  });

  it.each([
    ['one on the head commit', [run(1, HEAD, 'success')]],
    ['a cancelled run', [run(1, OLD, 'cancelled')]],
    ['a run with no summary', [run(1, OLD, 'success', { artifact: false })]],
  ])('does not use %s', (_, runs) => {
    expect(since(runs).outputs).toBe('');
  });

  it('reviews the whole PR on a re-run', () => {
    expect(since([run(1, OLD, 'success')], undefined, '2')).toMatchObject({
      diff: undefined,
      outputs: '',
    });
  });

  it('reviews the whole PR when a rebase dropped the reviewed commit', () => {
    expect(since([run(1, OLD, 'success')], [HEAD]).outputs).toBe('');
  });
});

describe('the step that fails on open findings', () => {
  const BOT = 'github-actions[bot]';
  const inline = (
    login: string,
    commit: string,
    reply: null | number = null
  ) => ({
    id: 1,
    in_reply_to_id: reply,
    original_commit_id: commit,
    user: { login },
  });
  const issue = (login: string, body: string) => ({ body, user: { login } });

  const gate = (
    inlineComments: object[],
    issueComments: object[] = [],
    fail = ''
  ) =>
    withFixtures(
      { 'inline.json': inlineComments, 'issue.json': issueComments },
      fix =>
        runScript(
          stepNamed(GATE).run,
          { gh: GH_FIXTURES },
          {
            FAIL: fail,
            FIX: fix,
            GH_REPO: 'owner/repo',
            HEAD_SHA: HEAD,
            PR_NUMBER: '7',
          },
          ['-e', '-o', 'pipefail']
        )
    );
  const error = (total: number, inlineCount: number, earlier: number) =>
    `::error::The review has open findings: ${total} (${inlineCount} inline on this commit, ${earlier} in its Open findings comment).`;

  it('passes a review with nothing open', () => {
    expect(
      gate([], [issue(BOT, 'Open findings: 0\n\nAll addressed.')])
    ).toMatchObject({
      status: 0,
      stdout: 'The review has no open findings.\n',
    });
  });

  it('fails on each inline comment of the bot on the head commit, from any run', () => {
    const { status, stdout } = gate([inline(BOT, HEAD), inline(BOT, HEAD)]);

    expect(status).toBe(1);
    expect(stdout).toBe(`${error(2, 2, 0)}\n`);
  });

  it.each([
    ['one on an earlier commit', [inline(BOT, OLD)]],
    ['a reply', [inline(BOT, HEAD, 123)]],
    ['one by someone else', [inline('kinscape-agent[bot]', HEAD)]],
  ])('does not count %s', (_, comments) => {
    expect(gate(comments).status).toBe(0);
  });

  it('counts the findings that the Open findings comment names, as a first review does', () => {
    const { status, stdout } = gate(
      [],
      [issue(BOT, 'Open findings: 1\n\nNo plan file.')]
    );

    expect(status).toBe(1);
    expect(stdout).toBe(`${error(1, 0, 1)}\n`);
  });

  it('adds them to the inline ones', () => {
    const { stdout } = gate(
      [inline(BOT, HEAD)],
      [issue(BOT, 'Open findings: 2')]
    );

    expect(stdout).toBe(`${error(3, 1, 2)}\n`);
  });

  it('reads only the latest Open findings comment', () => {
    expect(
      gate([], [issue(BOT, 'Open findings: 2'), issue(BOT, 'Open findings: 0')])
        .status
    ).toBe(0);
  });

  // Claude writes the line in the markdown it likes.
  it.each([
    '**Open findings: 2**',
    '**Open findings:** 2',
    '## Open findings: 2',
    '`Open findings: 2`',
    '> Open findings: 2',
    'Open findings:   2',
  ])('reads %s', line => {
    expect(gate([], [issue(BOT, `${line}\n\nSee the threads.`)]).stdout).toBe(
      `${error(2, 0, 2)}\n`
    );
  });

  it.each([
    ['one by a person', issue('someone', 'Open findings: 3')],
    ['one that does not start the comment', issue(BOT, 'See Open findings: 3')],
    [
      'one on a later line',
      issue(BOT, 'Earlier findings are open.\nOpen findings: 3'),
    ],
    ['a comment with no count', issue(BOT, 'Reviewing…')],
  ])('ignores %s', (_, comment) => {
    expect(gate([], [comment]).status).toBe(0);
  });

  it('fails when a call fails, so a broken gate never passes', () => {
    expect(gate([], [], '1').status).not.toBe(0);
  });
});
