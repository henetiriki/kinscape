import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Each of these workflows checks the author of an issue twice: in the `run-name` and in the job's
// `if:`. The title can't see job results, so the two copies can't share a variable. A bare
// association check, or a bot clause outside the brackets, would skip or widen the other checks.
const FILES = [
  'backlog-intent-ready.yml',
  'backlog-milestone.yml',
  'backlog-spec-link.yml',
  'claude-plan.yml',
  'claude-unblock.yml',
];

const ASSOCIATION =
  'contains(fromJSON(\'["OWNER","MEMBER","COLLABORATOR"]\'), github.event.issue.author_association)';
const GATE = `(${ASSOCIATION} || github.event.issue.user.login == vars.KINSCAPE_BOT_LOGIN)`;

const flat = (file: string) =>
  readFileSync(join(process.cwd(), '.github/workflows', file), 'utf8').replace(
    /\s+/g,
    ' '
  );
const count = (text: string, part: string) => text.split(part).length - 1;

describe('the issue author gate', () => {
  it.each(FILES)(
    'accepts the agent App in the run-name and the job of %s, in one bracket',
    file => {
      const text = flat(file);

      expect(
        count(text, GATE),
        `${file} needs the bracketed gate in its run-name and in its job \`if:\``
      ).toBe(2);
      expect(
        count(text, ASSOCIATION),
        `${file} has an association check outside the bracketed gate`
      ).toBe(2);
    }
  );
});
