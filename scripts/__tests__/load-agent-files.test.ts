import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
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

// Callers name our actions by repo, pinned to a full SHA of a main commit (actions-pin-update.yml
// moves the pins): see .github/actions/load-agent-files/action.yml.
const OWN_PIN =
  /^henetiriki\/kinscape\/\.github\/actions\/[\w-]+@[0-9a-f]{40}$/;
// The action a `uses:` names when it pins one of ours that way; any other ref as it is.
const own = (uses = '') => (OWN_PIN.test(uses) ? uses.split('@')[0] : uses);

// Only the review calls it itself; claude.yml and claude-run.yml reach it through run-claude.
const ACTION = 'henetiriki/kinscape/.github/actions/load-agent-files';
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

  // GitHub doesn't enforce `required` on a composite action's inputs. A caller that predates this
  // input calls the action without it, so it falls back to settings.json.
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

  it.each(CALLERS)('is used from a pinned main commit, once, by %s', file => {
    const uses = [
      ...read(file).matchAll(/^\s*(?:-\s+)?uses:\s*(\S*load-agent-files\S*)/gm),
    ].map(match => own(match[1]));

    expect(uses, `${file} needs one "uses: ${ACTION}@<SHA>" step`).toEqual([
      ACTION,
    ]);
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
// callers pin it to a main commit, so a branch can't change the script that reports on it.
const SUMMARY_ACTION = 'henetiriki/kinscape/.github/actions/run-summary';

describe('the run-summary action', () => {
  it.each(['claude.yml', 'claude-run.yml', 'claude-code-review.yml'])(
    'is used from a pinned main commit, once, by %s',
    file => {
      const uses = [
        ...read(file).matchAll(/^\s*(?:-\s+)?uses:\s*(\S*run-summary\S*)/gm),
      ].map(match => own(match[1]));

      expect(
        uses,
        `${file} needs one "uses: ${SUMMARY_ACTION}@<SHA>" step`
      ).toEqual([SUMMARY_ACTION]);
    }
  );
});

// The run-claude action holds the steps claude.yml and claude-run.yml share. It loads the settings
// file Claude then reads, so a wrong one would run a build with another agent's tools.
const RUN_CLAUDE = 'henetiriki/kinscape/.github/actions/run-claude';

type Step = {
  'continue-on-error'?: boolean;
  env?: Record<string, string>;
  if?: string;
  name?: string;
  run?: string;
  uses?: string;
  with?: Record<string, unknown>;
};
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
  it('loads the agent files from a pinned main commit, with settings.json', () => {
    const loader = stepUsing(ACTION);

    expect(own(loader?.uses)).toBe(ACTION);
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

  it.each(RUN_CLAUDE_CALLERS)(
    'is used from a pinned main commit, once, by %s',
    file => {
      const uses = [
        ...read(file).matchAll(/^\s*(?:-\s+)?uses:\s*(\S*run-claude\S*)/gm),
      ].map(match => own(match[1]));

      expect(
        uses,
        `${file} needs one "uses: ${RUN_CLAUDE}@<SHA>" step`
      ).toEqual([RUN_CLAUDE]);
    }
  );

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

  // Dependabot's `actions` group takes minor and patch, so a major bump of either pin arrives as
  // two PRs, one per file. This fails until both carry it.
  it.each(['anthropics/claude-code-action', 'actions/upload-artifact'])(
    'pins %s to the commit claude-code-review.yml pins',
    name => {
      const pin = stepUsing(name)?.uses?.split('@')[1];

      expect(pin ?? '', `the action pins ${name}`).toMatch(/^[0-9a-f]{40}$/);
      expect(pins(read('claude-code-review.yml'), name)).toEqual([pin]);
    }
  );
});

// Only a summary of Claude's transcript is uploaded, written by the script from main after a clean
// secret scan (plans/chores/C415-transcript-summary.md). A runner's temp directory isn't always
// /home/runner/work/_temp, so every path starts at runner.temp.
describe("the upload of Claude's output", () => {
  const SUMMARY =
    '${{ runner.temp }}/claude-summary/claude-execution-output.json';
  const reviewSteps = () =>
    Object.values(
      (
        parse(read('claude-code-review.yml')) as {
          jobs: Record<string, { steps?: Step[] }>;
        }
      ).jobs
    ).flatMap(job => job.steps ?? []);
  const named = (steps: Step[], name: string) =>
    steps.filter(step => step.name === name);

  // run-claude's callers set up Node in setup-workspace; the review sets it up for the summary.
  describe.each([
    ['run-claude', runClaudeSteps, false],
    ['claude-code-review.yml', reviewSteps, true],
  ])('in %s', (_, steps, node) => {
    it('uploads the summary alone, for 7 days, after a clean scan', () => {
      const uploads = steps().filter(step =>
        step.uses?.startsWith('actions/upload-artifact@')
      );

      expect(uploads).toHaveLength(1);
      expect(uploads[0].if).toBe(
        "always() && steps.scan.outputs.clean == 'true'"
      );
      expect(uploads[0].with).toEqual({
        name: 'claude-execution-output',
        path: SUMMARY,
        'retention-days': 7,
      });
    });

    it('summarises with the script from main', () => {
      const [checkout] = named(steps(), 'Check out the summary script');
      const [summarise] = named(steps(), "Summarise Claude's output");

      expect(checkout.with).toMatchObject({
        path: '.claude-summary-script',
        'persist-credentials': false,
        ref: 'main',
      });
      expect(summarise.run).toBe(
        'node .claude-summary-script/scripts/agent-transcript.mts "$RUNNER_TEMP/claude-execution-output.json" "$RUNNER_TEMP/claude-summary/claude-execution-output.json"'
      );
    });

    it('runs the summary steps even when Claude failed, and never fails on them', () => {
      for (const name of [
        'Check out the summary script',
        ...(node ? ['Set up Node for the summary'] : []),
        "Summarise Claude's output",
        'Scan the summary for secrets',
      ]) {
        expect(named(steps(), name), name).toEqual([
          expect.objectContaining({
            'continue-on-error': true,
            if: 'always()',
          }),
        ]);
      }
    });
  });

  it('scans the same way in both, with the script from main', () => {
    const scan = (steps: Step[]) => {
      const [step] = named(steps, 'Scan the summary for secrets');

      return { env: step.env, run: step.run };
    };

    expect(scan(reviewSteps())).toEqual(scan(runClaudeSteps()));
    expect(scan(runClaudeSteps()).run).toBe(
      'bash .claude-summary-script/scripts/scan-summary.sh'
    );
  });
});

// A stand-in for each program the scan step runs. Each logs its call to $RUNNER_TEMP/calls; STUB_*
// variables make one fail. tar installs gitleaks-stub as gitleaks, which exits with $STUB_GITLEAKS_EXIT.
const SCAN_STUBS: Record<string, string> = {
  curl: `#!/bin/bash
echo "curl $*" >> "$RUNNER_TEMP/calls"
[ -n "$STUB_CURL_FAIL" ] && exit 22
while [ "$#" -gt 0 ]; do [ "$1" = -o ] && echo tarball > "$2"; shift; done
`,
  gh: `#!/bin/bash
printf 'gh %s\n' "$*" >> "$RUNNER_TEMP/calls"
exit "\${STUB_GH_EXIT:-0}"
`,
  // Logs what it was asked to scan, and what is in the folder it reads .gitleaksignore from.
  'gitleaks-stub': `#!/bin/bash
echo "gitleaks $*" >> "$RUNNER_TEMP/calls"
echo "scanned: $(ls -A "$2" | xargs)" >> "$RUNNER_TEMP/calls"
echo "ignore folder: $(ls -A "$9" | xargs)" >> "$RUNNER_TEMP/calls"
exit "\${STUB_GITLEAKS_EXIT:-0}"
`,
  sha256sum: `#!/bin/bash
read -r line
echo "sha256sum $* $line" >> "$RUNNER_TEMP/calls"
[ -n "$STUB_SHA_FAIL" ] && exit 1
exit 0
`,
  tar: `#!/bin/bash
echo "tar $*" >> "$RUNNER_TEMP/calls"
cp "$(dirname "$0")/gitleaks-stub" "$4/gitleaks"
`,
};

// run-claude's scan step, which runs scripts/scan-summary.sh with its env; the test above checks
// claude-code-review.yml's is the same.
const scanStep = () =>
  runClaudeSteps().find(
    ({ name }) => name === 'Scan the summary for secrets'
  ) as { env: Record<string, string>; run: string } & Step;

// Runs scripts/scan-summary.sh with run-claude's env and the stubs, over a summary unless `summary`
// is false.
const scan = (stubs: Record<string, string> = {}, summary = true) => {
  const step = scanStep();
  const dir = mkdtempSync(join(tmpdir(), 'scan-summary-'));
  const file = join(dir, 'claude-summary/claude-execution-output.json');

  try {
    mkdirSync(join(dir, 'bin'));
    for (const [name, text] of Object.entries(SCAN_STUBS)) {
      writeFileSync(join(dir, 'bin', name), text, { mode: 0o755 });
    }
    // Files that would make gitleaks ignore findings, where a run could have left them.
    mkdirSync(join(dir, 'gitleaks'));
    writeFileSync(join(dir, 'gitleaks/.gitleaksignore'), 'all');
    if (summary) {
      mkdirSync(join(dir, 'claude-summary'));
      writeFileSync(file, '{}');
      writeFileSync(join(dir, 'claude-summary/.gitleaks.toml'), 'allow');
    }
    const log = execFileSync('bash', [join(root, 'scripts/scan-summary.sh')], {
      encoding: 'utf8',
      env: {
        ...step.env,
        ...stubs,
        GH_REPO: 'owner/repo',
        GH_TOKEN: 'token',
        GITHUB_OUTPUT: join(dir, 'output'),
        NODE_ENV: 'test',
        PATH: `${join(dir, 'bin')}:${process.env.PATH}`,
        RUN_URL: 'https://run',
        RUNNER_TEMP: dir,
        THREAD: '7',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const text = (path: string) =>
      existsSync(path) ? readFileSync(path, 'utf8') : '';

    return {
      calls: text(join(dir, 'calls')),
      dir,
      kept: existsSync(file),
      log,
      output: text(join(dir, 'output')),
      version: step.env.GITLEAKS_VERSION,
    };
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
};

describe('the scan step', () => {
  it('pins gitleaks to a version and its SHA-256', () => {
    const { env } = scanStep();

    expect(env.GITLEAKS_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(env.GITLEAKS_SHA256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('downloads, checks and runs gitleaks on the summary, and says clean', () => {
    const { calls, dir, kept, output, version } = scan();

    expect(calls).toContain(
      `https://github.com/gitleaks/gitleaks/releases/download/v${version}/gitleaks_${version}_linux_x64.tar.gz`
    );
    expect(calls).toMatch(
      /^sha256sum --check --quiet [0-9a-f]{64} {2}\S+\/gitleaks\.tar\.gz$/m
    );
    expect(calls).toContain(
      `gitleaks dir ${dir}/gitleaks/scan --no-banner --redact --exit-code 2 --gitleaks-ignore-path ${dir}/gitleaks\n`
    );
    expect(calls).not.toContain('gh ');
    expect(output).toBe('clean=true\n');
    expect(kept).toBe(true);
  });

  it.each([
    [
      'gitleaks finds something',
      { STUB_GITLEAKS_EXIT: '2' },
      "gitleaks found a possible secret in Claude's output",
    ],
    [
      'gitleaks fails',
      { STUB_GITLEAKS_EXIT: '1' },
      "The secret scan of Claude's output failed",
    ],
    [
      'the download fails',
      { STUB_CURL_FAIL: '1' },
      "The secret scan of Claude's output failed",
    ],
    [
      'the checksum differs',
      { STUB_SHA_FAIL: '1' },
      "The secret scan of Claude's output failed",
    ],
  ])('keeps nothing and comments on the thread when %s', (_, stubs, why) => {
    const { calls, kept, output } = scan(stubs);

    expect(output).toBe('');
    expect(kept).toBe(false);
    expect(calls).toContain(
      "gh api repos/owner/repo/issues/7/comments -f body=## :rotating_light: Claude's output not kept"
    );
    expect(calls).toContain(
      `${why}, so [the run](https://run) uploaded no summary.`
    );
  });

  // A branch or the agent could leave a .gitleaksignore or .gitleaks.toml that allowlists a finding.
  it('scans a copy of the summary alone, with no ignore file', () => {
    const { calls } = scan();

    expect(calls).toContain('scanned: claude-execution-output.json\n');
    expect(calls).toMatch(/^ignore folder: [^.]*$/m);
  });

  it('runs gitleaks only on a download that checks out', () => {
    expect(scan({ STUB_SHA_FAIL: '1' }).calls).not.toContain('gitleaks dir');
  });

  it('warns in the log when it cannot comment', () => {
    const { kept, log } = scan({ STUB_GH_EXIT: '1', STUB_GITLEAKS_EXIT: '2' });

    expect(kept).toBe(false);
    expect(log).toContain(
      "::warning::gitleaks found a possible secret in Claude's output: no summary uploaded."
    );
  });

  it('does nothing without a summary', () => {
    const { calls, output } = scan({}, false);

    expect(calls).toBe('');
    expect(output).toBe('');
  });
});

// A tag or branch can be moved to other code, and these actions run `npm ci` with the bot PAT.
// Dependabot bumps a SHA with its tag in the comment; actions-pin-update.yml moves our own.
describe('the composite actions', () => {
  const ACTIONS = join(root, '.github/actions');
  const OWN = 'henetiriki/kinscape/';
  const actions = readdirSync(ACTIONS, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  // Every `uses:` in an action's steps, except a local `./` action.
  const used = (name: string) =>
    (
      parse(readFileSync(join(ACTIONS, name, 'action.yml'), 'utf8')) as {
        runs: { steps?: Step[] };
      }
    ).runs.steps
      ?.flatMap(step => (step.uses ? [step.uses] : []))
      .filter(uses => !uses.startsWith('./')) ?? [];
  const unpinned = (uses: string) => !/@[0-9a-f]{40}$/.test(uses);

  it('checks the third-party steps of setup-workspace', () => {
    expect(
      used('setup-workspace').filter(uses => !uses.startsWith(OWN)).length
    ).toBeGreaterThan(0);
  });

  it.each(actions)(
    'pins every step in %s to a 40-character SHA, ours included',
    name => {
      expect(
        used(name).filter(unpinned),
        `${name} uses an action with another ref`
      ).toEqual([]);
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
      temp: dir,
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

  // The settings name a GitHub-hosted runner's temp folder; the test's runner temp is elsewhere.
  it.each([
    [files, 'settings.json'],
    ['review.md', 'review-settings.json'],
  ])(
    "downloads the settings for %s, denying this runner's temp folder too",
    (list, file) => {
      const { settings, temp } = load(list, undefined, { SETTINGS_FILE: file });
      const expected = JSON.parse(agent(file));

      expected.permissions.deny.push(`Read(/${temp}/**)`);

      expect(JSON.parse(settings)).toEqual(expected);
    }
  );

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

    expect(JSON.parse(settings).permissions.allow).toEqual(
      JSON.parse(agent('review-settings.json')).permissions.allow
    );
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
