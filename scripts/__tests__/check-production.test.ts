import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { run } from '@ks/scripts/check-production.mts';

const answer = (status: number, location?: string) =>
  new Response(null, {
    headers: location === undefined ? {} : { location },
    status,
  });

/** A deployment that answers each path as given. */
const deployment = (answers: Record<string, Response>) =>
  vi.fn<(url: string, init: RequestInit) => Promise<Response>>(
    async url => answers[new URL(url).pathname] as Response
  );

const GOOD = () => ({
  '/': answer(307, '/sign-in?returnTo=%2F'),
  '/design-kit': answer(404),
});

let log: ReturnType<typeof vi.spyOn>;
let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  log = vi.spyOn(console, 'log').mockImplementation(() => {});
  error = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// NFR-03
describe('check-production', () => {
  it('passes a deployment that hides the kit and gates the map', async () => {
    const fetch = deployment(GOOD());

    expect(await run(['https://example.test'], {}, fetch)).toBe(0);
    expect(fetch).toHaveBeenCalledWith('https://example.test/design-kit', {
      headers: {},
      redirect: 'manual',
    });
    expect(log).toHaveBeenCalledTimes(2);
  });

  it('accepts an absolute sign-in location', async () => {
    const fetch = deployment({
      ...GOOD(),
      '/': answer(308, 'https://example.test/sign-in'),
    });

    expect(await run(['https://example.test'], {}, fetch)).toBe(0);
  });

  it.each([
    ['/design-kit', answer(200)],
    ['/', answer(200)],
    ['/', answer(307, '/elsewhere')],
    ['/', answer(307)],
  ])('fails when %s answers wrongly', async (path, response) => {
    const fetch = deployment({ ...GOOD(), [path]: response });

    expect(await run(['https://example.test'], {}, fetch)).toBe(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining(`FAIL ${path}`));
  });

  it('sends the bypass secret as a header and never prints it', async () => {
    const fetch = deployment(GOOD());

    await run(
      ['https://example.test'],
      { VERCEL_AUTOMATION_BYPASS_SECRET: 's3cret' },
      fetch
    );

    expect(fetch.mock.calls[0]?.[1]).toEqual({
      headers: { 'x-vercel-protection-bypass': 's3cret' },
      redirect: 'manual',
    });
    expect(JSON.stringify([log.mock.calls, error.mock.calls])).not.toContain(
      's3cret'
    );
  });

  it.each([[[]], [['not a url']]])('needs a base URL: %j', async args => {
    const fetch = deployment(GOOD());

    expect(await run(args, {}, fetch)).toBe(2);
    expect(fetch).not.toHaveBeenCalled();
  });
});
