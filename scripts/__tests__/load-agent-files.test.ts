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
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const root = process.cwd();
const read = (file: string) =>
  readFileSync(join(root, '.github/workflows', file), 'utf8');
const agent = (file: string) =>
  readFileSync(join(root, '.github/agent', file), 'utf8');

// What the review loads from main besides .github/agent/ (plans/chores/C588-review-config-from-main.md):
// the files CLAUDE.md imports, which Claude reads from the checkout, so main's copies are put there;
// the plugin marketplace; and this workflow, compared with the checkout before Claude runs.
const MARKETPLACE = '.github/claude-plugins/.claude-plugin/marketplace.json';
const REVIEW_WORKFLOW = '.github/workflows/claude-code-review.yml';
const imports = () =>
  readFileSync(join(root, 'CLAUDE.md'), 'utf8')
    .match(/^@(\S+)$/gm)
    ?.map(line => line.slice(1)) ?? [];
const mainFiles = () => [...imports(), MARKETPLACE, REVIEW_WORKFLOW];

// Callers name our actions by repo, pinned to a full SHA of a main commit (actions-pin-update.yml
// moves the pins): see .github/actions/load-agent-files/action.yml.
const OWN_PIN =
  /^henetiriki\/kinscape\/\.github\/actions\/[\w-]+@[0-9a-f]{40}$/;
// The action a `uses:` names when it pins one of ours that way; any other ref as it is.
const own = (uses = '') => (OWN_PIN.test(uses) ? uses.split('@')[0] : uses);

// Only the review and the unblock refresh call it themselves; claude-respond.yml and claude-run.yml reach it
// through run-claude.
const ACTION = 'henetiriki/kinscape/.github/actions/load-agent-files';
const CALLERS = ['claude-code-review.yml', 'claude-unblock.yml'];
const RUN_CLAUDE_CALLERS = ['claude-respond.yml', 'claude-run.yml'];
const action = () =>
  readFileSync(
    join(root, '.github/actions/load-agent-files/action.yml'),
    'utf8'
  );

describe('the load-agent-files action', () => {
  // A review that got settings.json would run with the build agent's tools. The step after the
  // action must read the file the action wrote, or Claude runs without them. (The run-claude
  // action does the same for claude-respond.yml and claude-run.yml: see its tests below.)
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

  // Only the review names files outside .github/agent/: every other loader step, in a workflow or
  // in run-claude, gets none.
  it('loads no main files unless told to', () => {
    const { inputs } = parse(action()) as {
      inputs: { main_files: { default?: string } };
    };
    const loaders = readdirSync(join(root, '.github/workflows'))
      .filter(
        file => file.endsWith('.yml') && file !== 'claude-code-review.yml'
      )
      .flatMap(file =>
        Object.values(
          (parse(read(file)) as { jobs: Record<string, { steps?: Step[] }> })
            .jobs
        ).flatMap(job => job.steps ?? [])
      )
      .concat(runClaudeSteps())
      .filter(step => step.uses?.includes('load-agent-files'));

    expect(inputs.main_files.default).toBe('');
    expect(loaders.length).toBeGreaterThan(1);
    for (const loader of loaders) {
      expect(loader.with).not.toHaveProperty('main_files');
    }
  });

  // review.md is the process, review-code.md what to look for (plans/chores/C644-review-code-rules.md).
  it('is told by the review to load review.md, then review-code.md', () => {
    expect(read('claude-code-review.yml')).toMatch(
      /^\s*files: review\.md review-code\.md$/m
    );
  });

  // The rule groups of #644: the review drops one only by this test failing.
  it.each([
    'Rules',
    'Code smells (not style)',
    'Placement',
    'Pattern table',
    'New surface',
    'Test quality',
    'Decision reversal',
    'Stale facts',
    'Scale',
    'Workflows',
  ])('gives the review the rule group "%s"', heading => {
    const [, ...rules] = (
      agent('review-code.md')
        .split(/^## /m)
        .find(section => section.split('\n')[0] === heading) ?? ''
    ).split('\n');

    expect(rules.join('').trim(), `"## ${heading}" has no rules`).not.toBe('');
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
  it.each(['claude-respond.yml', 'claude-run.yml', 'claude-code-review.yml'])(
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

// The run-claude action holds the steps claude-respond.yml and claude-run.yml share. It loads the settings
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
const reviewSteps = () =>
  Object.values(
    (
      parse(read('claude-code-review.yml')) as {
        jobs: Record<string, { steps?: Step[] }>;
      }
    ).jobs
  ).flatMap(job => job.steps ?? []);
const refreshSteps = () =>
  (
    parse(read('claude-unblock.yml')) as {
      jobs: Record<string, { steps?: Step[] }>;
    }
  ).jobs.refresh.steps ?? [];
const keepFile = join(root, '.github/actions/keep-claude-output/action.yml');
const keepAction = () =>
  parse(readFileSync(keepFile, 'utf8')) as {
    inputs: Record<string, { default?: string; required?: boolean }>;
    runs: { steps: Step[] };
  };
const keepSteps = () => keepAction().runs.steps;
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

  // Only the team's comments reach the prompt: the write collaborators (a repo variable), the
  // bot for its own earlier replies, and the reviewer (github-actions) for its findings. The
  // triggering comment arrives separately.
  it('reads comments by the team, the bot and the reviewer only', () => {
    expect(
      stepUsing('anthropics/claude-code-action')?.with
        ?.include_comments_by_actor
    ).toBe(
      '${{ inputs.team_logins }},${{ inputs.bot_login }},github-actions[bot]'
    );
  });

  // An empty input would replace claude-code-action's default bot, or leave Claude only its own
  // comments, so the action stops first.
  describe('the repo variables check', () => {
    const check = runClaudeSteps()[0];
    const all = { BOT_ID: '1', BOT_LOGIN: 'a-bot', TEAM_LOGINS: 'a,b' };
    const runCheck = (env: Record<string, string>) =>
      spawnSync('bash', ['-c', check.run ?? ''], {
        encoding: 'utf8',
        env: { ...process.env, ...env },
      });

    it('comes first and reads the variable inputs', () => {
      expect(check.name).toBe('Check the repo variables');
      expect(check.env).toEqual({
        BOT_ID: '${{ inputs.bot_id }}',
        BOT_LOGIN: '${{ inputs.bot_login }}',
        TEAM_LOGINS: '${{ inputs.team_logins }}',
      });
    });

    it('passes when all are set', () => {
      expect(runCheck(all)).toMatchObject({ status: 0, stdout: '' });
    });

    it.each([
      ['no login', { ...all, BOT_LOGIN: '' }],
      ['no id', { ...all, BOT_ID: '' }],
      ['no team', { ...all, TEAM_LOGINS: '' }],
    ])('stops with %s, naming the variables', (_name, env) => {
      const { status, stdout } = runCheck(env);

      expect(status).toBe(1);
      expect(stdout).toMatch(
        /KINSCAPE_BOT_LOGIN, KINSCAPE_BOT_ID and KINSCAPE_TEAM_LOGINS/
      );
    });
  });

  it.each(RUN_CLAUDE_CALLERS)('passes the repo variables to it in %s', file => {
    expect(read(file)).toContain('bot_login: ${{ vars.KINSCAPE_BOT_LOGIN }}');
    expect(read(file)).toContain('bot_id: ${{ vars.KINSCAPE_BOT_ID }}');
    expect(read(file)).toContain(
      'team_logins: ${{ vars.KINSCAPE_TEAM_LOGINS }}'
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

  // Dependabot's `actions` group takes minor and patch, so a major bump of the pin arrives as
  // two PRs, one per file. This fails until both carry it.
  it('pins claude-code-action to the commit claude-code-review.yml pins', () => {
    const name = 'anthropics/claude-code-action';
    const pin = stepUsing(name)?.uses?.split('@')[1];

    expect(pin ?? '', `the action pins ${name}`).toMatch(/^[0-9a-f]{40}$/);
    expect(pins(read('claude-code-review.yml'), name)).toEqual([pin]);
  });

  // The agent is a GitHub App (scripts/setup-github.sh), and the action refuses a bot actor unless
  // it is listed. Only the review runs with the App as actor, on its own PRs; the other runs have a person.
  it('lists the bot for the review only, where the App is the actor', () => {
    const name = 'anthropics/claude-code-action';
    const using = (steps: Step[]) =>
      steps.find(step => step.uses?.startsWith(`${name}@`));

    expect(using(reviewSteps())?.with?.allowed_bots).toBe(
      '${{ vars.KINSCAPE_BOT_LOGIN }}'
    );
    expect(stepUsing(name)?.with?.allowed_bots).toBeUndefined();
    expect(using(refreshSteps())?.with?.allowed_bots).toBeUndefined();
  });
});

// The refresh job of claude-unblock.yml runs Claude on a Spec's text from outside the team
// (plans/chores/C457-spec-refresh.md). It repeats the review's steps instead of calling run-claude, so
// these keep the copies equal and the job on the least it needs.
describe('the refresh job of claude-unblock.yml', () => {
  type Job = {
    concurrency?: string;
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

  // The level an @claude comment on a Spec runs at (claude-respond.yml); only a plan PR gets Opus.
  it('runs on Sonnet, as an @claude comment on a Spec does', () => {
    expect(claude()?.with?.claude_args).toMatch(/^--model sonnet /);
  });

  // The workflow's token can't push, and what it edits starts no run; the App token could do both.
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
    expect(read('claude-unblock.yml')).not.toContain(
      'KINSCAPE_APP_PRIVATE_KEY'
    );
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
    // Not `thread-<n>`: it would queue with, and replace, the @claude runs on the Spec.
    expect(refresh.concurrency).toBe('refresh-${{ matrix.spec.number }}');
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

  // settings.json denies `gh api` a method or a body, so a blocker is linked through `gh issue edit`.
  it('links a blocker with gh issue edit, not a POST', () => {
    const plan = read('claude-plan.yml');

    expect(plan).toContain(
      '`gh issue edit ${{ github.event.issue.number }} --add-blocked-by <other>`'
    );
    expect(plan).not.toMatch(/gh api -X|--jq \.id/);
  });
});

// Claude's report and full output stay off the public run page on every run; run-summary writes
// the page from the scanned summary instead.
describe('the claude-code-action steps', () => {
  const name = 'anthropics/claude-code-action';
  const using = (steps: Step[]) =>
    steps.find(step => step.uses?.startsWith(`${name}@`));

  it.each([
    ['the run-claude action', () => runClaudeSteps()],
    ['claude-code-review.yml', () => reviewSteps()],
    ['claude-unblock.yml', () => refreshSteps()],
  ])('show no report and no full output in %s', (_where, steps) => {
    expect(using(steps())?.with).toMatchObject({
      display_report: false,
      show_full_output: false,
    });
  });
});

// A build checks out the commit the approval recorded and no other (scripts/agent-approve.mts).
describe('the approved-commit check', () => {
  type Job = {
    outputs?: Record<string, string>;
    steps?: Step[];
    with?: Record<string, unknown>;
  };
  const runSteps = () =>
    (parse(read('claude-run.yml')) as { jobs: Record<string, Job> }).jobs.run
      .steps ?? [];
  const check = () =>
    runSteps().find(
      step => step.name === 'Check that the branch is at the approved commit'
    );
  const index = (name: string) =>
    runSteps().findIndex(step => step.name === name);

  it('is an input of the shared runner, empty unless a build passes it', () => {
    const { inputs } = (
      parse(read('claude-run.yml')) as {
        on: { workflow_call: { inputs: Record<string, unknown> } };
      }
    ).on.workflow_call;

    expect(inputs.head).toMatchObject({ default: '', type: 'string' });
  });

  // Right after the token, before the browser install: a stop then costs no install and no model
  // run, and the safety net has the token and the start time it needs.
  it('runs with the bot’s token, after it is minted and before the browser install, only when a head is given', () => {
    const at = index('Check that the branch is at the approved commit');

    expect(check()?.id).toBe('head');
    expect(check()?.if).toBe("inputs.head != ''");
    expect(check()?.env).toMatchObject({
      GH_TOKEN: '${{ steps.bot.outputs.token }}',
      HEAD: '${{ inputs.head }}',
    });
    expect(at).toBe(index("Create the bot's token") + 1);
    expect(index('Note the start time')).toBeLessThan(at);
    expect(index('Install Playwright')).toBeGreaterThan(at);
  });

  // The check commented already; the safety net would add "finished without commenting". When its
  // comment failed, the net still speaks.
  it('keeps the safety net quiet after a stop that commented', () => {
    const net = runSteps().find(
      step => step.name === 'If Claude left no comment, post one'
    );

    expect(net?.if).toBe("always() && steps.head.outputs.commented != 'true'");
  });

  it('is fed by the approval: the review commit in, the recorded head out to the build', () => {
    const { approve, build } = (
      parse(read('claude-build.yml')) as { jobs: Record<string, Job> }
    ).jobs;
    const record = approve.steps?.find(step => step.id === 'approve');

    expect(record?.env?.COMMIT).toBe('${{ github.event.review.commit_id }}');
    expect(approve.outputs?.head).toBe('${{ steps.approve.outputs.head }}');
    expect(build.with?.head).toBe('${{ needs.approve.outputs.head }}');
  });

  // The step's script, with a `git` that answers the head it is given and a `gh` that records its call.
  describe('the step', () => {
    const approved = 'a'.repeat(40);
    // `ghFails` makes the comment fail, as a GitHub error would.
    const runCheck = (now: string, ghFails = false) => {
      const bin = mkdtempSync(join(tmpdir(), 'approved-commit-'));
      const calls = join(bin, 'calls');
      const output = join(bin, 'output');

      writeFileSync(join(bin, 'git'), `#!/bin/sh\necho ${now}\n`, {
        mode: 0o755,
      });
      writeFileSync(
        join(bin, 'gh'),
        `#!/bin/sh\necho "$@" >> ${calls}\nexit ${ghFails ? 1 : 0}\n`,
        { mode: 0o755 }
      );

      const result = spawnSync('bash', ['-e', '-c', check()?.run ?? ''], {
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_OUTPUT: output,
          HEAD: approved,
          PATH: `${bin}:${process.env.PATH}`,
          THREAD: '42',
        },
      });
      const read = (file: string) =>
        existsSync(file) ? readFileSync(file, 'utf8') : '';
      const comments = read(calls);
      const outputs = read(output);

      rmSync(bin, { force: true, recursive: true });

      return { ...result, comments, outputs };
    };

    it('passes, saying so, when the branch is at the approved commit', () => {
      const { comments, outputs, status, stdout } = runCheck(approved);

      expect(status).toBe(0);
      expect(stdout).toContain(`At the approved commit ${approved}.`);
      expect(comments).toBe('');
      expect(outputs).toBe('');
    });

    it('fails without saying it commented when the comment fails', () => {
      const { comments, outputs, status } = runCheck('b'.repeat(40), true);

      expect(status).toBe(1);
      expect(comments).toContain('pr comment 42 --body');
      expect(outputs).toBe('');
    });

    it('comments on the PR with both commits, says so, and fails when the branch has moved', () => {
      const moved = 'b'.repeat(40);
      const { comments, outputs, status } = runCheck(moved);

      expect(status).toBe(1);
      expect(outputs).toBe('commented=true\n');
      expect(comments).toContain('pr comment 42 --body');
      expect(comments).toContain(
        'Not built: the branch moved after the approval'
      );
      expect(comments).toContain(`\`${approved.slice(0, 7)}\``);
      expect(comments).toContain(`\`${moved.slice(0, 7)}\``);
      expect(comments).toContain('Approve the plan again.');
    });
  });
});

// Only a summary of Claude's transcript is uploaded, written by the script from main after a clean
// secret scan (plans/chores/C415-transcript-summary.md). The keep-claude-output action holds those
// steps once (plans/chores/C481-keep-claude-output.md). A runner's temp directory isn't always
// /home/runner/work/_temp, so every path starts at runner.temp.
const KEEP = 'henetiriki/kinscape/.github/actions/keep-claude-output';
const NODE_STEP = 'Install Node for the summary';
const SUMMARY_STEPS = [
  'Clear the summary script folder',
  'Fetch the summary script',
  NODE_STEP,
  "Summarise Claude's output",
  'Scan the summary for secrets',
];
const named = (steps: Step[], name: string) =>
  steps.filter(step => step.name === name);

describe('the keep-claude-output action', () => {
  // The copy gitleaks scanned, not the summary it was copied from.
  const SCANNED =
    '${{ runner.temp }}/gitleaks/scan/claude-execution-output.json';

  it('uploads the scanned summary alone, for 7 days, replacing an earlier attempt, after a clean scan', () => {
    const uploads = keepSteps().filter(step =>
      step.uses?.startsWith('actions/upload-artifact@')
    );

    expect(uploads).toHaveLength(1);
    expect(uploads[0].if).toBe(
      "always() && steps.scan.outputs.clean == 'true'"
    );
    expect(uploads[0].with).toEqual({
      // The review's changes-since step looks the artifact up by the exact name, and the denial audit
      // by the name and by names that start with it, so a suffix must follow it.
      name: 'claude-execution-output${{ inputs.name_suffix }}',
      // A re-run of a failed job uploads under the same name; without this the upload fails on it.
      overwrite: true,
      path: SCANNED,
      'retention-days': 7,
    });
  });

  it('takes the thread the scan comments on, whether to set up Node and a name suffix', () => {
    const { inputs } = keepAction();

    expect(Object.keys(inputs).sort()).toEqual([
      'name_suffix',
      'setup_node',
      'thread',
    ]);
    expect(inputs.thread.required).toBe(true);
    expect(inputs.setup_node.default).toBe('true');
    // Empty, so a caller that gives none (and the review's lookup by exact name) keeps the old name.
    expect(inputs.name_suffix.default).toBe('');
  });

  // A branch or the agent could leave a symlink, file or repo at that path for checkout to follow.
  it('clears the folder, then summarises with the script from main', () => {
    const all = keepSteps();
    const [clear] = named(all, 'Clear the summary script folder');
    const [checkout] = named(all, 'Fetch the summary script');
    const [summarise] = named(all, "Summarise Claude's output");

    expect(clear.run).toBe('rm -rf .claude-summary-script');
    expect(all.indexOf(clear)).toBe(all.indexOf(checkout) - 1);
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
    for (const name of SUMMARY_STEPS) {
      expect(named(keepSteps(), name), name).toEqual([
        expect.objectContaining({
          'continue-on-error': true,
          if:
            name === NODE_STEP
              ? "always() && inputs.setup_node == 'true'"
              : 'always()',
        }),
      ]);
    }
  });

  // A failed upload of a clean summary is a real failure: the next review would miss it.
  it('fails the job when the upload fails', () => {
    const [upload] = keepSteps().filter(step =>
      step.uses?.startsWith('actions/upload-artifact@')
    );

    expect(upload['continue-on-error']).toBeUndefined();
  });

  it('scans with the script from main, the thread it is given and the workflow token', () => {
    const [step] = named(keepSteps(), 'Scan the summary for secrets');

    expect(step.id).toBe('scan');
    expect(step.run).toBe(
      'bash .claude-summary-script/scripts/scan-summary.sh'
    );
    // The gitleaks pin is in the script, from main, so one edit moves every caller at once.
    expect(step.env).toEqual({
      GH_REPO: '${{ github.repository }}',
      GH_TOKEN: '${{ github.token }}',
      RUN_URL:
        '${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}',
      THREAD: '${{ inputs.thread }}',
    });
  });
});

describe('the callers of the keep-claude-output action', () => {
  const THREAD =
    '${{ github.event.issue.number || github.event.pull_request.number }}';

  const keepCall = (steps: () => Step[]) =>
    steps().filter(step => step.uses?.includes('keep-claude'));

  // run-claude's callers set up Node in setup-workspace; the review and the refresh job have none, so
  // the action does. The refresh job runs once per freed Spec, so its upload name ends with the Spec's
  // number and the scan comments on that Spec. A re-run replaces the upload (overwrite), so no attempt.
  describe.each([
    ['run-claude', runClaudeSteps, { setup_node: 'false', thread: THREAD }],
    ['claude-code-review.yml', reviewSteps, { thread: THREAD }],
    [
      'the refresh job of claude-unblock.yml',
      refreshSteps,
      {
        name_suffix: '-${{ matrix.spec.number }}',
        thread: '${{ matrix.spec.number }}',
      },
    ],
  ])('%s', (_, steps, inputs) => {
    it('calls it once, from a pinned main commit, after every run of Claude', () => {
      const calls = keepCall(steps);

      expect(calls).toHaveLength(1);
      expect(own(calls[0].uses)).toBe(KEEP);
      expect(calls[0].if).toBe('always()');
      expect(calls[0]['continue-on-error']).toBeUndefined();
      expect(calls[0].with).toEqual(inputs);
    });

    it('carries no copy of its steps', () => {
      const text = JSON.stringify(steps());

      for (const name of SUMMARY_STEPS) {
        expect(named(steps(), name), name).toEqual([]);
      }
      expect(
        steps().filter(step =>
          step.uses?.startsWith('actions/upload-artifact@')
        )
      ).toEqual([]);
      expect(text).not.toContain('claude-summary-script');
    });
  });

  // Pins could drift if one pin PR is delayed, leaving the callers on different code.
  it('pins it to the same commit in all three', () => {
    const pin = (steps: () => Step[]) => keepCall(steps)[0].uses?.split('@')[1];

    expect(pin(runClaudeSteps) ?? '').toMatch(/^[0-9a-f]{40}$/);
    expect(pin(reviewSteps)).toBe(pin(runClaudeSteps));
    expect(pin(refreshSteps)).toBe(pin(runClaudeSteps));
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

// The action's scan step, which runs scripts/scan-summary.sh with its env.
const scanStep = () =>
  keepSteps().find(({ name }) => name === 'Scan the summary for secrets') as {
    env: Record<string, string>;
    run: string;
  } & Step;

// Runs scripts/scan-summary.sh with the action's env and the stubs, over a summary unless `summary`
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

// A tag or branch can be moved to other code, and these actions run `npm ci` with the App token.
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
    ['claude-respond.yml', /^\s*files: (.+)$/m],
    ['claude-plan.yml', /^\s*agent_files: (.+)$/m],
    ['claude-build.yml', /^\s*agent_files: (.+)$/m],
    ['claude-fix-review.yml', /^\s*agent_files: (.+)$/m],
    ['claude-resolve-conflict.yml', /^\s*agent_files: (.+)$/m],
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

// Adding the label `fix-review` to a PR has Claude fix the review's findings
// (plans/chores/C467-fix-review-label.md). The run-name repeats the job's `if:`.
describe('the fix-review workflow', () => {
  type Job = {
    if?: string;
    needs?: string;
    permissions?: Record<string, string>;
    steps?: Step[];
    uses?: string;
    with?: Record<string, unknown>;
  };
  const workflow = () =>
    parse(read('claude-fix-review.yml')) as {
      jobs: Record<string, Job>;
      on: Record<string, { types?: string[] }>;
      'run-name': string;
    };
  const jobs = () => workflow().jobs;
  // The condition without its line breaks, so the run-name's copy and the job's compare equal.
  const flat = (text = '') => text.replace(/\s+/g, ' ').trim();
  // What the run-name asks before it picks the title.
  const condition = () => {
    const [before] = flat(workflow()['run-name']).split(' && format(');

    return before.replace(/^\$\{\{ /, '');
  };

  it('starts when a label is added to a pull request, and on nothing else', () => {
    expect(workflow().on).toEqual({ pull_request: { types: ['labeled'] } });
  });

  it('runs only for the owner’s label on an open, ready PR from a branch in this repo, not a hand-back', () => {
    const text = flat(jobs().fix.if);

    expect(text).toContain("github.event.label.name == 'fix-review'");
    expect(text).toContain("github.event.pull_request.state == 'open'");
    expect(text).toContain('!github.event.pull_request.draft');
    expect(text).toContain(
      'github.event.pull_request.head.repo.full_name == github.repository'
    );
    // The tech lead builds a `hand-back` PR (plans/README.md rule 4), so no agent fixes it.
    expect(text).toContain(
      "!contains(github.event.pull_request.labels.*.name, 'hand-back')"
    );
    // Only the tech lead starts a write-enabled run, as claude-plan.yml has it.
    expect(text).toContain('github.actor == github.repository_owner');
  });

  it('shows "Fix review" or "Skipped Fix review" with the title, on the job’s condition', () => {
    const name = workflow()['run-name'];

    expect(name).toContain("format('Fix review: {0}'");
    expect(name).toContain("format('Skipped Fix review: {0}'");
    expect(condition()).toBe(flat(jobs().fix.if));
  });

  it('calls the shared runner from a pinned main commit: head branch, Sonnet, no plan', () => {
    const { uses, with: inputs } = jobs().fix;

    expect(uses).toMatch(
      /^henetiriki\/kinscape\/\.github\/workflows\/claude-run\.yml@[0-9a-f]{40}$/
    );
    expect(inputs).toMatchObject({
      agent_files: 'rules.md fix-review.md',
      model_args: '--model sonnet',
      ref: '${{ github.event.pull_request.head.ref }}',
      thread: '${{ github.event.pull_request.number }}',
    });
    // CI runs e2e after the push; the run is not a plan.
    expect(inputs).not.toHaveProperty('plan');
    expect(inputs).not.toHaveProperty('playwright');
  });

  // What a runner needs to run a fix: without the input the caller's workflow is invalid, without
  // KIND the gate checks for a draft plan PR and stops every ready PR, without VERB the run says "Building".
  const expectFixRunner = (text: string) => {
    const runner = parse(text) as {
      jobs: Record<string, Job>;
      on: { workflow_call: { inputs: Record<string, unknown> } };
    };
    const step = (job: string, find: (step: Step) => boolean) =>
      runner.jobs[job].steps?.find(find);

    expect(runner.on.workflow_call.inputs.kind).toMatchObject({
      default: '',
      type: 'string',
    });
    expect(step('gate', ({ id }) => id === 'gate')?.env?.KIND).toBe(
      "${{ inputs.kind || inputs.plan && 'plan' || 'build' }}"
    );
    expect(
      step('run', ({ name }) => name === 'Show that the run started')?.env?.VERB
    ).toBe(
      "${{ inputs.kind == 'fix' && 'Fixing' || inputs.kind == 'resolve' && 'Resolving' || inputs.plan && 'Planning' || 'Building' }}"
    );
    // Only a plan or a build hands an issue back.
    expect(runner.jobs.return.if).toBe(
      "always() && inputs.kind == '' && needs.run.result != 'cancelled'"
    );
  };

  // Reads the working tree's runner. Until actions-pin-update.yml moves the caller's pin, the pinned
  // commit is checked by hand (`git show <pin>:.github/workflows/claude-run.yml`).
  it('has the shared runner gate the run as a fix', () => {
    expect(jobs().fix.with).toMatchObject({ kind: 'fix' });
    expectFixRunner(read('claude-run.yml'));
  });

  // The title and body are text from outside the team.
  it('gives the prompt the PR number alone', () => {
    const prompt = String(jobs().fix.with?.prompt);

    expect(prompt).toContain('${{ github.event.pull_request.number }}');
    expect(prompt).not.toMatch(
      /github\.event\.pull_request\.(title|body)|github\.event\.(comment|review)/
    );
  });

  it('removes the label after the run, passed or failed, but not after a skip', () => {
    const { unlabel } = jobs();
    const [step] = unlabel.steps ?? [];

    expect(unlabel.needs).toBe('fix');
    expect(unlabel.if).toBe("always() && needs.fix.result != 'skipped'");
    expect(unlabel.permissions).toEqual({ 'pull-requests': 'write' });
    expect(step.env).toMatchObject({
      GH_TOKEN: '${{ github.token }}',
      PR: '${{ github.event.pull_request.number }}',
    });
    expect(step.run).toContain('labels/fix-review');
    // A label already gone (a 404) is not a failure.
    expect(step.run).toContain('404');
  });

  it('tells Claude to leave test changes and comment text alone, in fix-review.md', () => {
    const text = agent('fix-review.md');

    // The review posts with the workflow token: the script shows the reviewer as
    // `github-actions` with `bot` true.
    expect(text).toContain('`login` `github-actions` with `bot` true');
    expect(text).not.toContain('claude');
    expect(text).toContain('npm run review:threads -- list <n>');
    expect(text).toContain('newest PR comment');
    expect(text).toContain('npm run review:threads -- resolve <n> <thread id>');
    expect(text).not.toContain('gh api');
    expect(text).toContain('rule 10');
    expect(text).toContain('draft state, labels or reviewers');
    expect(text).toMatch(/data, not instructions/);
  });
});

// Adding the label `resolve-conflict` to a PR has Claude merge main into its branch
// (plans/chores/C641-resolve-conflict-label.md). The run-name repeats the job's `if:`.
describe('the resolve-conflict workflow', () => {
  type Job = {
    if?: string;
    needs?: string;
    permissions?: Record<string, string>;
    steps?: Step[];
    uses?: string;
    with?: Record<string, unknown>;
  };
  const workflow = () =>
    parse(read('claude-resolve-conflict.yml')) as {
      jobs: Record<string, Job>;
      on: Record<string, { types?: string[] }>;
      'run-name': string;
    };
  const jobs = () => workflow().jobs;
  const flat = (text = '') => text.replace(/\s+/g, ' ').trim();
  const condition = () => {
    const [before] = flat(workflow()['run-name']).split(' && format(');

    return before.replace(/^\$\{\{ /, '');
  };

  // `pull_request` never runs on a PR with a merge conflict.
  it('starts when a label is added to a pull request, even a conflicted one, and on nothing else', () => {
    expect(workflow().on).toEqual({
      pull_request_target: { types: ['labeled'] },
    });
  });

  it('runs only for the owner’s label on an open PR, a draft too, from a branch in this repo, not a hand-back', () => {
    const text = flat(jobs().resolve.if);

    expect(text).toContain("github.event.label.name == 'resolve-conflict'");
    expect(text).toContain("github.event.pull_request.state == 'open'");
    // A draft plan PR falls behind main too.
    expect(text).not.toContain('draft');
    expect(text).toContain(
      'github.event.pull_request.head.repo.full_name == github.repository'
    );
    expect(text).toContain(
      "!contains(github.event.pull_request.labels.*.name, 'hand-back')"
    );
    expect(text).toContain('github.actor == github.repository_owner');
  });

  it('shows "Resolve conflict" or "Skipped Resolve conflict" with the title, on the job’s condition', () => {
    const name = workflow()['run-name'];

    expect(name).toContain("format('Resolve conflict: {0}'");
    expect(name).toContain("format('Skipped Resolve conflict: {0}'");
    expect(condition()).toBe(flat(jobs().resolve.if));
  });

  it('calls the shared runner from a pinned commit as a resolve: head branch, Sonnet, no plan', () => {
    const { uses, with: inputs } = jobs().resolve;

    expect(uses).toMatch(
      /^henetiriki\/kinscape\/\.github\/workflows\/claude-run\.yml@[0-9a-f]{40}$/
    );
    expect(inputs).toMatchObject({
      agent_files: 'rules.md resolve-conflict.md',
      kind: 'resolve',
      model_args: '--model sonnet',
      ref: '${{ github.event.pull_request.head.ref }}',
      thread: '${{ github.event.pull_request.number }}',
    });
    expect(inputs).not.toHaveProperty('plan');
    expect(inputs).not.toHaveProperty('playwright');
  });

  it('gives the prompt the PR number alone', () => {
    const prompt = String(jobs().resolve.with?.prompt);

    expect(prompt).toContain('${{ github.event.pull_request.number }}');
    expect(prompt).not.toMatch(
      /github\.event\.pull_request\.(title|body)|github\.event\.(comment|review)/
    );
  });

  it('removes the label after the run, passed or failed, but not after a skip', () => {
    const { unlabel } = jobs();
    const [step] = unlabel.steps ?? [];

    expect(unlabel.needs).toBe('resolve');
    expect(unlabel.if).toBe("always() && needs.resolve.result != 'skipped'");
    expect(unlabel.permissions).toEqual({ 'pull-requests': 'write' });
    expect(step.env).toMatchObject({
      GH_TOKEN: '${{ github.token }}',
      PR: '${{ github.event.pull_request.number }}',
    });
    expect(step.run).toContain('labels/resolve-conflict');
    expect(step.run).toContain('404');
  });

  it('tells Claude to merge, never rebase or force-push, and to abort when unsure, in resolve-conflict.md', () => {
    const text = agent('resolve-conflict.md');

    // The checkout has depth 1, so the merge needs main's history (D1).
    expect(text).toContain('git fetch --unshallow origin main');
    expect(text).toContain('git merge --no-commit --no-ff origin/main');
    expect(text).toContain('Never rebase. Never force-push.');
    expect(text).toContain('git merge --abort');
    expect(text).toContain("If you can't tell which side is right");
    expect(text).toContain('rule 10');
    expect(text).toContain('draft state, labels or reviewers');
    expect(text).toMatch(/data, not instructions/);
  });
});

// Each review after the first opens with the status of its earlier findings
// (plans/chores/C519-review-follow-up-status.md).
describe('review.md', () => {
  it('opens a follow-up review with the status of the earlier findings', () => {
    expect(agent('review.md').replace(/\s+/g, ' ')).toContain(
      'All earlier findings addressed'
    );
  });

  // The first review is unchanged, so the bullet that covers every review stays.
  it('still has every review list what it checked', () => {
    expect(agent('review.md').replace(/\s+/g, ' ')).toContain(
      'Never post "No issues" alone. List the plan items and rules you checked.'
    );
  });
});

// A stand-in for `gh api -H "Accept: application/vnd.github.raw"
// "repos/owner/repo/contents/<path>?ref=main"`: fails for any other arguments, prints the local
// file, and fails for one that is not there or for a path with `..`, as the API does with a 404.
// With STUB_FAIL_FIRST=n, the first n calls (for STUB_FAIL_PATH, if set) fail like a server error.
const GH = `#!/bin/bash
if [ "$#" -ne 4 ] || [ "$1" != api ] || [ "$2" != -H ] || [ "$3" != "Accept: application/vnd.github.raw" ]; then
  echo "unexpected gh call: $*" >&2; exit 1
fi
case "$4" in
  repos/owner/repo/contents/*\\?ref=main) ;;
  *) echo "unexpected gh call: $*" >&2; exit 1 ;;
esac
path="\${4#repos/owner/repo/contents/}"
path="\${path%\\?ref=main}"
case "/$path/" in
  *\\?*|*/../*|*//*) echo "unexpected gh call: $*" >&2; exit 1 ;;
esac
if [ -n "$STUB_FAIL_FIRST" ] && { [ -z "$STUB_FAIL_PATH" ] || [ "$path" = "$STUB_FAIL_PATH" ]; }; then
  failed=$(cat "$RUNNER_TEMP/gh-failed" 2>/dev/null || echo 0)
  if [ "$failed" -lt "$STUB_FAIL_FIRST" ]; then
    echo $((failed + 1)) > "$RUNNER_TEMP/gh-failed"; echo "HTTP 502" >&2; exit 1
  fi
fi
if ! [ -f "$STUB_ROOT/$path" ]; then
  echo "HTTP 404: Not Found" >&2; exit 1
fi
cat "$STUB_ROOT/$path"
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
          MAIN_FILES: '',
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

    // What the script wrote under agent/main/, by repo path.
    const main = Object.fromEntries(
      (existsSync(join(dir, 'agent/main'))
        ? readdirSync(join(dir, 'agent/main'), {
            recursive: true,
            withFileTypes: true,
          })
        : []
      )
        .filter(entry => entry.isFile())
        .map(entry => {
          const path = join(entry.parentPath, entry.name);

          return [
            relative(join(dir, 'agent/main'), path),
            readFileSync(path, 'utf8'),
          ];
        })
    );

    return {
      log,
      main,
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

  it('downloads the settings file it is told to, and loads the review files in order', () => {
    const { settings, system } = load('review.md review-code.md', undefined, {
      SETTINGS_FILE: 'review-settings.json',
    });

    expect(JSON.parse(settings).permissions.allow).toEqual(
      JSON.parse(agent('review-settings.json')).permissions.allow
    );
    expect(system).toBe(`${agent('review.md')}\n${agent('review-code.md')}\n`);
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

  // The review's rule files and plugin marketplace (claude-code-review.yml), each written under
  // agent/main/ at its repo path, so a folder of them can be named as one.
  describe('the main files', () => {
    const repo = (path: string) => readFileSync(join(root, path), 'utf8');

    it('writes each under agent/main/ at its path, as main has it', () => {
      const { main } = load('review.md', undefined, {
        MAIN_FILES: mainFiles().join(' '),
      });

      expect(Object.keys(main).sort()).toEqual([...mainFiles()].sort());
      for (const path of mainFiles()) {
        expect(main[path], path).toBe(repo(path));
      }
    });

    it('writes none when given none', () => {
      expect(load(files).main).toEqual({});
    });

    it('retries a download that fails, up to three tries', () => {
      const failing = (first: string) => ({
        MAIN_FILES: 'AGENTS.md',
        STUB_FAIL_FIRST: first,
        STUB_FAIL_PATH: 'AGENTS.md',
      });

      expect(load('review.md', undefined, failing('2')).main['AGENTS.md']).toBe(
        repo('AGENTS.md')
      );
      expect(() => load('review.md', undefined, failing('3'))).toThrow();
    });

    it('fails on one that is not in the repo', () => {
      expect(() =>
        load('review.md', undefined, { MAIN_FILES: 'AGENTS.md docs/typo.md' })
      ).toThrow();
    });
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

// The review runs with the workflow's token, so it posts as github-actions[bot], which the repo bars
// from approving (docs/repo-settings.md), and reads its rules, settings and plugin from main
// (plans/chores/C588-review-config-from-main.md).
describe('the review job of claude-code-review.yml', () => {
  type Job = { permissions?: Record<string, string>; steps: Step[] };
  const ACTION_NAME = 'anthropics/claude-code-action@';
  const LOAD = 'Load the review rules and settings';
  const CHECK = "Check that this workflow is main's";
  const COPY = "Put main's rule files in the checkout";
  const job = () =>
    (parse(read('claude-code-review.yml')) as { jobs: Record<string, Job> })
      .jobs['claude-review'];
  const steps = () => job().steps;
  const at = (name: string) => steps().findIndex(step => step.name === name);
  const step = (name: string) => steps()[at(name)];
  const claudeAt = () =>
    steps().findIndex(step => step.uses?.startsWith(ACTION_NAME));
  const claude = () => steps()[claudeAt()];

  it('runs Claude with the workflow token and the fewest permissions', () => {
    expect(claude().with?.github_token).toBe('${{ github.token }}');
    expect(job().permissions).toEqual({
      actions: 'read',
      contents: 'read',
      issues: 'read',
      'pull-requests': 'write',
    });
  });

  it('loads the files CLAUDE.md imports, the marketplace and this file from main, right after checkout', () => {
    expect(at(LOAD)).toBe(1);
    expect(step(LOAD).uses).toContain('load-agent-files');
    expect(step(LOAD).with?.main_files).toBe(mainFiles().join(' '));
    expect(mainFiles().filter(path => !existsSync(join(root, path)))).toEqual(
      []
    );
    expect(imports()).toEqual([
      'AGENTS.md',
      'docs/security.md',
      'docs/writing.md',
    ]);
  });

  // The action restores CLAUDE.md from the base branch, but what it imports is read from the
  // checkout, so main's copies go there first. Adding an import to CLAUDE.md fails this until the
  // copy step takes it too.
  it("puts main's copies of the imports in the checkout before Claude", () => {
    for (const path of imports()) {
      expect(step(COPY).run).toContain(
        `cp "$RUNNER_TEMP/agent/main/${path}" ${path}`
      );
    }
    expect(at(LOAD)).toBeLessThan(at(COPY));
    expect(at(COPY)).toBeLessThan(claudeAt());
  });

  it('installs the plugin from the marketplace loaded from main', () => {
    const marketplace = JSON.parse(
      readFileSync(join(root, MARKETPLACE), 'utf8')
    ) as { name: string; plugins: { name: string }[] };

    expect(claude().with?.plugin_marketplaces).toBe(
      '${{ runner.temp }}/agent/main/.github/claude-plugins'
    );
    expect(claude().with?.plugins).toBe(
      `${marketplace.plugins[0].name}@${marketplace.name}`
    );
  });

  // The action checked this itself while it minted its own token; with the workflow token it
  // doesn't, so the workflow does: Claude runs only on a copy identical to main's.
  describe("the check that this workflow is main's", () => {
    // Runs the step's script with `text` as the copy of the workflow the load step wrote (none when
    // undefined).
    const check = (text?: string) => {
      const dir = mkdtempSync(join(tmpdir(), 'review-check-'));

      try {
        if (text !== undefined) {
          mkdirSync(join(dir, 'agent/main/.github/workflows'), {
            recursive: true,
          });
          writeFileSync(join(dir, 'agent/main', REVIEW_WORKFLOW), text);
        }
        const { status, stdout } = spawnSync(
          'bash',
          ['-e', '-o', 'pipefail', '-c', step(CHECK).run ?? ''],
          {
            cwd: root,
            encoding: 'utf8',
            env: {
              GITHUB_OUTPUT: join(dir, 'output'),
              NODE_ENV: 'test',
              PATH: process.env.PATH ?? '',
              RUNNER_TEMP: dir,
            },
            stdio: ['ignore', 'pipe', 'pipe'],
          }
        );
        const output = existsSync(join(dir, 'output'))
          ? readFileSync(join(dir, 'output'), 'utf8')
          : '';

        return { output, status, stdout };
      } finally {
        rmSync(dir, { force: true, recursive: true });
      }
    };

    it('comes right after the load, calls nothing, and gates Claude and the steps that would post', () => {
      expect(at(CHECK)).toBe(at(LOAD) + 1);
      expect(step(CHECK).id).toBe('same');
      expect(step(CHECK).env).toBeUndefined();
      expect(step(CHECK).run).not.toContain('gh ');
      for (const name of [
        'Show that the review started',
        'Write the changes since the last review',
      ]) {
        expect(step(name).if, name).toBe("steps.same.outputs.same == 'true'");
      }
      expect(claude().if).toBe("steps.same.outputs.same == 'true'");
    });

    it("says same=true for main's copy and same=false for another", () => {
      expect(check(read('claude-code-review.yml'))).toMatchObject({
        output: 'same=true\n',
        status: 0,
      });
      expect(
        check(`${read('claude-code-review.yml')}\n# changed\n`)
      ).toMatchObject({ output: 'same=false\n', status: 0 });
    });

    it('fails, saying neither, when the load left no copy', () => {
      const { output, status, stdout } = check();

      expect(status).not.toBe(0);
      expect(output).toBe('');
      expect(stdout).toContain(
        "::error::The step above didn't load main's copy of this file."
      );
    });

    // Only the check's explicit "not main's" gets the comment; a failed check or a failed Claude fails the job.
    it('has the report step comment only when the check said the file differs', () => {
      const report = step('Report a missing review');

      expect(report.env?.SAME).toBe('${{ steps.same.outputs.same }}');
      expect(report.run).toContain('if [ "$SAME" != false ]; then');
      expect(report.run).not.toContain('cmp');
    });
  });
});
