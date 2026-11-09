import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  join(process.cwd(), '.github/workflows/claude-code-review.yml'),
  'utf8'
);

// The pin-PR clause is written twice: in the `run-name` (shows "Skipped Review") and in the job's `if:`
// (skips the job). The title can't see job results, so the copies can't share a variable; this keeps
// them equal. The three tests sit in one `!( )`, so a missing bracket would skip more PRs than the pin PR.
const PIN_PR =
  /&&\s*!\(\s*github\.event\.pull_request\.user\.login == vars\.KINSCAPE_BOT_LOGIN\s*&&\s*github\.event\.pull_request\.head\.ref == 'bot\/update-action-pins'\s*&&\s*github\.event\.pull_request\.head\.repo\.full_name == github\.repository\s*\)/g;

const copies = (workflow.match(PIN_PR) ?? []).map(copy =>
  copy.replace(/\s+/g, ' ')
);

describe('the pin-PR skip condition of claude-code-review.yml', () => {
  it('is written in the run-name and the job `if:`, with all three tests in one group', () => {
    expect(
      copies,
      'claude-code-review.yml needs `&& !(author is the bot && head branch is bot/update-action-pins && head repo is this repo)` in the run-name and the job `if:`'
    ).toHaveLength(2);
  });

  it('is the same in both copies', () => {
    const [runName, job] = copies;

    expect(runName).toBeDefined();
    expect(job).toBe(runName);
  });

  it('follows the draft check in both copies', () => {
    const draftThenPin = workflow.match(
      /!github\.event\.pull_request\.draft\s*&&\s*!\(/g
    );

    expect(draftThenPin).toHaveLength(2);
  });
});
