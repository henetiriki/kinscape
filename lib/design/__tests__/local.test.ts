import { describe, expect, it } from 'vitest';

import { localProblems, localValues, REASONS } from '@ks/lib/design/local.mts';

const lines = (...rows: string[]) => `.a {\n${rows.join('\n')}\n}\n`;

describe('REASONS', () => {
  it('lists shape, nudge and drawing', () => {
    expect(REASONS).toEqual(['shape', 'nudge', 'drawing']);
  });
});

describe('localValues', () => {
  it.each(REASONS)('reads the reason %s', reason => {
    expect(
      localValues(lines(`  --thumb: 26px; /* local: ${reason} */`))
    ).toEqual([{ line: 2, name: '--thumb', reason, value: '26px' }]);
  });

  it('skips a line with no local comment', () => {
    expect(localValues(lines('  --thumb: 26px;', '  gap: 7px;'))).toEqual([]);
  });

  it('skips a local comment off a custom property', () => {
    expect(localValues(lines('  gap: 7px; /* local: shape */'))).toEqual([]);
  });
});

describe('localProblems', () => {
  it.each(REASONS)('passes the reason %s', reason => {
    expect(
      localProblems(lines(`  --thumb: 26px; /* local: ${reason} */`))
    ).toEqual([]);
  });

  it('fails with no reason, and names the line', () => {
    expect(
      localProblems(lines('  --a: 1px;', '  --b: 2px; /* local: */'))
    ).toEqual([{ line: 3, text: 'The local: comment has no reason' }]);
  });

  it('fails with the reason misc', () => {
    expect(localProblems(lines('  --a: 1px; /* local: misc */'))).toEqual([
      {
        line: 2,
        text: 'The local: reason "misc" is not listed: use shape, nudge or drawing',
      },
    ]);
  });

  it('fails on a line that is not a custom property', () => {
    expect(localProblems(lines('  gap: 7px; /* local: shape */'))).toEqual([
      { line: 2, text: 'The local: comment is not on a custom property' },
    ]);
  });

  it('fails on an own comment', () => {
    expect(localProblems(lines('  gap: 7px; /* own: odd */'))).toEqual([
      {
        line: 2,
        text: 'The own: comment is gone: use var(--token) or a local value',
      },
    ]);
  });

  it('passes a file with no comment', () => {
    expect(localProblems(lines('  gap: 7px;'))).toEqual([]);
  });
});
