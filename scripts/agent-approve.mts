import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

import type { Gh } from '#ks/scripts/types.ts';

import { approve } from '#ks/scripts/approve-plan.mts';

// Records a plan's approval before any model runs (see claude-build.yml). The owner approved a draft
// plan PR; this reads the answers to its `## Decisions` from the owner's reviews and PR comments
// (`D1: B`, `D1=B`, `D2: other, <text>`; the later of two answers wins), writes them and
// `Status: approved` into the plan, and commits `plan(<id>): approved by @<owner>` to the PR branch.
//   open decision: comment which, commit nothing, `go=false`
//   plan already approved: change nothing, `go=true`
// On `go=true`, a `hand-back` PR (plans/README.md rule 4) gets a comment that the tech lead builds
// it, and `go=false`: no build run starts.
// It is the one writer of the label for that approval: each issue the PR closes is set to
// `status: ready-for-agent` on `go=true` and `status: ready-for-dev` on `go=false`. It skips a
// `hand-back` PR, a `status: blocked` issue and one already on its target; a failed move is
// logged and changes neither `go` nor the exit code.
// Usage: node scripts/agent-approve.mts <PR number>, with GH_REPO, APPROVER (the review's author)
// and COMMIT (the commit the review approved) set. An https RUN_URL, if set, is linked at the end of
// a stop comment.
// It writes `go=true` or `go=false` to $GITHUB_OUTPUT, and on `go=true` `head=<sha>`: the commit it
// made, or the PR head when the plan was already approved. The build checks out that commit and no
// other (claude-run.yml). A PR whose head is not COMMIT stops: the owner read another commit. A
// second review of the same commit, queued behind the first run, stops quietly (no comment, no
// label move, `go=false`): the plan is approved and the PR is ready, or its only commit since
// COMMIT is the approval.
// The commit goes through the Contents API with the plan's blob sha, so the PR head is never
// checked out and a plan that changed meanwhile is refused. A failed `gh` call is logged,
// `go=false` is written and the exit code is 1.
// Only text from an author_association of OWNER counts; everything else on the PR is ignored.

type Item = {
  authorAssociation: string;
  body: string;
};

type Pr = {
  comments: ({ createdAt: string } & Item)[];
  files: { path: string }[];
  headRefName: string;
  headRefOid: string;
  isDraft: boolean;
  labels: { name: string }[];
  reviews: ({ submittedAt: string } & Item)[];
};

const NUMBER = /^[1-9]\d*$/;
const REPO = /^[\w.-]+\/[\w.-]+$/;
const LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const SHA = /^[0-9a-f]{40}$/;
const RUN_URL = /^https:\/\/\S+$/;
const AGENT = 'status: ready-for-agent';
const DEV = 'status: ready-for-dev';
const BLOCKED = 'status: blocked';
const HAND_BACK = 'hand-back';
const PLAN = /^plans\/(?:(?:bugs|chores)\/)?(?!README|TEMPLATE)[\w.-]+\.md$/;
const ANSWER =
  /^[\s>*-]*D(\d+)\s*[:=]\s*(?:([A-Za-z])\b|other\b[\s,:]*(\S.*))/i;

const json = <T,>(gh: Gh, args: string[], input?: string): T =>
  JSON.parse(gh(args, input));

const list = (ids: string[]): string => ids.join(', ');

// The answers in the owner's text, oldest first so a later one replaces an earlier one, as the
// arguments `approve` takes: `D1=B`, `D2=other: <text>`.
const answersFrom = (pr: Pr): string[] => {
  const answers = new Map<string, string>();

  [
    ...pr.reviews.map(({ submittedAt, ...item }) => ({
      ...item,
      at: submittedAt,
    })),
    ...pr.comments.map(({ createdAt, ...item }) => ({
      ...item,
      at: createdAt,
    })),
  ]
    .filter(({ authorAssociation }) => authorAssociation === 'OWNER')
    .sort((a, b) => a.at.localeCompare(b.at))
    .flatMap(({ body }) => body.split(/\r?\n/))
    .forEach(line => {
      const [, id, letter, other] = ANSWER.exec(line) ?? [];

      if (id) {
        answers.set(
          `D${id}`,
          letter ? `D${id}=${letter}` : `D${id}=other: ${other.trim()}`
        );
      }
    });

  return [...answers.values()];
};

export const run = (
  args: string[],
  env: Record<string, string | undefined>,
  gh: Gh,
  write: (line: string) => void
): number => {
  const [raw] = args;
  const repo = env.GH_REPO ?? '';
  const approver = env.APPROVER ?? '';
  const commit = env.COMMIT ?? '';

  if (
    !NUMBER.test(raw ?? '') ||
    !REPO.test(repo) ||
    !LOGIN.test(approver) ||
    !SHA.test(commit)
  ) {
    console.error(
      'Usage: agent-approve <PR number>, with GH_REPO=<owner>/<repo>, APPROVER=<login> and COMMIT=<sha> set'
    );

    return 1;
  }

  const runUrl = env.RUN_URL ?? '';
  const footer = RUN_URL.test(runUrl) ? ['', `[Run](${runUrl})`] : [];
  const post = (...lines: string[]): void => {
    gh(
      ['pr', 'comment', raw, '--body-file', '-'],
      [...lines, ...footer].join('\n')
    );
  };
  // Nothing is committed and no model runs: tell the owner why, and what to do.
  const comment = (...lines: string[]): void => {
    post('Not approved yet:', '', ...lines);
  };
  // A failed label move is logged against its PR or issue, so the others still go.
  const attempt = (number: number | string, action: () => void): void => {
    try {
      action();
    } catch (error) {
      console.error(
        `#${number}: moving the label failed: ${(error as Error).message}`
      );
    }
  };
  // Writes the outcome, and on a go the commit to build, then sets each closed issue's label from it.
  const finish = (go: boolean, head = ''): void => {
    write(`go=${go}`);

    if (go) {
      write(`head=${head}`);
    }

    attempt(raw, () => {
      const [owner, name] = repo.split('/');
      const target = go ? AGENT : DEV;
      const pr = json<{
        closingIssuesReferences: {
          number: number;
          repository: { name: string; owner: { login: string } };
        }[];
        labels: { name: string }[];
      }>(gh, ['pr', 'view', raw, '--json', 'closingIssuesReferences,labels']);

      if (pr.labels.some(({ name: label }) => label === HAND_BACK)) {
        return;
      }

      pr.closingIssuesReferences
        .filter(
          ({ repository }) =>
            repository.name === name && repository.owner.login === owner
        )
        .forEach(({ number }) =>
          attempt(number, () => {
            const labels = json<{ labels: { name: string }[] }>(gh, [
              'issue',
              'view',
              String(number),
              '--json',
              'labels',
            ]).labels.map(({ name: label }) => label);

            if (labels.includes(BLOCKED) || labels.includes(target)) {
              return;
            }

            gh([
              'issue',
              'edit',
              String(number),
              ...labels
                .filter(label => label.startsWith('status: '))
                .flatMap(label => ['--remove-label', label]),
              '--add-label',
              target,
            ]);
          })
        );
    });
  };
  const stop = (...lines: string[]): number => {
    comment(...lines);
    finish(false);

    return 0;
  };
  // The plan is approved at `head`: a `hand-back` PR is built by the tech lead (rule 4), so no build
  // run starts. The approval is already committed, so a failed comment is not the catch's "Approve
  // the plan again": log it and stop.
  const proceed = (handBack: boolean, head: string): number => {
    if (handBack) {
      try {
        post(
          'The plan is approved. This PR has `hand-back`, so the tech lead builds it (`plans/README.md` rule 4); no build run starts.'
        );
      } catch (error) {
        console.error(`#${raw}: ${(error as Error).message}`);
        finish(false);

        return 1;
      }
    }

    finish(!handBack, head);

    return 0;
  };

  try {
    const pr = json<Pr>(gh, [
      'pr',
      'view',
      raw,
      '--json',
      'files,headRefName,headRefOid,isDraft,labels,reviews,comments',
    ]);
    const plans = pr.files
      .map(({ path }) => path)
      .filter(path => PLAN.test(path));
    const handBack = pr.labels.some(({ name }) => name === HAND_BACK);

    // The head is not the commit the owner read.
    const stopMoved = (): number =>
      stop(
        `- The approval is for \`${commit.slice(0, 7)}\`, but the branch is now at \`${pr.headRefOid.slice(0, 7)}\`. Approve the plan again.`
      );

    if (plans.length !== 1) {
      return stop(
        `- A plan PR has exactly one plan file under \`plans/\`; this one has ${plans.length}.`
      );
    }

    const [file] = plans;
    const url = `repos/${repo}/contents/${file}`;
    const message = `plan(${file.replace(/^.*\//, '').split('-')[0]}): approved by @${approver}`;
    const { content, sha } = json<{ content: string; sha: string }>(gh, [
      'api',
      '--method',
      'GET',
      url,
      '-f',
      `ref=${pr.headRefOid}`,
    ]);
    const text = Buffer.from(content, 'base64').toString('utf8');

    if (/^- \*\*Status:\*\* approved\s*$/m.test(text)) {
      if (pr.headRefOid !== commit) {
        // Two quick approvals, where the second waits for the first run, build included: that
        // run did the work, so there is nothing to tell or move. It built the plan, so the PR is
        // ready (the event saw a draft), or it stopped with only its approval commit pushed. Any
        // other moved head stops as a draft's does: the owner read another commit, and a build
        // that failed after pushing needs the approval again. Only the fields needed come back:
        // the comparison carries every commit and file diff.
        const quiet = (): number => {
          console.log(
            `${file} was approved after the review's commit ${commit.slice(0, 7)}: nothing to do.`
          );
          write('go=false');

          return 0;
        };

        if (!pr.isDraft) {
          return quiet();
        }

        const { first, status, total } = json<{
          first: string;
          status: string;
          total: number;
        }>(gh, [
          'api',
          `repos/${repo}/compare/${commit}...${pr.headRefOid}`,
          '--jq',
          '{status: .status, total: .total_commits, first: (.commits[0].commit.message // "")}',
        ]);

        return status === 'ahead' && total === 1 && first === message
          ? quiet()
          : stopMoved();
      }

      console.log(`${file} is already approved.`);

      return proceed(handBack, pr.headRefOid);
    }

    if (pr.headRefOid !== commit) {
      return stopMoved();
    }

    if (!/^- \*\*Status:\*\* draft\s*$/m.test(text)) {
      return stop(`- \`${file}\` has no \`- **Status:** draft\` line.`);
    }

    // An answer to a decision this draft no longer has (an earlier draft's) is skipped, not an error.
    const decisions = new Set(
      [...text.matchAll(/^\*\*(D\d+) · /gm)].map(([, id]) => id)
    );
    const answers = answersFrom(pr).filter(answer =>
      decisions.has(answer.split('=')[0])
    );
    const result = approve(text, approver, answers, file);

    if (result.errors.length > 0) {
      return stop(
        ...result.errors.map(error => `- ${error}`),
        '',
        'Answer again in a new comment: the latest answer to a decision counts.'
      );
    }

    if (result.open.length > 0) {
      return stop(
        `- No answer yet for ${list(result.open)}.`,
        '',
        'Reply on this PR as `D1: B` or `D2: other, <your answer>`, then approve the plan again.'
      );
    }

    const made = json<{ commit: { sha: string } }>(
      gh,
      ['api', '--method', 'PUT', url, '--input', '-'],
      JSON.stringify({
        branch: pr.headRefName,
        content: Buffer.from(result.text).toString('base64'),
        message,
        sha,
      })
    ).commit.sha;

    console.log(`Recorded the approval of ${file} by @${approver} as ${made}.`);

    return proceed(handBack, made);
  } catch (error) {
    console.error(`#${raw}: ${(error as Error).message}`);
    finish(false);

    // So the owner isn't left with only a red job; the likeliest failure is a plan that changed meanwhile.
    try {
      comment(
        '- A GitHub call failed (the plan may have changed meanwhile). Approve the plan again.'
      );
    } catch (again) {
      console.error(`#${raw}: ${(again as Error).message}`);
    }

    return 1;
  }
};

/* v8 ignore next 11 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  const output = process.env.GITHUB_OUTPUT;

  process.exitCode = run(
    process.argv.slice(2),
    process.env,
    (args, input) =>
      execFileSync('gh', args, {
        encoding: 'utf8',
        input,
        maxBuffer: 16 * 1024 * 1024,
      }),
    line => (output ? appendFileSync(output, `${line}\n`) : console.log(line))
  );
}
