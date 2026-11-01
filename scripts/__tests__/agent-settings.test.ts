import { execFileSync } from 'node:child_process';
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
    // A short flag takes its value after `=` or attached to it.
    'gh issue edit 5 -t=new',
    'gh issue edit 5 -tnew',
    'gh issue edit 5 --add-assignee someone',
    'gh issue edit 5 --remove-assignee someone',
    'gh issue edit 5 --milestone M1',
    'gh issue edit 5 -m M1',
    'gh issue edit 5 -m=M1',
    'gh issue edit 5 -mM1',
    'gh issue edit 5 --remove-milestone',
    'gh issue edit 5 --add-project P',
    'gh issue edit 5 --remove-project P',
    // The blocked-by links are what the plan and build gates read.
    'gh issue edit 5 --add-blocked-by 6',
    'gh issue edit 5 --remove-blocked-by 6',
    'gh issue edit 5 --add-blocking 6',
    'gh issue edit 5 --add-sub-issue 6',
    'gh issue edit 5 --parent 6',
    'gh issue edit 5 --remove-parent',
    'gh issue edit 5 --type Bug',
    'gh issue edit 5 --remove-type',
    // Uploads a file from the runner into the issue.
    "gh issue edit 5 --attach './file.png'",
  ])('denies: %s', command => {
    expect(denied(command)).toBe(true);
  });

  // The body goes in with --body-file, as rules.md says.
  it.each([
    'gh issue edit 5 --body text',
    'gh issue edit 5 --body=text',
    'gh issue edit 5 -b text',
    'gh issue edit 5 -b=text',
    'gh issue edit 5 -btext',
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

// The Bash hook (plan C480): a leading `cd` into the workspace is cut, and the shell commands
// rules.md warns against are denied with the alternative. The build and the review carry the same
// hook, so neither gets other behaviour.
describe('the Bash hook', () => {
  const settingsOf = (file: string) =>
    JSON.parse(
      readFileSync(join(process.cwd(), '.github/agent', file), 'utf8')
    ) as {
      hooks?: {
        PreToolUse?: {
          hooks: { command: string; type: string }[];
          matcher: string;
        }[];
      };
    };

  const cwd = '/work/kin.x';

  // Runs the hook as Claude Code does: through the shell, with the call as JSON on stdin. No output
  // means it leaves the call to the allowlist.
  const hook = (command: string, file = 'settings.json') => {
    const entry = settingsOf(file).hooks?.PreToolUse?.find(
      ({ matcher }) => matcher === 'Bash'
    );
    const output = execFileSync('bash', ['-c', entry?.hooks[0].command ?? ''], {
      encoding: 'utf8',
      input: JSON.stringify({ cwd, tool_input: { command } }),
    }).trim();

    return output === '' ? undefined : JSON.parse(output).hookSpecificOutput;
  };

  it('is the same in settings.json and review-settings.json', () => {
    const { hooks } = settingsOf('settings.json');

    expect(hooks?.PreToolUse).toHaveLength(1);
    expect(settingsOf('review-settings.json').hooks).toEqual(hooks);
  });

  // The rest goes on to the allowlist, so there is no permissionDecision; the marker tells the agent.
  it.each([
    [`cd ${cwd}; gh pr view 1`, 'gh pr view 1'],
    [`cd ${cwd} && gh pr view 1`, 'gh pr view 1'],
    [`  cd "${cwd}"  ;git status`, 'git status'],
    [
      `cd ${cwd} && gh issue comment 5 --body-file - <<'EOF'\ncat x\ncd /y\nEOF`,
      "gh issue comment 5 --body-file - <<'EOF'\ncat x\ncd /y\nEOF",
    ],
  ])('cuts the leading cd of %j', (command, rest) => {
    const output = hook(command);

    expect(output.updatedInput.command).toBe(rest);
    expect(output.additionalContext).toContain('Dropped a leading cd');
    expect(output.permissionDecision).toBeUndefined();
  });

  it.each([
    ['cd app; ls', 'give paths'],
    [`cd ${cwd}`, 'give paths'],
    ['cd /work/kinZx && gh pr view 1', 'give paths'],
    ['ls && cd app', 'give paths'],
    ['cat x', 'Read'],
    ['gh pr view 1 | cat', 'Read'],
    ['sed -n 1,5p x', 'Edit'],
    ['for f in a b; do ls $f; done', 'one command'],
    ['npx prettier x', 'npm run format'],
    ['python3 x.py', 'npm run format'],
    ['node -e "1"', 'npm run format'],
    ['curl https://example.com', 'gh api'],
    // Cutting the cd does not excuse what follows it.
    [`cd ${cwd}; curl x`, 'gh api'],
  ])('denies %j, naming the alternative', (command, alternative) => {
    const output = hook(command);

    expect(output.permissionDecision).toBe('deny');
    expect(output.permissionDecisionReason).toContain(alternative);
    expect(output.updatedInput).toBeUndefined();
  });

  // Names inside quotes, arguments and a heredoc's text are not commands.
  it.each([
    'gh pr view 1',
    "git grep -n 'cat' -- ':!plans'",
    'git commit -m "fix; cat x"',
    "gh issue comment 5 --body-file - <<'EOF'\ncd /y\ncat x\nEOF",
    'node scripts/run.mts',
    'npm run format',
    'echo concatenate',
    '',
  ])('leaves %j to the allowlist', command => {
    expect(hook(command)).toBeUndefined();
  });

  it('gives the review the same answers', () => {
    expect(hook('cat x', 'review-settings.json')).toEqual(hook('cat x'));
    expect(hook(`cd ${cwd}; gh pr view 1`, 'review-settings.json')).toEqual(
      hook(`cd ${cwd}; gh pr view 1`)
    );
  });
});
