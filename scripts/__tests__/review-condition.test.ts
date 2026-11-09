import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const text = readFileSync(
  join(process.cwd(), '.github/workflows/claude-code-review.yml'),
  'utf8'
);
const workflow = parse(text) as {
  jobs: Record<string, { if: string }>;
  'run-name': string;
};

// The pin-PR clause is written twice: in the `run-name` (shows "Skipped Review") and in the job's `if:`
// (skips the job). The title can't see job results, so the copies can't share a variable; this keeps
// them equal. The four tests sit in one `!( )`, so a missing bracket would skip more PRs than the pin PR.
const PIN_PR =
  /&&\s*!\(\s*github\.event\.pull_request\.user\.login == vars\.KINSCAPE_BOT_LOGIN\s*&&\s*github\.actor == vars\.KINSCAPE_BOT_LOGIN\s*&&\s*github\.event\.pull_request\.head\.ref == 'bot\/update-action-pins'\s*&&\s*github\.event\.pull_request\.head\.repo\.full_name == github\.repository\s*\)/g;

const copies = (text.match(PIN_PR) ?? []).map(copy =>
  copy.replace(/\s+/g, ' ')
);

describe('the pin-PR skip condition of claude-code-review.yml', () => {
  it('is written in the run-name and the job `if:`, with all four tests in one group', () => {
    expect(
      copies,
      'claude-code-review.yml needs `&& !(author is the bot && actor is the bot && head branch is bot/update-action-pins && head repo is this repo)` in the run-name and the job `if:`'
    ).toHaveLength(2);
  });

  it('is the same in both copies', () => {
    const [runName, job] = copies;

    expect(runName).toBeDefined();
    expect(job).toBe(runName);
  });
});

// Runs the workflow's own expressions (GitHub's syntax is a subset of JavaScript's for these) so the
// tests check who is reviewed, not how the condition is written.
const BOT = 'kinscape-bot[bot]';

type Pr = {
  actor: string;
  association: string;
  author: string;
  draft: boolean;
  ref: string;
  repo: string;
};

const BOT_BUILD: Pr = {
  actor: BOT,
  association: 'NONE',
  author: BOT,
  draft: false,
  ref: 'claude/build',
  repo: 'henetiriki/kinscape',
};
const PIN_PR_BY_BOT: Pr = { ...BOT_BUILD, ref: 'bot/update-action-pins' };

const evaluate = (source: string, pr: Pr) => {
  const expression = source.replace(/^\s*\$\{\{|\}\}\s*$/g, '');
  const github = {
    actor: pr.actor,
    event: {
      pull_request: {
        author_association: pr.association,
        draft: pr.draft,
        head: { ref: pr.ref, repo: { full_name: pr.repo } },
        title: 'chore: update repo action pins',
        user: { login: pr.author },
      },
    },
    repository: 'henetiriki/kinscape',
  };
  const contains = (list: string[], item: string) => list.includes(item);
  const format = (template: string, ...args: string[]) =>
    template.replace(/\{(\d+)\}/g, (_, i: string) => args[Number(i)] ?? '');

  return new Function(
    'github',
    'vars',
    'fromJSON',
    'contains',
    'format',
    `return (${expression});`
  )(
    github,
    { KINSCAPE_BOT_LOGIN: BOT },
    JSON.parse,
    contains,
    format
  ) as unknown;
};

describe('who the review runs on', () => {
  const cases: [string, Pr, boolean][] = [
    ['a build PR from the bot', BOT_BUILD, true],
    ['the pin PR, opened or updated by the bot', PIN_PR_BY_BOT, false],
    [
      'the pin PR with a push from a person',
      { ...PIN_PR_BY_BOT, actor: 'someone' },
      true,
    ],
    [
      'a collaborator PR on the pin branch',
      {
        ...PIN_PR_BY_BOT,
        actor: 'someone',
        association: 'COLLABORATOR',
        author: 'someone',
      },
      true,
    ],
    [
      'a PR from a fork on the pin branch name',
      { ...PIN_PR_BY_BOT, repo: 'someone/kinscape' },
      true,
    ],
    [
      'a collaborator PR',
      {
        ...BOT_BUILD,
        actor: 'someone',
        association: 'COLLABORATOR',
        author: 'someone',
      },
      true,
    ],
    ['a draft PR', { ...BOT_BUILD, draft: true }, false],
    [
      "Dependabot's PR",
      {
        ...BOT_BUILD,
        actor: 'dependabot[bot]',
        author: 'dependabot[bot]',
      },
      false,
    ],
    [
      "an outsider's PR",
      {
        ...BOT_BUILD,
        actor: 'someone',
        author: 'someone',
      },
      false,
    ],
  ];

  it.each(cases)('%s', (_name, pr, reviewed) => {
    const job = workflow.jobs['claude-review']?.if ?? '';

    expect(evaluate(job, pr)).toBe(reviewed);
    expect(evaluate(workflow['run-name'], pr)).toBe(
      `${reviewed ? 'Review' : 'Skipped Review'}: chore: update repo action pins`
    );
  });
});
