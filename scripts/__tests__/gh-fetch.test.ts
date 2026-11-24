import { describe, expect, it } from 'vitest';

import { ghFetch, localGh, repoOf } from '@ks/scripts/gh-fetch.mts';

type Call = { init: RequestInit | undefined; url: string };

const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value), init);

// A fake fetch that answers each call with the next reply.
const fake = (...replies: Response[]) => {
  const calls: Call[] = [];
  const fetchFake = (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ init, url: String(url) });

    return Promise.resolve(replies.shift() as Response);
  };

  return {
    calls,
    deps: { fetch: fetchFake as typeof fetch, repo: 'o/r', token: 'sekret' },
  };
};

describe('ghFetch', () => {
  it('posts a GraphQL query, with -F as a number and -f as a string', async () => {
    const { calls, deps } = fake(json({ data: { a: 1 } }));
    const text = await ghFetch(
      ['api', 'graphql', '-f', 'query=query { a }', '-F', 'n=7', '-f', 'id=9'],
      undefined,
      deps
    );

    expect(JSON.parse(text)).toEqual({ data: { a: 1 } });
    expect(calls[0].url).toBe('https://api.github.com/graphql');
    expect(calls[0].init?.method).toBe('POST');
    expect(JSON.parse(calls[0].init?.body as string)).toEqual({
      query: 'query { a }',
      variables: { id: '9', n: 7 },
    });
    expect(calls[0].init?.headers).toMatchObject({
      Authorization: 'Bearer sekret',
    });
  });

  it('throws the GraphQL error messages', async () => {
    const { deps } = fake(
      json({ errors: [{ message: 'A' }, { message: 'B' }] })
    );

    await expect(
      ghFetch(['api', 'graphql', '-f', 'query=q'], undefined, deps)
    ).rejects.toThrow('gh: A; B (HTTP 200)');
  });

  it('gets a path with the repo filled in', async () => {
    const { calls, deps } = fake(json({ number: 3 }));
    const text = await ghFetch(
      ['api', 'repos/{owner}/{repo}/issues/3/parent'],
      undefined,
      deps
    );

    expect(JSON.parse(text)).toEqual({ number: 3 });
    expect(calls[0].url).toBe(
      'https://api.github.com/repos/o/r/issues/3/parent'
    );
  });

  it('follows each next page and prints one JSON value per line', async () => {
    const { calls, deps } = fake(
      json([{ n: 1 }], {
        headers: {
          Link: '<https://api.github.com/x?page=2>; rel="next", <https://api.github.com/x?page=9>; rel="last"',
        },
      }),
      json([{ n: 2 }, { n: 3 }])
    );
    const text = await ghFetch(
      ['api', '--paginate', 'repos/o/r/x', '--jq', '.[] | @json'],
      undefined,
      deps
    );

    expect(text.split('\n')).toEqual(['{"n":1}', '{"n":2}', '{"n":3}']);
    expect(calls.map(call => call.url)).toEqual([
      'https://api.github.com/repos/o/r/x',
      'https://api.github.com/x?page=2',
    ]);
  });

  it('prints an empty list as no text', async () => {
    const { deps } = fake(json([]));

    await expect(
      ghFetch(
        ['api', '--paginate', 'repos/o/r/x', '--jq', '.[] | @json'],
        undefined,
        deps
      )
    ).resolves.toBe('');
  });

  it('maps an issue to the gh issue view fields', async () => {
    const { calls, deps } = fake(
      json({
        body: 'b',
        html_url: 'https://github.com/o/r/issues/5',
        number: 5,
        title: 't',
        type: { name: 'Chore' },
      }),
      json({ body: '', html_url: 'u', number: 6, title: 't', type: null })
    );
    const first = await ghFetch(
      ['issue', 'view', '5', '--json', 'body,issueType,number,title,url'],
      undefined,
      deps
    );
    const second = await ghFetch(
      ['issue', 'view', '6', '--json', 'issueType'],
      undefined,
      deps
    );

    expect(JSON.parse(first)).toEqual({
      body: 'b',
      issueType: { name: 'Chore' },
      number: 5,
      title: 't',
      url: 'https://github.com/o/r/issues/5',
    });
    expect(JSON.parse(second)).toEqual({ issueType: null });
    expect(calls[0].url).toBe('https://api.github.com/repos/o/r/issues/5');
  });

  it('throws a 404 in the shape that plan-new reads, with the API message', async () => {
    const { deps } = fake(json({ message: 'Not Found' }, { status: 404 }));

    await expect(
      ghFetch(['api', 'repos/o/r/issues/1/parent'], undefined, deps)
    ).rejects.toThrow('gh: Not Found (HTTP 404)');
  });

  it('falls back to the status text when the error body is not JSON', async () => {
    const { deps } = fake(
      new Response('<html>', { status: 502, statusText: 'Bad Gateway' })
    );

    await expect(
      ghFetch(['api', 'repos/o/r/x'], undefined, deps)
    ).rejects.toThrow('gh: Bad Gateway (HTTP 502)');
  });

  it('never puts the token in an error', async () => {
    const { deps } = fake(
      json({ message: 'Bad credentials' }, { status: 401 })
    );
    const error = await ghFetch(['api', 'repos/o/r/x'], undefined, deps).catch(
      (caught: Error) => caught
    );

    expect(String(error)).not.toContain('sekret');
  });

  it.each([
    [['pr', 'checks', '1']],
    [['api', '--paginate', 'repos/o/r/x']],
    [['api', 'repos/o/r/x', '--jq', '.foo']],
    [['api', 'graphql', '-x', 'a=b']],
    [['api', 'graphql', '-f']],
    [['issue', 'view', '1']],
  ])('rejects the call %j', async args => {
    const { deps } = fake();

    await expect(ghFetch(args, undefined, deps)).rejects.toThrow(
      'gh: this call is not supported'
    );
  });
});

describe('repoOf', () => {
  it.each([
    ['https://github.com/o/r.git', 'o/r'],
    ['https://github.com/o/r', 'o/r'],
    ['git@github.com:o/r.git', 'o/r'],
    ['git@github.com:my-org/re.po', 'my-org/re.po'],
  ])('reads %s', (url, repo) => {
    expect(repoOf(url)).toBe(repo);
  });

  it('returns undefined for another host', () => {
    expect(repoOf('https://example.com/o/r')).toBeUndefined();
  });
});

describe('localGh', () => {
  const git = () => 'https://github.com/o/r.git\n';

  it('names GH_TOKEN when it is empty or missing', () => {
    expect(localGh({}, git, () => '')).toContain('GH_TOKEN');
    expect(localGh({ GH_TOKEN: '' }, git, () => '')).toContain('GH_TOKEN');
  });

  it('says so when the origin remote is not on GitHub', () => {
    expect(
      localGh(
        { GH_TOKEN: 't' },
        () => 'https://example.com/o/r',
        () => ''
      )
    ).toContain('origin');
  });

  it('returns the repo and a gh that runs the fetch child', () => {
    const calls: unknown[][] = [];
    const local = localGh({ GH_TOKEN: 't', PATH: 'p' }, git, (...call) => {
      calls.push(call);

      return 'out';
    });

    if (typeof local === 'string') {
      throw new Error(local);
    }

    expect(local.repo).toBe('o/r');
    expect(local.gh(['api', 'x'], 'in')).toBe('out');
    expect(calls).toHaveLength(1);

    const [command, args, input, env] = calls[0] as [
      string,
      string[],
      string,
      Record<string, string>,
    ];

    expect(command).toBe('node');
    expect(args[0]).toMatch(/gh-fetch\.mts$/);
    expect(args.slice(1)).toEqual(['api', 'x']);
    expect(input).toBe('in');
    expect(env).toMatchObject({ GH_REPO: 'o/r', GH_TOKEN: 't', PATH: 'p' });
  });
});
