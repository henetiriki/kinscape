import { execFileSync } from 'node:child_process';
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
import { parse } from 'yaml';

const root = process.cwd();
const read = (file: string) =>
  readFileSync(join(root, '.github/workflows', file), 'utf8');
const agent = (file: string) =>
  readFileSync(join(root, '.github/agent', file), 'utf8');

// Callers name the action by repo and `@main`: see .github/actions/load-agent-files/action.yml.
// Only the review calls it itself; claude.yml and claude-run.yml reach it through run-claude.
const ACTION = 'henetiriki/kinscape/.github/actions/load-agent-files@main';
const CALLERS = ['claude-code-review.yml'];
const RUN_CLAUDE_CALLERS = ['claude.yml', 'claude-run.yml'];
const action = () =>
  readFileSync(
    join(root, '.github/actions/load-agent-files/action.yml'),
    'utf8'
  );

describe('the load-agent-files action', () => {
  // A review that got settings.json would run with the build agent's tools. The step after the
  // action must read the file the action wrote, or Claude runs without them. (The run-claude
  // action does the same for claude.yml and claude-run.yml: see its tests below.)
  it('is given the settings file the review needs: review-settings.json', () => {
    const workflow = read('claude-code-review.yml');

    expect(workflow.split('\n').map(line => line.trim())).toContain(
      'settings: review-settings.json'
    );
    expect(existsSync(join(root, '.github/agent/review-settings.json'))).toBe(
      true
    );
    expect(workflow, 'the settings Claude reads').toContain(
      'settings: ${{ runner.temp }}/agent/review-settings.json'
    );
    expect(workflow, 'the system prompt Claude reads').toContain(
      '--append-system-prompt-file ${{ runner.temp }}/agent/system.md'
    );
  });

  // GitHub doesn't enforce `required` on a composite action's inputs. A branch cut before this
  // input existed calls the action at `@main` without it, so it falls back to settings.json.
  it('defaults the settings file, for a caller that predates the input', () => {
    const { inputs } = parse(action()) as {
      inputs: { settings: { default?: string } };
    };

    expect(inputs.settings.default).toBe('settings.json');
  });

  it('is told by the review to load review.md', () => {
    expect(read('claude-code-review.yml')).toMatch(/^\s*files: review\.md$/m);
  });

  // The script reads the repo from GH_REPO; a fork's repo would load the fork's `main`.
  it("takes the repo from this run's repository", () => {
    expect(action()).toContain('GH_REPO: ${{ github.repository }}');
  });

  // The tests run only the first step's script, so a second step would go untested.
  it('has one step, and it runs a script', () => {
    const { runs } = parse(action()) as { runs: { steps: { run?: string }[] } };

    expect(runs.steps, 'steps').toHaveLength(1);
    expect(runs.steps[0].run, 'the step has a run:').toBeTypeOf('string');
  });

  it.each(CALLERS)('is used from main, once, by %s', file => {
    const uses = [
      ...read(file).matchAll(/^\s*(?:-\s+)?uses:\s*(\S*load-agent-files\S*)/gm),
    ].map(match => match[1]);

    expect(uses, `${file} needs one "uses: ${ACTION}" step`).toEqual([ACTION]);
  });

  it.each([...RUN_CLAUDE_CALLERS, ...CALLERS])(
    'is the only place %s loads the agent files',
    file => {
      expect(
        read(file),
        `${file} should call the action, not download .github/agent/ itself`
      ).not.toContain('contents/.github/agent');
    }
  );
});

// The run-summary action writes the result section of every Claude run page. Like load-agent-files,
// callers name it by repo and `@main`, so a branch can't change the script that reports on it.
const SUMMARY_ACTION = 'henetiriki/kinscape/.github/actions/run-summary@main';

describe('the run-summary action', () => {
  it.each(['claude.yml', 'claude-run.yml', 'claude-code-review.yml'])(
    'is used from main, once, by %s',
    file => {
      const uses = [
        ...read(file).matchAll(/^\s*(?:-\s+)?uses:\s*(\S*run-summary\S*)/gm),
      ].map(match => match[1]);

      expect(uses, `${file} needs one "uses: ${SUMMARY_ACTION}" step`).toEqual([
        SUMMARY_ACTION,
      ]);
    }
  );
});

// The run-claude action holds the steps claude.yml and claude-run.yml share. It loads the settings
// file Claude then reads, so a wrong one would run a build with another agent's tools.
const RUN_CLAUDE = 'henetiriki/kinscape/.github/actions/run-claude@main';

type Step = { uses?: string; with?: Record<string, string> };
const runClaudeSteps = () =>
  (
    parse(
      readFileSync(join(root, '.github/actions/run-claude/action.yml'), 'utf8')
    ) as { runs: { steps: Step[] } }
  ).runs.steps;
const stepUsing = (name: string) =>
  runClaudeSteps().find(step => step.uses?.startsWith(`${name}@`));
// Every ref a file pins `name` at, e.g. the commit SHA after `anthropics/claude-code-action@`.
const pins = (text: string, name: string) =>
  [...text.matchAll(new RegExp(`uses:\\s*${name}@(\\S+)`, 'g'))].map(
    match => match[1]
  );

describe('the run-claude action', () => {
  it('loads the agent files from main, with settings.json', () => {
    const loader = stepUsing(ACTION.split('@')[0]);

    expect(loader?.uses).toBe(ACTION);
    expect(loader?.with).toMatchObject({
      files: '${{ inputs.files }}',
      settings: 'settings.json',
    });
    expect(existsSync(join(root, '.github/agent/settings.json'))).toBe(true);
  });

  it('has Claude read the settings and system prompt it loaded', () => {
    const claude = stepUsing('anthropics/claude-code-action')?.with;

    expect(claude?.settings).toBe('${{ runner.temp }}/agent/settings.json');
    expect(claude?.claude_args).toContain(
      '--append-system-prompt-file ${{ runner.temp }}/agent/system.md'
    );
  });

  it.each(RUN_CLAUDE_CALLERS)('is used from main, once, by %s', file => {
    const uses = [
      ...read(file).matchAll(/^\s*(?:-\s+)?uses:\s*(\S*run-claude\S*)/gm),
    ].map(match => match[1]);

    expect(uses, `${file} needs one "uses: ${RUN_CLAUDE}" step`).toEqual([
      RUN_CLAUDE,
    ]);
  });

  // The action is the one place the model call lives; a pin left in a caller would be a second.
  it.each(RUN_CLAUDE_CALLERS)(
    'leaves the model call and upload to it in %s',
    file => {
      for (const name of [
        'anthropics/claude-code-action',
        'actions/upload-artifact',
      ]) {
        expect(pins(read(file), name), `${file} pins ${name}`).toEqual([]);
      }
    }
  );

  // Dependabot doesn't scan .github/actions/, so a bump of either pin in the review workflow
  // fails this until the action follows.
  it.each(['anthropics/claude-code-action', 'actions/upload-artifact'])(
    'pins %s to the commit claude-code-review.yml pins',
    name => {
      const pin = stepUsing(name)?.uses?.split('@')[1];

      expect(pin ?? '', `the action pins ${name}`).toMatch(/^[0-9a-f]{40}$/);
      expect(pins(read('claude-code-review.yml'), name)).toEqual([pin]);
    }
  );
});

// Each list is a space-separated set of files in .github/agent/ that become the system prompt.
// A typo is a 404 on the first live run; the order is the order Claude reads them, with
// rules.md first and build.md last (respond.md points to build.md "below").
describe('the agent files a workflow loads', () => {
  it.each([
    ['claude.yml', /^\s*files: (.+)$/m],
    ['claude-plan.yml', /^\s*agent_files: (.+)$/m],
    ['claude-build.yml', /^\s*agent_files: (.+)$/m],
  ] as const)(
    'are in .github/agent/, rules.md first and build.md last, in %s',
    (file, pattern) => {
      const names = read(file).match(pattern)?.[1].split(' ') ?? [];
      const build = names.indexOf('build.md');

      expect(names[0], `${file} must list rules.md first`).toBe('rules.md');
      expect(
        names.filter(name => !existsSync(join(root, '.github/agent', name))),
        `${file} lists files that are not in .github/agent/`
      ).toEqual([]);
      expect(
        build === -1 || build === names.length - 1,
        `${file} must list build.md last`
      ).toBe(true);
    }
  );
});

// A stand-in for `gh api -H "Accept: application/vnd.github.raw"
// "repos/owner/repo/contents/.github/agent/<file>?ref=main"`: fails for any other arguments, prints
// the local file, and fails for one that is not there, as the API does with a 404. With
// STUB_FAIL_FIRST=n, the first n calls fail like a server error.
const GH = `#!/bin/bash
if [ "$#" -ne 4 ] || [ "$1" != api ] || [ "$2" != -H ] || [ "$3" != "Accept: application/vnd.github.raw" ]; then
  echo "unexpected gh call: $*" >&2; exit 1
fi
case "$4" in
  repos/owner/repo/contents/.github/agent/*\\?ref=main) ;;
  *) echo "unexpected gh call: $*" >&2; exit 1 ;;
esac
if [ -n "$STUB_FAIL_FIRST" ]; then
  failed=$(cat "$RUNNER_TEMP/gh-failed" 2>/dev/null || echo 0)
  if [ "$failed" -lt "$STUB_FAIL_FIRST" ]; then
    echo $((failed + 1)) > "$RUNNER_TEMP/gh-failed"; echo "HTTP 502" >&2; exit 1
  fi
fi
name="\${4#repos/owner/repo/contents/.github/agent/}"
name="\${name%\\?ref=main}"
case "$name" in
  */*|*\\?*) echo "unexpected gh call: $*" >&2; exit 1 ;;
esac
cat "$STUB_ROOT/.github/agent/$name"
`;

// The action's script, as the runner sees it: the run block of its one step.
const script = () => {
  const { runs } = parse(action()) as { runs: { steps: { run: string }[] } };

  return runs.steps[0].run;
};

// Runs the script with `gh` stubbed and reads what it left behind.
const load = (
  files: string,
  edit = (run: string) => run,
  extra: Record<string, string> = {}
) => {
  const settingsFile = extra.SETTINGS_FILE ?? 'settings.json';

  const dir = mkdtempSync(join(tmpdir(), 'load-agent-files-'));

  try {
    mkdirSync(join(dir, 'bin'));
    writeFileSync(join(dir, 'bin/gh'), GH, { mode: 0o755 });
    // The retries wait between tries; the tests don't.
    writeFileSync(join(dir, 'bin/sleep'), '#!/bin/bash\n', { mode: 0o755 });
    const log = execFileSync(
      'bash',
      ['-e', '-o', 'pipefail', '-c', edit(script())],
      {
        encoding: 'utf8',
        env: {
          AGENT_FILES: files,
          GH_REPO: 'owner/repo',
          SETTINGS_FILE: settingsFile,
          ...extra,
          GH_TOKEN: 'token',
          GITHUB_STEP_SUMMARY: join(dir, 'summary.md'),
          NODE_ENV: 'test',
          PATH: `${join(dir, 'bin')}:${process.env.PATH}`,
          RUNNER_TEMP: dir,
          STUB_ROOT: root,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    const out = (file: string) => readFileSync(join(dir, file), 'utf8');

    return {
      log,
      settings: out(`agent/${settingsFile}`),
      summary: out('summary.md'),
      system: out('agent/system.md'),
    };
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
};

describe('the load-agent-files script', () => {
  const files = 'rules.md respond.md build.md';

  it('joins the files, in order, each followed by a newline', () => {
    expect(load(files).system).toBe(
      files
        .split(' ')
        .map(file => `${agent(file)}\n`)
        .join('')
    );
  });

  it('downloads settings.json as it is', () => {
    expect(load(files).settings).toBe(agent('settings.json'));
  });

  it('shows the prompt in the log and the run summary', () => {
    const { log, summary, system } = load(files);

    expect(log).toContain(`::group::System prompt (${files})\n${system}`);
    expect(summary).toContain(
      `<details><summary>System prompt (${files})</summary>\n\n${system}`
    );
  });

  it('downloads the settings file it is told to, and loads review.md alone', () => {
    const { settings, system } = load('review.md', undefined, {
      SETTINGS_FILE: 'review-settings.json',
    });

    expect(settings).toBe(agent('review-settings.json'));
    expect(system).toBe(`${agent('review.md')}\n`);
  });

  it('retries a download that fails, up to three tries', () => {
    expect(load(files, undefined, { STUB_FAIL_FIRST: '2' }).system).toContain(
      agent('rules.md')
    );
    expect(() => load(files, undefined, { STUB_FAIL_FIRST: '3' })).toThrow();
  });

  it('fails on a file that is not in .github/agent/', () => {
    expect(() => load('rules.md typo.md')).toThrow();
  });

  // The stub fails on anything but the one call above, so each change here must fail the script.
  // An edit that matched nothing would leave the script as it is and the test would not throw.
  it.each([
    ['another ref', '?ref=main', '?ref=$GITHUB_REF'],
    ['another repo', 'repos/$GH_REPO', 'repos/other/repo'],
    ['no raw header', '-H "Accept: application/vnd.github.raw" ', ''],
    [
      'a path outside .github/agent/',
      '.github/agent/$f',
      '.github/agent/../$f',
    ],
  ])('fails on %s', (_, from, to) => {
    expect(script(), 'the script has the text the edit replaces').toContain(
      from
    );
    expect(() => load(files, run => run.replace(from, to))).toThrow();
  });
});
