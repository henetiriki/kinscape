import { describe, expect, it } from 'vitest';

import { ghList } from '@ks/scripts/gh-list.mts';

describe('ghList', () => {
  it('reads one JSON value per line of a paginated gh api list', () => {
    const calls: string[][] = [];
    const list = ghList<{ n: number }>(args => {
      calls.push(args);

      return '{"n":1}\n\n{"n":2}\n';
    }, 'repos/o/r/pulls/1/files');

    expect(list).toEqual([{ n: 1 }, { n: 2 }]);
    expect(calls).toEqual([
      ['api', '--paginate', 'repos/o/r/pulls/1/files', '--jq', '.[] | @json'],
    ]);
  });

  it('reads an empty list', () => {
    expect(ghList(() => '', 'repos/o/r/x')).toEqual([]);
  });
});
