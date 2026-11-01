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

// The refresh (.github/agent/refresh.md) may edit an issue's body and comment, and nothing else: it
// reads Specs written outside the team.
describe('refresh-settings.json', () => {
  const { allow, deny } = (
    JSON.parse(
      readFileSync(
        join(process.cwd(), '.github/agent/refresh-settings.json'),
        'utf8'
      )
    ) as { permissions: { allow: string[]; deny: string[] } }
  ).permissions;

  it('allows reading the repo and the issue, and writing only an issue', () => {
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

  // The unblock run must not set a label: only the tech lead starts a plan.
  it.each(['--add-label', '--remove-label'])('denies %s', flag => {
    expect(deny).toContain(`Bash(gh issue * ${flag}*)`);
  });

  // The body goes in with --body-file, as rules.md says.
  it.each(['--body *', '--body=*', '-b *'])('denies %s', flag => {
    expect(deny).toContain(`Bash(gh issue * ${flag})`);
  });
});
