import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Gh } from '../types.ts';

import {
  ISSUE_TITLE,
  issueBody,
  readPin,
  run,
} from '../claude-plugin-pin-check.mts';

const PIN = 'a'.repeat(40);
const NEWER = 'b'.repeat(40);
const NEWEST = 'c'.repeat(40);

const commit = (
  sha: string,
  message = 'A change',
  date = '2026-04-01T09:00:00Z'
) => ({
  date,
  message,
  sha,
});

const marketplace = (plugins: unknown[]) => JSON.stringify({ plugins });

const entry = (name: string, url = 'anthropics/claude-code') => ({
  name,
  source: {
    path: 'plugins/code-review',
    sha: PIN,
    source: 'git-subdir',
    url,
  },
});

describe('readPin', () => {
  it('reads the pin from the real marketplace.json', () => {
    const pin = readPin(process.cwd());

    expect(pin).toEqual({
      path: 'plugins/code-review',
      repo: 'anthropics/claude-code',
      sha: expect.stringMatching(/^[0-9a-f]{40}$/),
    });
  });
});

describe('run and readPin on a fixture', () => {
  let root: string;
  let gh: ReturnType<typeof vi.fn<Gh>>;

  const writeMarketplace = (plugins: unknown[]) => {
    mkdirSync(join(root, '.github/claude-plugins/.claude-plugin'), {
      recursive: true,
    });
    writeFileSync(
      join(root, '.github/claude-plugins/.claude-plugin/marketplace.json'),
      marketplace(plugins)
    );
  };

  const fakeGh = (
    commits: unknown[],
    open: { number: number; title: string }[] = []
  ) => {
    gh = vi.fn<Gh>(args => {
      if (args[0] === 'api') {
        return JSON.stringify(commits);
      }

      return args[1] === 'list' ? JSON.stringify(open) : '';
    });
  };

  const created = () => gh.mock.calls.find(([args]) => args[1] === 'create');

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'plugin-pin-'));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    writeMarketplace([entry('other'), entry('code-review')]);
  });

  afterEach(() => {
    rmSync(root, { force: true, recursive: true });
    vi.restoreAllMocks();
  });

  it.each([
    'anthropics/claude-code',
    'https://github.com/anthropics/claude-code.git',
  ])('reads owner/repo from the url %s', url => {
    writeMarketplace([entry('code-review', url)]);

    expect(readPin(root).repo).toBe('anthropics/claude-code');
  });

  it('throws when the marketplace has no code-review plugin', () => {
    writeMarketplace([entry('other')]);

    expect(() => readPin(root)).toThrow('has no code-review plugin');
  });

  it('asks for the newest commits on the plugin path', () => {
    fakeGh([commit(PIN)]);
    run(root, gh);

    expect(gh.mock.calls[0][0].slice(0, 2)).toEqual([
      'api',
      'repos/anthropics/claude-code/commits?path=plugins/code-review&per_page=100',
    ]);
  });

  it('does nothing when the pin is the newest commit', () => {
    fakeGh([commit(PIN), commit(NEWER)]);
    run(root, gh);

    expect(gh).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Up to date')
    );
  });

  it('throws when upstream returns no commits', () => {
    fakeGh([]);

    expect(() => run(root, gh)).toThrow('No commits found');
  });

  it('does not open a second issue', () => {
    fakeGh(
      [commit(NEWEST), commit(PIN)],
      [
        { number: 3, title: 'Something else' },
        { number: 7, title: ISSUE_TITLE },
      ]
    );
    run(root, gh);

    expect(created()).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith('Issue #7 is already open.');
  });

  it('opens one labelled issue when upstream has moved', () => {
    fakeGh(
      [commit(NEWEST, 'Newest'), commit(NEWER, 'Newer'), commit(PIN, 'Old')],
      [{ number: 3, title: 'Something else' }]
    );
    run(root, gh);

    const [args] = created() ?? [[]];

    expect(args.slice(0, 6)).toEqual([
      'issue',
      'create',
      '--title',
      ISSUE_TITLE,
      '--label',
      'dependencies',
    ]);
    expect(args[7]).toContain('`Newest`');
    expect(args[7]).toContain('`Newer`');
    expect(args[7]).not.toContain('`Old`');
  });
});

describe('issueBody', () => {
  const pin = {
    path: 'plugins/code-review',
    repo: 'anthropics/claude-code',
    sha: PIN,
  };

  it('lists the newer commits, the compare link and the bump steps', () => {
    const body = issueBody(pin, [
      commit(NEWEST, 'Newest', '2026-05-02T10:00:00Z'),
      commit(NEWER, 'Newer'),
      commit(PIN, 'Old'),
    ]);

    expect(body).toContain(
      `- [\`ccccccc\`](https://github.com/anthropics/claude-code/commit/${NEWEST}) 2026-05-02 \`Newest\``
    );
    expect(body).toContain('`Newer`');
    expect(body).not.toContain('`Old`');
    expect(body).not.toContain('cut short');
    expect(body).toContain(
      `https://github.com/anthropics/claude-code/compare/${PIN}...${NEWEST}`
    );
    expect(body).toContain('Edit `sha` in `.github/claude-plugins');
    expect(body).toContain("next `claude-review` run's log");
  });

  it('says so when the pin is not among the commits fetched', () => {
    const body = issueBody(pin, [commit(NEWEST), commit(NEWER)]);

    expect(body).toContain('`ccccccc`');
    expect(body).toContain('`bbbbbbb`');
    expect(body).toContain('not among the newest 2 commits');
  });

  it('removes backticks from a commit title', () => {
    const body = issueBody(pin, [
      commit(NEWEST, 'Fix `@someone` `` x'),
      commit(PIN),
    ]);

    expect(body).toContain('`Fix @someone  x`');
  });
});
