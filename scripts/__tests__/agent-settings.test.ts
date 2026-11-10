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

const permissionsOf = (file: string) =>
  (
    JSON.parse(
      readFileSync(join(process.cwd(), '.github/agent', file), 'utf8')
    ) as { permissions: { allow: string[]; deny: string[] } }
  ).permissions;

// A deny rule, as Claude Code reads one: `*` matches any text, the rule matches the whole command,
// and a rule ending in ` *` matches the bare command too.
const deniedBy = (deny: string[]) => (command: string) =>
  deny.some(rule => {
    const glob = rule.match(/^Bash\((.+)\)$/)?.[1];
    const pattern = (text: string) =>
      new RegExp(
        `^${text.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*')}$`,
        's'
      );

    return (
      glob !== undefined &&
      (pattern(glob).test(command) ||
        (glob.endsWith(' *') && pattern(glob.slice(0, -2)).test(command)))
    );
  });

// An allow rule, as Claude Code reads one: `Bash(prefix:*)` covers the prefix and any command that
// continues it after a space.
const allowedBy = (allow: string[]) => (command: string) =>
  allow.some(rule => {
    const prefix = rule.match(/^Bash\((.+):\*\)$/)?.[1];

    return (
      prefix !== undefined &&
      (command === prefix || command.startsWith(`${prefix} `))
    );
  });

// The build agent (plan, build, fix and @claude runs) pushes, comments and moves labels with the
// App token, so it needs no git configuration (the token sits in .git/config) and none of the
// GitHub calls below; `gh api` sends a POST as soon as a field or a method is given.
describe('settings.json', () => {
  const { allow, deny } = permissionsOf('settings.json');
  const denied = deniedBy(deny);

  it('installs from the lockfile only', () => {
    expect(allow).toContain('Bash(npm ci:*)');
    expect(allow.filter(rule => /^Bash\(npm i(nstall)?:/.test(rule))).toEqual(
      []
    );
  });

  it('keeps the checkout credentials unread', () => {
    expect(deny).toContain('Read(./.git/**)');
  });

  // The action's tool saves a CI log in the runner temp folder, which DENIED keeps unread;
  // rules.md gives `gh api … /logs` instead, which prints it.
  it('denies the download of a CI log into the runner temp', () => {
    expect(deny).toContain('mcp__github_ci__download_job_log');
  });

  it.each([
    'git config user.name x',
    'git config --get remote.origin.url',
    'git config',
    // Every leading option: `-c` and `--config-env` set any key, `-C`, `--git-dir` and `--work-tree`
    // point at another repo, `--exec-path` at other programs, and a harmless one (`--no-pager`, which
    // CI never needs) would put the subcommand past the rules below, which match from the start.
    'git -c core.fsmonitor=x status',
    'git -C /tmp status',
    'git --git-dir=x log',
    'git --work-tree=/tmp status',
    'git --exec-path=/tmp status',
    'git --config-env=core.fsmonitor=X status',
    'git --no-pager log -n 5',
    'git --no-pager config -l',
    // These print the origin URL, which carries the App token while Claude runs.
    'git remote -v',
    'git remote set-url origin x',
    'git ls-remote --get-url origin',
    'git ls-remote origin --get-url',
    'git var -l',
    'gh pr review 5 --approve',
    'gh pr merge 5',
    'gh pr close 5',
    'gh pr lock 5',
    'gh issue close 5',
    'gh issue delete 5',
    'gh issue lock 5',
    'gh issue transfer 5 o/r',
    // Every author's comments; the prompts filter by author (rules.md).
    'gh pr view 5 --comments',
    'gh issue view 5 --comments',
    'gh api -X POST repos/o/r/issues/5/labels',
    'gh api -XPOST repos/o/r/issues/5/labels',
    'gh api --method PATCH repos/o/r/issues/5',
    'gh api repos/o/r/issues/5 --method=PATCH',
    'gh api repos/o/r/issues/5/comments -F body=@x',
    'gh api repos/o/r/issues/5/comments --field body=x',
    'gh api repos/o/r/issues/5/comments --raw-field body=x',
    'gh api repos/o/r/issues/5 --input -',
  ])('denies: %s', command => {
    expect(denied(command)).toBe(true);
  });

  it('allows gh repo view', () => {
    expect(allowedBy(allow)('gh repo view o/r')).toBe(true);
  });

  it.each([
    'git status',
    'git log -n 5',
    'git push origin HEAD',
    'git ls-remote origin',
    'git add -A',
    'gh pr view 5',
    'gh pr ready 5',
    "gh pr comment 5 --body-file - <<'EOF'\ntext\nEOF",
    'gh issue edit 5 --add-blocked-by 6',
    'gh issue edit 5 --remove-label "status: ready-for-agent" --add-label "status: blocked"',
    'gh api repos/o/r/issues/5/dependencies/blocked_by',
    'gh api "repos/o/r/contents/x?ref=chore/C1-from-main" --jq .sha',
    'gh api repos/o/r/pulls/5/files --paginate',
    // The hook guards -f: it passes a GraphQL read (see the Bash hook below).
    "gh api graphql -f query='query { x }'",
    'npm run review:threads -- list 5',
    'npm ci',
  ])('does not deny: %s', command => {
    expect(denied(command)).toBe(false);
  });
});

// The code review reads the PR with git and gh, and may comment. It never runs a project script: the
// PR can hold a hostile one. Which commands it may run is this allowlist; the hook below guards -f.
describe('review-settings.json', () => {
  const { allow, deny } = permissionsOf('review-settings.json');
  const allowed = allowedBy(allow);
  const denied = deniedBy(deny);

  it.each([
    'git grep -n foo -- src',
    'git show HEAD~1:x.ts',
    'git diff origin/main...HEAD',
    'git log -n 5',
    'git status',
    'git rev-parse HEAD',
    'git ls-files -co --exclude-standard docs',
    'git fetch origin main',
    'git fetch origin',
    'gh api repos/o/r/pulls/5/files --paginate',
    "gh api graphql -f query='query { x }'",
    'gh pr view 5',
  ])('allows: %s', command => {
    expect(allowed(command)).toBe(true);
  });

  it.each([
    'git push origin HEAD',
    'git fetch',
    'git fetch https://example.com/r.git',
    'git fetch origin-x',
    'git commit -m x',
    'git checkout x',
    'npm run lint',
    'npm test',
    'npm ci',
    'npx vitest run',
  ])('does not allow: %s', command => {
    expect(allowed(command)).toBe(false);
  });

  // `--output` writes a file, and `--no-index` reads one that `Read(//proc/**)` denies. Git does not
  // shorten either option: the longer options that start the same make a shorter form ambiguous.
  it.each([
    'git diff --output=x origin/main...HEAD',
    'git log --output x',
    'git show --output=x HEAD',
    'git diff --no-index /proc/self/environ /dev/null',
  ])('denies: %s', command => {
    expect(denied(command)).toBe(true);
  });

  it.each(['git diff origin/main...HEAD', 'git log --oneline -n 5'])(
    'does not deny: %s',
    command => {
      expect(denied(command)).toBe(false);
    }
  );

  // The review's token can write, and gh api sends a POST when the call has a field or a method.
  it.each([
    'gh api -X POST repos/o/r/issues/5/labels',
    'gh api --method PATCH repos/o/r/issues/5',
    'gh api repos/o/r/issues/5/comments -F body=@x',
    'gh api repos/o/r/issues/5/comments --field body=x',
    'gh api repos/o/r/issues/5/comments --raw-field body=x',
    'gh api repos/o/r/issues/5 --input -',
  ])('denies: %s', command => {
    expect(denied(command)).toBe(true);
  });
});

// The refresh (.github/agent/refresh.md) may edit an issue's body and comment; every other change
// is denied. It reads Specs written outside the team. Which issue it edits is the hook's job (below).
describe('refresh-settings.json', () => {
  const { allow, deny } = permissionsOf('refresh-settings.json');
  const denied = deniedBy(deny);

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

  // `git grep` can run a command: -O / --open-files-in-pager hands each file to one. A glob has
  // only `*`, so the rule takes -O at the start of a word; the hook takes it in a cluster (-nO).
  it.each([
    'git grep --open-files-in-pager=sh foo',
    'git grep -O sh foo',
    'git grep -Osh foo',
    "git grep -n --open-files-in-pager 'sh -c x' foo",
  ])('denies: %s', command => {
    expect(denied(command)).toBe(true);
  });

  it.each([
    "git grep -n 'old/path' -- ':!plans'",
    "git grep 'OWNER' -- ':!plans'",
    'git grep -n -A30 "## NOTE" -- docs',
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

  // Runs the hook as Claude Code does: through the shell, with the call as JSON on stdin and the
  // job's environment. No output means it leaves the call to the allowlist.
  const hook = (
    command: string,
    file = 'settings.json',
    env: Record<string, string | undefined> = {}
  ) => {
    const entry = settingsOf(file).hooks?.PreToolUse?.find(
      ({ matcher }) => matcher === 'Bash'
    );
    const output = execFileSync('bash', ['-c', entry?.hooks[0].command ?? ''], {
      encoding: 'utf8',
      env: { ...process.env, ISSUE: undefined, ...env },
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
    ['git status; cat x', 'Read'],
    // A quoted `<<` is not a heredoc: what follows it is still checked.
    ["git grep -n '<<' -- x; cat x", 'Read'],
    ['false || cat x', 'Read'],
    ['(cat x)', 'Read'],
    ['cat < x', 'Read'],
    ['grep -rn foo src', 'git grep'],
    ['head -5 x', 'Read'],
    ['ls docs', 'git ls-files'],
    ['sed -n 1,5p x', 'Edit'],
    ['for f in a b; do ls $f; done', 'one command'],
    ['npx prettier x', 'npm run format'],
    ['python3 x.py', 'npm run format'],
    ['node -e "1"', 'npm run format'],
    // Cutting the cd does not excuse what follows it.
    [`cd ${cwd}; cat x`, 'Read'],
    // The shapes settings.json denies, which its rules match with one space between words: the
    // hook matches any blanks, so a double space or a tab is no way past them.
    ['git  remote -v', 'configuration'],
    ['git\tconfig --get remote.origin.url', 'configuration'],
    ['git -c core.fsmonitor=x status', 'configuration'],
    ['git --no-pager  config -l', 'configuration'],
    ['git var -l', 'configuration'],
    ['git ls-remote origin  --get-url', 'configuration'],
    ['git status; git  remote -v', 'configuration'],
    ['gh pr  merge 5', 'a person'],
    ['gh  issue close 5', 'a person'],
    ['gh pr view 5 && gh pr\treview 5 --approve', 'a person'],
    ['gh api  repos/o/r/issues/5/labels -XPOST', 'read only'],
    ['gh api repos/o/r/issues/5/comments -f body=x', 'read only'],
    ['gh api repos/o/r/issues/5/comments -F body=@x', 'read only'],
    ['gh api repos/o/r/issues/5 --input -', 'read only'],
    // Only a GraphQL read with the one field `query` goes through (below).
    ["gh api graphql -f query='mutation { x }'", 'read only'],
    ["gh api graphql -f query='query { x } mutation { y }'", 'read only'],
    ["gh api graphql -f query='Mutation { x }'", 'read only'],
    ['gh api graphql -f query=x -f owner=y', 'read only'],
    ['gh api graphql -f owner=y -f query=x', 'read only'],
    ['gh api graphql -f query=x -F owner=@y', 'read only'],
    ['gh api graphql --method POST -f query=x', 'read only'],
    ['gh api repos/o/r/issues -f query=x', 'read only'],
    [
      'gh api graphql -f query=x; gh api repos/o/r/issues/5 -f body=y',
      'read only',
    ],
    ["gh api graphql -f query='query { x }' --input -", 'read only'],
    // Quotes can split the word `mutation`, and bash joins the pieces again.
    ["gh api graphql -f query='mu''tation { x }'", 'read only'],
    ['gh api graphql -f query="mu""tation { x }"', 'read only'],
    ["gh api graphql -f query=$'\\x6dutation { x }'", 'read only'],
    ['gh api graphql -f query=mut\\ation{x}', 'read only'],
    // git takes a unique prefix of a long option, and bash joins `""` to the next word.
    ['git grep --open=sh foo', 'runs a command'],
    ['git grep --op=sh foo', 'runs a command'],
    ['git grep -n ""-Osh foo', 'runs a command'],
    // The option that opens each file in a program; -nO is a cluster, and the rule can't match it.
    ['git grep -O sh foo', 'runs a command'],
    ['git grep -nO foo', 'runs a command'],
    ['git grep -nOsh foo', 'runs a command'],
    ['git grep foo -nOsh', 'runs a command'],
    ['git grep --open-files-in-pager=sh foo', 'runs a command'],
    ["git grep -n --open-files-in-pager 'sh -c x' foo", 'runs a command'],
    ['git status; git grep -nO foo', 'runs a command'],
    [`cd ${cwd} && git grep -O foo`, 'runs a command'],
    ['gh api repos/o/r/issues/5\t--method=PATCH', 'read only'],
    // A file as the body would post its text, the checkout credentials included.
    ['gh pr comment 5 --body-file .git/config', 'heredoc'],
    ['gh pr comment 5 -F .git/config', 'heredoc'],
    ['gh pr comment 5 -F.git/config', 'heredoc'],
    ['gh issue create --title x --body-file=notes.md', 'heredoc'],
    ['gh pr edit 5 --body-file "notes.md"', 'heredoc'],
    ['gh pr view 1 | gh pr comment 1 --body-file x', 'heredoc'],
    // A quoted word is still that word to bash; a line continuation is still one command.
    ["gh pr 'merge' 5", 'a person'],
    ['gh api repos/o/r/issues/5/comments "-f" body=x', 'read only'],
    ["git 'config' --get remote.origin.url", 'configuration'],
    ["'cat' x", 'Read'],
    ['gh api repos/o/r/issues/5/comments \\\n  -f body=x', 'read only'],
    // Only the lines between the heredoc line and its EOF are text: a command after the operator
    // on that line, or after the EOF, still runs.
    [
      "gh pr comment 5 --body-file - <<'EOF'; git remote -v\nbody\nEOF",
      'configuration',
    ],
    [
      "gh pr comment 5 --body-file - <<'EOF'\nbody\nEOF\ngit remote -v",
      'configuration',
    ],
    // A quoted <<EOF opens no heredoc, so the next line is a command.
    ["git grep '<<EOF'\ngit remote -v", 'configuration'],
    ['git commit -m "<<EOF\n"; cat x\nEOF', 'Read'],
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
    // Claude Code's usual commit form: the `cat` reads the heredoc, not a file.
    'git commit -m "$(cat <<\'EOF\'\nfix\nEOF\n)"',
    'git ls-files -co docs',
    // A filter on a command's output: Read, git grep and git ls-files cannot replace it.
    'gh pr diff 1 | head -50',
    'gh pr view 1 | grep x',
    'gh pr view 1 | cat -n',
    'node scripts/run.mts',
    'npm run format',
    'echo concatenate',
    // Near the denied shapes, but not them.
    'git grep -F foo -- src',
    'git ls-remote origin',
    'git log -n 5',
    'gh issue edit 5 --add-label x-Foo',
    "gh pr create --title x --body-file - <<'EOF'\nbody\nEOF",
    'gh issue comment 5 --body-file=-',
    'gh pr comment 5 -F-',
    'gh pr comment 5 -F=-',
    'gh pr comment 5 --body-file "-"',
    "gh pr comment 5 --body-file - << 'EOF'\nbody\nEOF",
    "gh pr comment 5 --body-file - <<-'EOF'\n\tbody\n\tEOF",
    'gh api repos/o/r/pulls/5/files --paginate',
    'gh api "repos/o/r/contents/x?ref=chore/C1-from-main" --jq .sha',
    // A GraphQL read: -f query= directly after graphql, the only field, and no mutation.
    "gh api graphql -f query='query { viewer { login } }'",
    "gh api graphql -f query='query($n: Int!) { x }' --jq .data",
    'gh api graphql -f query=x',
    'gh api graphql -f query="query { x }"',
    // -O in a word that is not an option, and options that are not -O.
    'git grep -n -A30 "## NOTE" -- docs',
    "git grep -n 'OWNER' -- ':!plans'",
    'git grep -n --no-index -e Foo -- src',
    'git grep --or -e a -e b',
    'git grep -n --only-matching foo',
    'git grep -ne foo',
    // The hook rewrites only a command at the start (below).
    'echo npx vitest run',
    '',
  ])('leaves %j to the allowlist', command => {
    expect(hook(command)).toBeUndefined();
  });

  // The coverage run aborts when a test fails and is slow; CI runs it (D2).
  it.each([
    [
      'npx vitest run a.test.ts',
      'npm test -- --coverage.enabled=false a.test.ts',
    ],
    ['npx vitest a.test.ts', 'npm test -- --coverage.enabled=false a.test.ts'],
    ['npx vitest run', 'npm test -- --coverage.enabled=false'],
    ['npx vitest', 'npm test -- --coverage.enabled=false'],
    [
      'npx  vitest  run a.test.ts -t "a b"',
      'npm test -- --coverage.enabled=false a.test.ts -t "a b"',
    ],
    [
      `cd ${cwd} && npx vitest run a.test.ts`,
      'npm test -- --coverage.enabled=false a.test.ts',
    ],
    [
      'npx vitest runner.test.ts',
      'npm test -- --coverage.enabled=false runner.test.ts',
    ],
  ])('rewrites %j to %j', (command, rewritten) => {
    const output = hook(command);

    expect(output.updatedInput.command).toBe(rewritten);
    expect(output.additionalContext).toContain('npm test');
    expect(output.permissionDecision).toBeUndefined();
  });

  it('says both when it cuts the cd and rewrites npx vitest', () => {
    const output = hook(`cd ${cwd} && npx vitest run a.test.ts`);

    expect(output.additionalContext).toContain('Dropped a leading cd');
    expect(output.additionalContext).toContain('npx vitest');
  });

  // The rewrite is for a command that starts with it; anything else meets the npx row.
  it.each([
    'git status; npx vitest run a.test.ts',
    'npx vitest-ui',
    'npx vitest run a.test.ts && npx prettier x',
  ])('denies %j, naming the alternative', command => {
    expect(hook(command).permissionDecision).toBe('deny');
  });

  it('gives the review the same answers', () => {
    expect(hook('cat x', 'review-settings.json')).toEqual(hook('cat x'));
    expect(hook(`cd ${cwd}; gh pr view 1`, 'review-settings.json')).toEqual(
      hook(`cd ${cwd}; gh pr view 1`)
    );
  });

  // The refresh may rewrite one issue: the one its job names in ISSUE (claude-unblock.yml). A
  // call that says `gh issue edit` anywhere outside quotes goes through only in the one form
  // refresh.md gives, with the body in a heredoc and nothing else, so a second command can't
  // ride in the same call.
  describe('in refresh-settings.json', () => {
    const file = 'refresh-settings.json';
    const edit = (issue: string, body = '# Spec\n\nText.') =>
      `gh issue edit ${issue} --body-file - <<'EOF'\n${body}\nEOF`;

    it('is the one hook of the file', () => {
      expect(settingsOf(file).hooks?.PreToolUse).toHaveLength(1);
    });

    it.each([
      [edit('5'), 'the issue the job names'],
      [`${edit('5')}\n`, 'a trailing newline'],
      [
        edit('5', 'A line\n\n- EOF is not a line here\n  EOF'),
        'EOF inside text',
      ],
    ])('leaves %j to the allowlist: %s', command => {
      expect(hook(command, file, { ISSUE: '5' })).toBeUndefined();
    });

    it.each([
      [edit('7'), 'another issue'],
      [edit('5 7'), 'two issues'],
      ['gh issue edit 5 --title x', 'a flag that is not the body'],
      ['gh issue edit 5 --body-file body.md', 'a file, not the heredoc'],
      [`${edit('5')}\n${edit('7')}`, 'a second command after the heredoc'],
      [`${edit('5')}\ngh issue view 7`, 'any command after the heredoc'],
      // The allowlist would pass each part of a compound command on its own.
      [`gh issue view 5; ${edit('7')}`, 'an edit after another command'],
      [`gh issue view 5 && ${edit('7')}`, 'an edit after &&'],
      [
        'gh issue view 5 | gh issue edit 7 --body-file -',
        'an edit after a pipe',
      ],
      ['echo $(gh issue edit 7 --title x)', 'an edit in a substitution'],
      ['echo `gh issue edit 7 --title x`', 'an edit in backticks'],
      [
        'if true; then gh issue edit 7 --title x; fi',
        'an edit after a keyword',
      ],
      ['! gh issue edit 7 --title x', 'an edit after a bang'],
      ['env gh issue edit 7 --title x', 'an edit after env'],
      [
        `git grep -n '<<' -- ':!plans'; ${edit('7')}`,
        'an edit after a quoted <<',
      ],
      [edit('5', 'text\nEOF\ngh issue view 7'), 'an EOF line inside the body'],
      [edit('5', ''), 'an empty body'],
      ['gh issue edit 5', 'no body'],
      // Another heredoc first: the edit sits past its operator or its EOF.
      [
        "gh issue comment 5 --body-file - <<'EOF'; gh issue edit 7 --body-file - <<'X'\nbody\nEOF\nother\nX",
        'an edit after a comment’s heredoc operator',
      ],
      [
        `gh issue comment 5 --body-file - <<'EOF'\n## Refreshed\nEOF\n${edit('7')}`,
        'an edit after a comment’s heredoc',
      ],
      // The words in a comment's text: the one form is the price of telling them apart.
      [
        "gh issue comment 5 --body-file - <<'EOF'\nRun gh issue edit later.\nEOF",
        'the words in another command’s heredoc',
      ],
    ])('denies %j: %s', command => {
      const output = hook(command, file, { ISSUE: '5' });

      expect(output.permissionDecision).toBe('deny');
      expect(output.permissionDecisionReason).toContain('Edit only issue #5');
      expect(output.permissionDecisionReason).toContain(
        "gh issue edit 5 --body-file - <<'EOF'"
      );
    });

    it('denies every edit when the job names no issue', () => {
      expect(hook(edit('5'), file).permissionDecision).toBe('deny');
      expect(hook(edit('5'), file, { ISSUE: '' }).permissionDecision).toBe(
        'deny'
      );
    });

    // The same -O rule as the shared hook: a cluster like -nO is past the deny rule's glob (D3).
    it.each([
      'git grep -nOsh foo',
      'git grep foo -nOsh',
      'git grep -nO foo',
      'git grep -n --open-files-in-pager=sh foo',
      'git grep --open=sh foo',
      'git grep -n ""-Osh foo',
    ])('denies %j: it runs a command', command => {
      const output = hook(command, file, { ISSUE: '5' });

      expect(output.permissionDecision).toBe('deny');
      expect(output.permissionDecisionReason).toContain('runs a command');
    });

    it.each([
      'gh issue view 5',
      'git grep -n -A30 "## NOTE" -- docs',
      "git grep -n 'OWNER' -- ':!plans'",
      "gh issue comment 5 --body-file - <<'EOF'\n## Refreshed\nEOF",
      // The words inside quotes are text, not a command.
      "git grep -n 'gh issue edit' -- ':!plans'",
      "git grep -n 'x' -- ':!plans'",
      'gh pr diff 1',
    ])('leaves %j to the allowlist', command => {
      expect(hook(command, file, { ISSUE: '5' })).toBeUndefined();
    });
  });
});
