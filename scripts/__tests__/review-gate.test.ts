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
  "api graphql "*)
    case "$args" in
      *" after="*) after="\${args##* after=}"; file="$FIX/threads-\${after%% *}.json" ;;
      *) file="$FIX/threads.json" ;;
    esac ;;
  "run list "*) file="$FIX/runs.json" ;;
  *"/compare/"*) echo DIFF; exit 0 ;;
  "pr view "*) file="$FIX/commits.json" ;;
  *"/actions/runs/"*)
    id="\${args##*runs/}"; id="\${id%%/*}"
    case "$args" in
      *"/artifacts"*) file="$FIX/artifacts-$id.json" ;;
      *"/jobs"*) file="$FIX/jobs-$id.json" ;;
    esac ;;
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
          name: reviewJob().name,
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

  // Renaming the job also renames the required check, so the step must follow it.
  it('looks for the gate step by the names that the workflow has', () => {
    const { run } = stepNamed(SINCE);

    expect(run).toContain(`select(.name == "${reviewJob().name}")`);
    expect(run).toContain(`select(.name == "${stepNamed(GATE).name}")`);
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
  // A review thread, as the GraphQL query answers it: the authors of its comments, first to last.
  const thread = (
    authors: [login: string, type: string][] = [['github-actions', 'Bot']],
    { outdated = false, resolved = false } = {}
  ) => ({
    comments: {
      nodes: authors.map(([login, type]) => ({
        author: { __typename: type, login },
      })),
    },
    isOutdated: outdated,
    isResolved: resolved,
  });
  const page = (
    nodes: object[],
    pageInfo: { endCursor: null | string; hasNextPage: boolean }
  ) => ({
    data: {
      repository: { pullRequest: { reviewThreads: { nodes, pageInfo } } },
    },
  });
  // Pages of threads: the first is `threads.json`, the next `threads-c0.json`, `threads-c1.json`.
  const pagesOf = (...groups: object[][]) =>
    Object.fromEntries(
      groups.map((nodes, index) => [
        index === 0 ? 'threads.json' : `threads-c${index - 1}.json`,
        page(nodes, {
          endCursor: `c${index}`,
          hasNextPage: index < groups.length - 1,
        }),
      ])
    );
  const issue = (login: string, body: string) => ({ body, user: { login } });

  const gate = (
    threads: Record<string, unknown>,
    issueComments: object[] = [],
    fail = ''
  ) =>
    withFixtures({ ...threads, 'issue.json': issueComments }, fix =>
      runScript(
        stepNamed(GATE).run,
        { gh: GH_FIXTURES },
        {
          FAIL: fail,
          FIX: fix,
          GH_REPO: 'owner/repo',
          PR_NUMBER: '7',
        },
        ['-e', '-o', 'pipefail']
      )
    );
  const error = (total: number, threads: number, earlier: number) =>
    `::error::The review has open findings: ${total} (${threads} unresolved threads, ${earlier} in its Earlier findings still open comment).`;

  it('passes a review with nothing open', () => {
    expect(
      gate(pagesOf([]), [
        issue(BOT, 'Earlier findings still open: 0\n\nAll addressed.'),
      ])
    ).toMatchObject({
      status: 0,
      stdout: 'The review has no open findings.\n',
    });
  });

  it('reads the threads of the PR by owner, name and number', () => {
    const { log } = gate(pagesOf([]));

    expect(log).toContain('api graphql');
    expect(log).toContain('owner=owner');
    expect(log).toContain('name=repo');
    expect(log).toContain('number=7');
    expect(log).toContain('reviewThreads(first: 100, after: $after)');
    expect(log).not.toContain('after=');
  });

  it('fails on each unresolved thread that the reviewer started', () => {
    const { status, stdout } = gate(pagesOf([thread(), thread()]));

    expect(status).toBe(1);
    expect(stdout).toBe(`${error(2, 2, 0)}\n`);
  });

  // A push after a review, such as the one of the snapshot bot, moves the head. The thread stays.
  it('counts an outdated thread, whatever commit it was posted on', () => {
    expect(gate(pagesOf([thread(undefined, { outdated: true })])).stdout).toBe(
      `${error(1, 1, 0)}\n`
    );
  });

  // PR 840: the review of the snapshot commit wrote 0 and the check went green.
  it('fails on an unresolved thread when the review says no earlier finding is open', () => {
    const { status, stdout } = gate(
      pagesOf([thread(undefined, { outdated: true })]),
      [
        issue(
          BOT,
          'Earlier findings still open: 0\n\nNo new findings on this push.'
        ),
      ]
    );

    expect(status).toBe(1);
    expect(stdout).toBe(`${error(1, 1, 0)}\n`);
  });

  it.each([
    ['a resolved thread', thread(undefined, { resolved: true })],
    [
      'a thread that a person started',
      thread([
        ['someone', 'User'],
        ['github-actions', 'Bot'],
      ]),
    ],
    ['a thread of another bot', thread([['kinscape-agent', 'Bot']])],
    [
      'a thread of a person named like the reviewer',
      thread([['github-actions', 'User']]),
    ],
  ])('does not count %s', (_, one) => {
    expect(gate(pagesOf([one])).status).toBe(0);
  });

  it('counts the threads on every page', () => {
    const { log, stdout } = gate(
      pagesOf(
        [thread(undefined, { resolved: true })],
        [thread(), thread(undefined, { resolved: true })],
        [thread()]
      )
    );

    expect(stdout).toBe(`${error(2, 2, 0)}\n`);
    expect(log.match(/api graphql/g)).toHaveLength(3);
    expect(log).toContain('after=c0');
    expect(log).toContain('after=c1');
  });

  it('fails on a page that says there is more but names no cursor', () => {
    const { status, stdout } = gate({
      'threads.json': page([], { endCursor: null, hasNextPage: true }),
    });

    expect(status).toBe(1);
    expect(stdout).toBe(
      '::error::A page of review threads has a next page but no cursor.\n'
    );
  });

  it('counts the findings that the Earlier findings still open comment names, as a first review does', () => {
    const { status, stdout } = gate(pagesOf([]), [
      issue(BOT, 'Earlier findings still open: 1\n\nNo plan file.'),
    ]);

    expect(status).toBe(1);
    expect(stdout).toBe(`${error(1, 0, 1)}\n`);
  });

  it('adds them to the unresolved threads', () => {
    const { stdout } = gate(pagesOf([thread()]), [
      issue(BOT, 'Earlier findings still open: 2'),
    ]);

    expect(stdout).toBe(`${error(3, 1, 2)}\n`);
  });

  it('reads only the latest Earlier findings still open comment', () => {
    expect(
      gate(pagesOf([]), [
        issue(BOT, 'Earlier findings still open: 2'),
        issue(BOT, 'Earlier findings still open: 0'),
      ]).status
    ).toBe(0);
  });

  // Claude writes the line in the markdown it likes.
  it.each([
    '**Earlier findings still open: 2**',
    '**Earlier findings still open:** 2',
    '**Earlier findings still open**: 2',
    '`Earlier findings still open`: 2',
    '## Earlier findings still open: 2',
    '`Earlier findings still open: 2`',
    '> Earlier findings still open: 2',
    'Earlier findings still open:   2',
  ])('reads %s', line => {
    expect(
      gate(pagesOf([]), [issue(BOT, `${line}\n\nSee the threads.`)]).stdout
    ).toBe(`${error(2, 0, 2)}\n`);
  });

  it.each([
    ['one by a person', issue('someone', 'Earlier findings still open: 3')],
    [
      'one that does not start the comment',
      issue(BOT, 'See Earlier findings still open: 3'),
    ],
    [
      'one on a later line',
      issue(BOT, 'Earlier findings are open.\nEarlier findings still open: 3'),
    ],
    ['the old label', issue(BOT, 'Open findings: 3')],
    ['a comment with no count', issue(BOT, 'Reviewing…')],
  ])('ignores %s', (_, comment) => {
    expect(gate(pagesOf([]), [comment]).status).toBe(0);
  });

  it('fails when a call fails, so a broken gate never passes', () => {
    expect(gate(pagesOf([]), [], '1').status).not.toBe(0);
  });
});
