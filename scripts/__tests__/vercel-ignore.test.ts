import { afterEach, describe, expect, it, vi } from 'vitest';

import { invisible, run } from '../vercel-ignore.mts';

const TOKEN = 'github_pat_synthetic_not_a_real_token';

const env = (ref: string, extra: Record<string, string> = {}) => ({
  KINSCAPE_GIT_READ_TOKEN: TOKEN,
  VERCEL_GIT_COMMIT_REF: ref,
  VERCEL_GIT_COMMIT_SHA: 'abc123',
  ...extra,
});

type Body = { files?: unknown } | null;

const answer = (body: Body, init: { ok?: boolean; status?: number } = {}) =>
  vi.fn().mockResolvedValue({
    json: () => Promise.resolve(body),
    ok: init.ok ?? true,
    status: init.status ?? 200,
  });

const changed = (...filenames: string[]) => ({
  files: filenames.map(filename => ({ filename })),
});

const logged = () =>
  vi
    .mocked(console.log)
    .mock.calls.map(call => call.join(' '))
    .join('\n');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('invisible', () => {
  it.each([
    'docs/building.md',
    'docs/img/a.png',
    'plans/chores/C291-vercel-ignore.md',
    'README.md',
    'AGENTS.md',
    'design/DESIGN.md',
    'design/map.jpg',
    'design/source/map.html',
    '.github/CODEOWNERS',
    '.github/workflows/ci.yml',
    '.claude/settings.json',
    '.husky/pre-commit',
    '.idea/workspace.xml',
    'e2e/map.spec.ts',
    'app/__tests__/page.test.tsx',
    'lib/map/__tests__/style.test.ts',
    'vitest.config.mts',
    'vitest.setup.ts',
    'playwright.config.ts',
    'codecov.yml',
    'scripts/vercel-ignore.mts',
  ])('%s is invisible', path => {
    expect(invisible(path)).toBe(true);
  });

  it.each([
    'app/page.tsx',
    'app/notes.md',
    'lib/docs/index.ts',
    'lib/map/style.ts',
    'types/modules.d.ts',
    'package.json',
    'package-lock.json',
    'next.config.ts',
    'tsconfig.json',
    'data/polities.json',
    'public/favicon.svg',
    'design/tokens.json',
    'design/tokens.css',
    'design/other.md',
    'design/sub/map.jpg',
    'design/map.jpg.png',
    'app/__tests__x/page.ts',
    'vitest.config.mts.bak',
    'scriptsx/a.mts',
    'vercel.json',
    'eslint.config.mjs',
  ])('%s is visible', path => {
    expect(invisible(path)).toBe(false);
  });
});

describe('run', () => {
  it('always deploys po-preview, without calling GitHub', async () => {
    const get = answer(changed('docs/a.md'));

    expect(await run(env('po-preview'), get)).toBe(1);
    expect(get).not.toHaveBeenCalled();
  });

  it.each([
    ['no token', { KINSCAPE_GIT_READ_TOKEN: '' }],
    ['no commit', { VERCEL_GIT_COMMIT_SHA: '' }],
    ['no branch', { VERCEL_GIT_COMMIT_REF: '' }],
  ])('deploys with %s, without calling GitHub', async (_name, extra) => {
    const get = answer(changed('docs/a.md'));

    expect(await run({ ...env('feature'), ...extra }, get)).toBe(1);
    expect(get).not.toHaveBeenCalled();
  });

  it('reads the commit on main and the comparison with main elsewhere', async () => {
    const get = answer(changed('docs/a.md'));

    await run(env('main'), get);
    await run(env('chore/C1-x'), get);

    expect(get.mock.calls.map(call => call[0])).toEqual([
      'https://api.github.com/repos/henetiriki/kinscape/commits/abc123',
      'https://api.github.com/repos/henetiriki/kinscape/compare/main...abc123',
    ]);
  });

  it('sends the token only in the Authorization header', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const get = answer(changed('docs/a.md'));

    await run(env('feature'), get);

    expect(get.mock.calls[0][1]).toEqual({
      headers: { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'kinscape' },
    });
    expect(get.mock.calls[0][0]).not.toContain(TOKEN);
  });

  it.each(['main', 'feature'])(
    'skips on %s when nothing is visible',
    async ref => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      expect(
        await run(
          env(ref),
          answer(changed('docs/a.md', 'plans/p.md', 'scripts/s.mts'))
        )
      ).toBe(0);
      expect(log).toHaveBeenCalledWith('Skip: 3 changed paths, none visible');
    }
  );

  it('deploys when any file is visible, and names it', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(
      await run(env('feature'), answer(changed('docs/a.md', 'app/page.tsx')))
    ).toBe(1);
    expect(log).toHaveBeenCalledWith('Deploy: app/page.tsx is visible');
  });

  it('deploys a rename from a visible path to an invisible one', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const files = [
      { filename: 'docs/page.md', previous_filename: 'app/page.tsx' },
    ];

    expect(await run(env('feature'), answer({ files }))).toBe(1);
  });

  it('skips a rename between invisible paths', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const files = [{ filename: 'docs/b.md', previous_filename: 'docs/a.md' }];

    expect(await run(env('feature'), answer({ files }))).toBe(0);
  });

  it('deploys when the list is empty', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(await run(env('feature'), answer({ files: [] }))).toBe(1);
  });

  it('deploys when the list may be truncated, skips just under the cap', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const docs = (count: number) =>
      changed(...Array.from({ length: count }, (_, i) => `docs/${i}.md`));

    expect(await run(env('feature'), answer(docs(300)))).toBe(1);
    expect(await run(env('feature'), answer(docs(299)))).toBe(0);
  });

  it.each([
    [
      'GitHub says no',
      answer(changed('docs/a.md'), { ok: false, status: 404 }),
    ],
    ['the call fails', vi.fn().mockRejectedValue(new Error(`boom ${TOKEN}`))],
    [
      'the body is not JSON',
      vi.fn().mockResolvedValue({
        json: () => Promise.reject(new Error('bad json')),
        ok: true,
        status: 200,
      }),
    ],
    ['the body is null', answer(null)],
    ['there is no list', answer({})],
    ['the list is not an array', answer({ files: 'docs/a.md' })],
    ['an entry is null', answer({ files: [null] })],
    ['an entry has no filename', answer({ files: [{ sha: 'x' }] })],
    ['a filename is not text', answer({ files: [{ filename: 7 }] })],
    [
      'a previous filename is not text',
      answer({ files: [{ filename: 'docs/a.md', previous_filename: 7 }] }),
    ],
  ])('deploys when %s, without printing the token', async (_name, get) => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(await run(env('feature'), get)).toBe(1);
    expect(logged()).toMatch(/^Deploy: /);
    expect(logged()).not.toContain(TOKEN);
  });
});
