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

const root = process.cwd();
const read = (file: string) =>
  readFileSync(join(root, '.github/workflows', file), 'utf8');
const agent = (file: string) =>
  readFileSync(join(root, '.github/agent', file), 'utf8');

// Callers name the action by repo and `@main`: see .github/actions/load-agent-files/action.yml.
const ACTION = 'henetiriki/kinscape/.github/actions/load-agent-files@main';
const CALLERS = ['claude.yml', 'claude-run.yml'];

describe('the load-agent-files action', () => {
  it.each(CALLERS)('is used from main, once, by %s', file => {
    const uses = [
      ...read(file).matchAll(/^\s*(?:-\s+)?uses:\s*(\S*load-agent-files\S*)/gm),
    ].map(match => match[1]);

    expect(uses, `${file} needs one "uses: ${ACTION}" step`).toEqual([ACTION]);
  });

  it.each(CALLERS)('is the only place %s loads the agent files', file => {
    expect(
      read(file),
      `${file} should call the action, not download .github/agent/ itself`
    ).not.toContain('contents/.github/agent');
  });
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

// A stand-in for `gh api -H ... "repos/<repo>/contents/.github/agent/<file>?ref=main"`: prints
// the local file, and fails for one that is not there, as the API does with a 404.
const GH = `#!/bin/bash
path="\${@: -1}"
name="\${path##*/.github/agent/}"
cat "$STUB_ROOT/.github/agent/\${name%%\\?*}"
`;

// The action's script, as the runner sees it: the `run: |` block, without its indent.
const script = () =>
  readFileSync(
    join(root, '.github/actions/load-agent-files/action.yml'),
    'utf8'
  )
    .match(/^ {6}run: \|\n([\s\S]*)$/m)?.[1]
    .replace(/^ {8}/gm, '') ?? '';

// Runs the script with `gh` stubbed and reads what it left behind.
const load = (files: string) => {
  const dir = mkdtempSync(join(tmpdir(), 'load-agent-files-'));

  try {
    mkdirSync(join(dir, 'bin'));
    writeFileSync(join(dir, 'bin/gh'), GH, { mode: 0o755 });
    const log = execFileSync('bash', ['-e', '-o', 'pipefail', '-c', script()], {
      encoding: 'utf8',
      env: {
        AGENT_FILES: files,
        GH_REPO: 'owner/repo',
        GH_TOKEN: 'token',
        GITHUB_STEP_SUMMARY: join(dir, 'summary.md'),
        NODE_ENV: 'test',
        PATH: `${join(dir, 'bin')}:${process.env.PATH}`,
        RUNNER_TEMP: dir,
        STUB_ROOT: root,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const out = (file: string) => readFileSync(join(dir, file), 'utf8');

    return {
      log,
      settings: out('agent/settings.json'),
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

  it('fails on a file that is not in .github/agent/', () => {
    expect(() => load('rules.md typo.md')).toThrow();
  });
});
