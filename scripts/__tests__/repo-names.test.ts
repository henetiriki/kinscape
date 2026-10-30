import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// The repo and bot names live in one place each: GitHub's context and the repo variables
// KINSCAPE_BOT_LOGIN and KINSCAPE_BOT_ID, which scripts/setup-github.sh sets. The only literals
// left are the ones a workflow or a link can't avoid.
const ALLOWED = [
  // `uses:` takes no expressions.
  /^[^:]+:\d+:\s*(?:-\s+)?uses: henetiriki\/kinscape\//,
  /^\.github\/CODEOWNERS:/,
  /^\.github\/ISSUE_TEMPLATE\//,
  // The bot's values, set once as repo variables.
  /^scripts\/setup-github\.sh:\d+:BOT_(?:LOGIN|ID)=/,
  /^scripts\/__tests__\//,
];

const hits = () =>
  execFileSync(
    'git',
    [
      'grep',
      '-n',
      '-e',
      'henetiriki',
      '-e',
      '344434370',
      '--',
      '.github',
      'scripts',
    ],
    { cwd: process.cwd(), encoding: 'utf8' }
  )
    .split('\n')
    .filter(Boolean);

describe('the repo and bot names', () => {
  it('appear in .github and scripts only where they cannot be a variable', () => {
    const stray = hits().filter(line => !ALLOWED.some(rule => rule.test(line)));

    expect(
      stray,
      'Read the repo from github.repository and the bot from vars.KINSCAPE_BOT_LOGIN / vars.KINSCAPE_BOT_ID'
    ).toEqual([]);
  });
});
