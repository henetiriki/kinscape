import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Gh } from '@ks/scripts/types.ts';

import { run } from '@ks/scripts/agent-own-pr.mts';

const BOT = 'kinscape-agent[bot]';
const ENV = { BOT_LOGIN: BOT, GH_REPO: 'owner/repo' };
const TOKEN = 'ghs_secret_token_value';

describe('run', () => {
  let gh: ReturnType<typeof vi.fn<Gh>>;
  let out: string[];
  let logs: string[];
  let errors: string[];

  // What `gh api ... --jq` prints for the PR: the filter keeps the author and the head repo.
  const fakeGh = (author: string, head: string) => {
    gh = vi.fn<Gh>(() => JSON.stringify({ author, head }));
  };
  const failingGh = (error: Error) => {
    gh = vi.fn<Gh>(() => {
      throw error;
    });
  };
  const result = (
    args: string[] = ['7'],
    env: Record<string, string | undefined> = ENV
  ) => run(args, env, gh, line => out.push(line));

  beforeEach(() => {
    out = [];
    logs = [];
    errors = [];
    vi.spyOn(console, 'log').mockImplementation((message: string) => {
      logs.push(message);
    });
    vi.spyOn(console, 'error').mockImplementation((message: string) => {
      errors.push(message);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('a PR that the bot opened from a branch in this repo', () => {
    it('writes own=true', () => {
      fakeGh(BOT, 'owner/repo');

      expect(result()).toBe(0);
      expect(out).toEqual(['own=true']);
    });

    it('reads the PR with the REST API, with a filter for the author and the head repo', () => {
      fakeGh(BOT, 'owner/repo');
      result();

      expect(gh).toHaveBeenCalledTimes(1);
      expect(gh.mock.calls[0][0].slice(0, 3)).toEqual([
        'api',
        'repos/owner/repo/pulls/7',
        '--jq',
      ]);
      expect(gh.mock.calls[0][0][3]).toContain('.user.login');
      expect(gh.mock.calls[0][0][3]).toContain('.head.repo.full_name');
    });

    it('logs the author, the head repo and the result', () => {
      fakeGh(BOT, 'owner/repo');
      result();

      expect(logs).toEqual([
        `Own PR: #7 is by ${BOT} from owner/repo, so own=true.`,
      ]);
    });
  });

  describe('a PR that is not the bot’s own', () => {
    it.each([
      ['Dependabot', 'dependabot[bot]', 'owner/repo'],
      ['a person with a branch in this repo', 'someone', 'owner/repo'],
      ['the bot, from a fork', BOT, 'someone/repo'],
      ['a fork of this repo by a person', 'someone', 'someone/repo'],
      ['the bot, with a deleted head repo', BOT, ''],
      ['a login without the [bot] suffix', 'kinscape-agent', 'owner/repo'],
      ['a head repo with another name', BOT, 'owner/other'],
    ])('writes own=false for %s', (_what, author, head) => {
      fakeGh(author, head);

      expect(result()).toBe(0);
      expect(out).toEqual(['own=false']);
    });

    it('logs the author, the head repo and the result', () => {
      fakeGh('dependabot[bot]', 'owner/repo');
      result();

      expect(logs).toEqual([
        'Own PR: #7 is by dependabot[bot] from owner/repo, so own=false.',
      ]);
    });

    it('says so when the head repo is gone', () => {
      fakeGh(BOT, '');
      result();

      expect(logs).toEqual([
        `Own PR: #7 is by ${BOT} from no repo, so own=false.`,
      ]);
    });
  });

  describe('a read that does not give a PR', () => {
    it('writes own=false and exits 0 for a thread that is not a PR', () => {
      failingGh(
        Object.assign(new Error('gh: Not Found (HTTP 404)'), { status: 1 })
      );

      expect(result()).toBe(0);
      expect(out).toEqual(['own=false']);
    });

    it('logs the exit status, not the error text, so a token in the error stays out of the log', () => {
      failingGh(
        Object.assign(new Error(`Command failed: token ${TOKEN}`), {
          status: 4,
        })
      );
      result();

      expect(logs).toEqual(['Own PR: the read of #7 failed (exit status 4).']);
      expect([...logs, ...errors, ...out].join('\n')).not.toContain(TOKEN);
    });

    it('logs an unknown status when the error has none', () => {
      failingGh(new Error(`boom ${TOKEN}`));
      result();

      expect(logs).toEqual([
        'Own PR: the read of #7 failed (exit status unknown).',
      ]);
      expect(out).toEqual(['own=false']);
    });

    it.each([['not json with a token ' + TOKEN], ['null'], ['']])(
      'writes own=false, and logs no output, for the output %j',
      output => {
        gh = vi.fn<Gh>(() => output);

        expect(result()).toBe(0);
        expect(out).toEqual(['own=false']);
        expect([...logs, ...errors].join('\n')).not.toContain(TOKEN);
      }
    );
  });

  describe('usage', () => {
    it.each([
      [[], ENV],
      [['0'], ENV],
      [['7x'], ENV],
      [['7'], { BOT_LOGIN: BOT, GH_REPO: 'no-slash' }],
      [['7'], { BOT_LOGIN: BOT }],
      [['7'], { GH_REPO: 'owner/repo' }],
      [['7'], { BOT_LOGIN: '', GH_REPO: 'owner/repo' }],
    ])('rejects %j with env %j and writes no output', (args, env) => {
      fakeGh(BOT, 'owner/repo');

      expect(result(args, env)).toBe(1);
      expect(errors[0]).toMatch(/^Usage/);
      expect(out).toEqual([]);
      expect(gh).not.toHaveBeenCalled();
    });
  });
});
