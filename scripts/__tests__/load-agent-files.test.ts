import { execFileSync, spawnSync } from 'node:child_process';
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

// Only the review and the unblock refresh call it themselves; claude.yml and claude-run.yml reach it
// through run-claude.
const ACTION = 'henetiriki/kinscape/.github/actions/load-agent-files';
const CALLERS = ['claude-code-review.yml', 'claude-unblock.yml'];
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
  id?: string;
  if?: string;
  name?: string;
  run?: string;
  shell?: string;
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

  // The bot's name and id are repo variables (scripts/setup-github.sh), not literals in the action.
  it('runs Claude as the bot its callers name', () => {
    expect(stepUsing('anthropics/claude-code-action')?.with).toMatchObject({
      bot_id: '${{ inputs.bot_id }}',
      bot_name: '${{ inputs.bot_login }}',
    });
  });

  // An empty input would replace claude-code-action's default bot, so the action stops first.
  describe('the bot variables check', () => {
    const check = runClaudeSteps()[0];
    const runCheck = (env: Record<string, string>) =>
      spawnSync('bash', ['-c', check.run ?? ''], {
        encoding: 'utf8',
        env: { ...process.env, ...env },
      });

    it('comes first and reads the bot inputs', () => {
      expect(check.name).toBe('Check the bot variables');
      expect(check.env).toEqual({
        BOT_ID: '${{ inputs.bot_id }}',
        BOT_LOGIN: '${{ inputs.bot_login }}',
      });
    });

    it('passes when both are set', () => {
      expect(runCheck({ BOT_ID: '1', BOT_LOGIN: 'a-bot' })).toMatchObject({
        status: 0,
        stdout: '',
      });
    });

    it.each([
      ['no login', { BOT_ID: '1', BOT_LOGIN: '' }],
      ['no id', { BOT_ID: '', BOT_LOGIN: 'a-bot' }],
    ])('stops with %s, naming the variables', (_name, env) => {
      const { status, stdout } = runCheck(env);

      expect(status).toBe(1);
      expect(stdout).toMatch(/KINSCAPE_BOT_LOGIN and KINSCAPE_BOT_ID/);
    });
  });

  it.each(RUN_CLAUDE_CALLERS)('passes the bot variables to it in %s', file => {
    expect(read(file)).toContain('bot_login: ${{ vars.KINSCAPE_BOT_LOGIN }}');
    expect(read(file)).toContain('bot_id: ${{ vars.KINSCAPE_BOT_ID }}');
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

// The refresh job of claude-unblock.yml runs Claude on a Spec's text from outside the team
// (plans/chores/C457-spec-refresh.md). It repeats the review's steps instead of calling run-claude, so
// these keep the copies equal and the job on the least it needs.
describe('the refresh job of claude-unblock.yml', () => {
  type Job = {
    env?: Record<string, string>;
    if?: string;
    needs?: string;
    outputs?: Record<string, string>;
    permissions?: Record<string, string>;
    steps: Step[];
    strategy?: { 'fail-fast'?: boolean; matrix?: { spec?: string } };
  };
  const jobs = () =>
    (parse(read('claude-unblock.yml')) as { jobs: Record<string, Job> }).jobs;
  const refresh = () => jobs().refresh;
  const claude = () =>
    refresh().steps.find(step =>
      step.uses?.startsWith('anthropics/claude-code-action@')
    );

  it('loads rules.md and refresh.md with refresh-settings.json, once', () => {
    const loaders = refresh().steps.filter(step =>
      step.uses?.includes('load-agent-files')
    );

    expect(loaders).toHaveLength(1);
    expect(loaders[0].with).toMatchObject({
      files: 'rules.md refresh.md',
      settings: 'refresh-settings.json',
      token: '${{ github.token }}',
    });
    expect(existsSync(join(root, '.github/agent/refresh.md'))).toBe(true);
    expect(existsSync(join(root, '.github/agent/refresh-settings.json'))).toBe(
      true
    );
  });

  it('has Claude read the settings and system prompt it loaded', () => {
    expect(claude()?.with?.settings).toBe(
      '${{ runner.temp }}/agent/refresh-settings.json'
    );
    expect(claude()?.with?.claude_args).toContain(
      '--append-system-prompt-file ${{ runner.temp }}/agent/system.md'
    );
  });

  // The workflow's token can't push, and what it edits starts no run; a PAT could do both.
  it('runs on main with the workflow token and read access to the code', () => {
    const checkout = refresh().steps.find(step =>
      step.uses?.startsWith('actions/checkout@')
    );

    expect(checkout?.with).toMatchObject({
      'persist-credentials': false,
      ref: 'main',
    });
    expect(claude()?.with?.github_token).toBe('${{ github.token }}');
    expect(refresh().permissions).toEqual({
      contents: 'read',
      issues: 'write',
      'pull-requests': 'read',
    });
    expect(read('claude-unblock.yml')).not.toContain('KINSCAPE_BOT_PAT');
  });

  it('pins claude-code-action to the commit claude-code-review.yml pins', () => {
    expect(
      pins(read('claude-unblock.yml'), 'anthropics/claude-code-action')
    ).toEqual(
      pins(read('claude-code-review.yml'), 'anthropics/claude-code-action')
    );
  });

  it('refreshes each issue the unblock job listed, even after a failure in it', () => {
    const { refresh, unblock } = jobs();

    expect(refresh.needs).toBe('unblock');
    expect(refresh.if).toContain('!cancelled()');
    expect(refresh.if).toContain("needs.unblock.outputs.unblocked != '[]'");
    expect(refresh.strategy).toMatchObject({
      'fail-fast': false,
      matrix: { spec: '${{ fromJSON(needs.unblock.outputs.unblocked) }}' },
    });
    expect(unblock.outputs).toEqual({
      unblocked: '${{ steps.unblock.outputs.unblocked }}',
    });
    expect(unblock.steps.find(step => step.id === 'unblock')?.run).toContain(
      'agent-unblock.mts'
    );
  });

  // The run says it is an unblock run, so refresh.md has it change no label and start no plan.
  it('says it is an unblock run, and names the Spec and its blockers by number only', () => {
    const prompt = String(claude()?.with?.prompt);

    expect(prompt).toContain('.github/agent/refresh.md');
    expect(prompt).toContain('This is an unblock run');
    expect(prompt).toContain('#${{ matrix.spec.number }}');
    expect(prompt).toContain("join(matrix.spec.blockers, ', #')");
    expect(prompt).not.toMatch(/github\.event\.issue\.(title|body)/);
  });
});

// The plan run refreshes the Spec first, with the same file (rule 3 of plans/README.md).
describe('the plan run', () => {
  it('loads refresh.md and tells Claude this is a plan run', () => {
    const plan = read('claude-plan.yml');

    expect(plan).toMatch(/^\s*agent_files: rules\.md refresh\.md$/m);
    expect(plan).toContain(
      'First refresh it as .github/agent/refresh.md says; this is a plan run.'
    );
    expect(plan).toContain('dependencies/blocked_by');
  });
});

// Only a summary of Claude's transcript is uploaded, written by the script from main after a clean
// secret scan (plans/chores/C415-transcript-summary.md). A runner's temp directory isn't always
// /home/runner/work/_temp, so every path starts at runner.temp.
describe("the upload of Claude's output", () => {
  // The copy gitleaks scanned, not the summary it was copied from.
  const SCANNED =
    '${{ runner.temp }}/gitleaks/scan/claude-execution-output.json';
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
    it('uploads the scanned summary alone, for 7 days, after a clean scan', () => {
      const uploads = steps().filter(step =>
        step.uses?.startsWith('actions/upload-artifact@')
      );

      expect(uploads).toHaveLength(1);
      expect(uploads[0].if).toBe(
        "always() && steps.scan.outputs.clean == 'true'"
      );
      expect(uploads[0].with).toEqual({
        name: 'claude-execution-output',
        path: SCANNED,
        'retention-days': 7,
      });
    });

    // A branch or the agent could leave a symlink, file or repo at that path for checkout to follow.
    it('clears the folder, then summarises with the script from main', () => {
      const all = steps();
      const [clear] = named(all, 'Clear the summary script folder');
      const [checkout] = named(all, 'Check out the summary script');

      expect(clear.run).toBe('rm -rf .claude-summary-script');
      expect(all.indexOf(clear)).toBe(all.indexOf(checkout) - 1);
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
        'Clear the summary script folder',
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
    // The gitleaks pin is in the script, from main, so one edit moves both at once.
    expect(Object.keys(scan(runClaudeSteps()).env ?? {}).sort()).toEqual([
      'GH_REPO',
      'GH_TOKEN',
      'RUN_URL',
      'THREAD',
    ]);
  });

  // Without pipefail, a failed comment lookup would read as "no comment yet" and post a second one.
  it('finds the No Claude review comment with pipefail on', () => {
    expect(named(reviewSteps(), 'Report a missing review')[0].shell).toBe(
      'bash'
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
  // Logs what it was asked to scan, what is in the folder it reads .gitleaksignore from, and any
  // config it would take from the environment.
  'gitleaks-stub': `#!/bin/bash
prev=""
for arg in "$@"; do
  [ "$prev" = dir ] && source="$arg"
  [ "$prev" = --gitleaks-ignore-path ] && ignore="$arg"
  prev="$arg"
done
{
  echo "gitleaks $*"
  echo "scanned: $(ls -A "$source" | xargs)"
  echo "ignore folder: $(ls -A "$ignore" | xargs)"
  echo "config env: \${GITLEAKS_CONFIG-}\${GITLEAKS_CONFIG_TOML-}"
} >> "$RUNNER_TEMP/calls"
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
const scanScript = readFileSync(join(root, 'scripts/scan-summary.sh'), 'utf8');
const version = scanScript.match(/^GITLEAKS_VERSION=(\S+)$/m)?.[1];

const scan = (stubs: Record<string, string> = {}, summary = true) => {
  const step = scanStep();
  const dir = mkdtempSync(join(tmpdir(), 'scan-summary-'));
  const file = join(dir, 'claude-summary/claude-execution-output.json');
  const scanned = join(dir, 'gitleaks/scan/claude-execution-output.json');

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
        // Config an earlier step could set through $GITHUB_ENV, to allowlist everything.
        GITLEAKS_CONFIG: '/allow-all.toml',
        GITLEAKS_CONFIG_TOML: 'allow-all',
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
      kept: existsSync(file) || existsSync(scanned),
      log,
      output: text(join(dir, 'output')),
      scanned: existsSync(scanned),
    };
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
};

describe('the scan step', () => {
  it('pins gitleaks to a version and its SHA-256', () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(scanScript).toMatch(/^GITLEAKS_SHA256=[0-9a-f]{64}$/m);
  });

  it('downloads, checks and runs gitleaks on the summary, and says clean', () => {
    const { calls, dir, output, scanned } = scan();

    expect(calls).toContain(
      `https://github.com/gitleaks/gitleaks/releases/download/v${version}/gitleaks_${version}_linux_x64.tar.gz`
    );
    expect(calls).toMatch(
      /^sha256sum --check --quiet [0-9a-f]{64} {2}\S+\/gitleaks\.tar\.gz$/m
    );
    expect(calls).toContain(
      `gitleaks dir ${dir}/gitleaks/scan --no-banner --verbose --redact --exit-code 2 --gitleaks-ignore-path ${dir}/gitleaks\n`
    );
    expect(calls).not.toContain('gh ');
    expect(output).toBe('clean=true\n');
    expect(scanned).toBe(true);
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
  it('scans a copy of the summary alone, with no ignore file or config from the environment', () => {
    const { calls } = scan();

    expect(calls).toContain('scanned: claude-execution-output.json\n');
    expect(calls.match(/^ignore folder: (.*)$/m)?.[1].split(' ')).toEqual([
      'gitleaks',
      'gitleaks.tar.gz',
      'scan',
    ]);
    expect(calls).toContain('config env: \n');
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
    ['claude-unblock.yml', /^\s*files: (.+)$/m],
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
    ['rules.md refresh.md', 'refresh-settings.json'],
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
