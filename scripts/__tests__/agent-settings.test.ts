import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// An agent's settings in .github/agent/.
const denyOf = (file: string) =>
  (
    JSON.parse(
      readFileSync(join(process.cwd(), '.github/agent', file), 'utf8')
    ) as { permissions: { deny: string[] } }
  ).permissions.deny;

// Paths outside the workspace that hold credentials or the run's own files (plan C415, D2). The
// runner temp has checkout's credentials, the settings and the transcript.
const DENIED = [
  'Read(//proc/**)',
  'Read(//sys/**)',
  'Read(//etc/**)',
  'Read(//home/runner/work/_temp/**)',
  'Read(~/.gitconfig)',
  'Read(~/.config/**)',
];

// The build agent's, the code review's (the reviewer can post what it reads in a PR comment) and the
// refresh's (it reads Specs from outside and comments on them).
describe.each([
  'settings.json',
  'review-settings.json',
  'refresh-settings.json',
])('%s', file => {
  it.each(DENIED)('denies %s', rule => {
    expect(denyOf(file)).toContain(rule);
  });

  // Claude Code saves long tool output there, and reads it back with Read. A rule's `//` starts an
  // absolute path; `**` matches any depth and `*` one name.
  it.each(['/tmp/claude-1/tool-results/a.txt', '~/.claude/projects/a.jsonl'])(
    'leaves %s readable',
    path => {
      const matches = (rule: string) => {
        const glob = rule.match(/^Read\((.+)\)$/)?.[1].replace(/^\/\//, '/');
        const pattern = glob
          ?.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
          .replaceAll('**', '\u0000')
          .replaceAll('*', '[^/]*')
          .replaceAll('\u0000', '.*');

        return pattern !== undefined && new RegExp(`^${pattern}$`).test(path);
      };

      expect(denyOf(file).filter(matches)).toEqual([]);
    }
  );
});

// The refresh (.github/agent/refresh.md) may edit an issue's body and comment; every other change
// is denied. It reads Specs written outside the team. Which issue it edits can't be limited here.
describe('refresh-settings.json', () => {
  const { allow, deny } = (
    JSON.parse(
      readFileSync(
        join(process.cwd(), '.github/agent/refresh-settings.json'),
        'utf8'
      )
    ) as { permissions: { allow: string[]; deny: string[] } }
  ).permissions;

  // A deny rule, as Claude Code reads one: `*` matches any text, and the rule matches the whole command.
  const denied = (command: string) =>
    deny.some(rule => {
      const glob = rule.match(/^Bash\((.+)\)$/)?.[1];

      return (
        glob !== undefined &&
        new RegExp(
          `^${glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*')}$`,
          's'
        ).test(command)
      );
    });

  it('allows reading the repo and issues, and editing and commenting on an issue', () => {
    expect(allow).toEqual([
      'Read',
      'Bash(git grep:*)',
      'Bash(git ls-files:*)',
      'Bash(gh issue view:*)',
      'Bash(gh issue edit:*)',
      'Bash(gh issue comment:*)',
      'Bash(gh pr view:*)',
      'Bash(gh pr diff:*)',
    ]);
    expect(deny).toEqual(
      expect.arrayContaining(['Edit', 'Write', 'Agent', 'WebFetch'])
    );
  });

  // The unblock run must not set a label: only the tech lead starts a plan. Nor may it change an
  // issue's title, assignee, milestone or project, which `gh issue edit` also takes. The flag may
  // come before the issue number or be joined to its value with `=`.
  it.each([
    'gh issue edit 5 --add-label ready-for-agent',
    'gh issue edit --add-label ready-for-agent 5',
    'gh issue edit 5 --add-label=ready-for-agent',
    'gh issue edit 5 --remove-label blocked',
    'gh issue edit 5 --title new',
    'gh issue edit 5 --title=new',
    'gh issue edit 5 -t new',
    'gh issue edit 5 --add-assignee someone',
    'gh issue edit 5 --remove-assignee someone',
    'gh issue edit 5 --milestone M1',
    'gh issue edit 5 --remove-milestone',
    'gh issue edit 5 --add-project P',
    'gh issue edit 5 --remove-project P',
  ])('denies: %s', command => {
    expect(denied(command)).toBe(true);
  });

  // The body goes in with --body-file, as rules.md says.
  it.each([
    'gh issue edit 5 --body text',
    'gh issue edit 5 --body=text',
    'gh issue edit 5 -b text',
  ])('denies: %s', command => {
    expect(denied(command)).toBe(true);
  });

  // `git grep` can run a command: -O / --open-files-in-pager hands each file to one.
  it.each([
    'git grep --open-files-in-pager=sh foo',
    'git grep -O sh foo',
    'git grep -Osh foo',
    'git grep -nOsh foo',
    'git grep foo -nOsh',
    "git grep -n --open-files-in-pager 'sh -c x' foo",
  ])('denies: %s', command => {
    expect(denied(command)).toBe(true);
  });

  it.each([
    "git grep -n 'old/path' -- ':!plans'",
    "git grep 'OWNER' -- ':!plans'",
    'git ls-files -co --exclude-standard docs',
    "gh issue edit 5 --body-file - <<'EOF'\nthe body\nEOF",
    'gh issue comment 5 --body-file -',
    'gh issue view 5',
  ])('does not deny: %s', command => {
    expect(denied(command)).toBe(false);
  });
});
