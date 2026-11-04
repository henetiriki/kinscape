import { expect, it } from 'vitest';

import { safeReturnTo } from '@ks/lib/domain/auth/return-to.mts';

// NFR-03
it.each(['/', '/map', '/screens/add-pin?part=2', '/map?date=1901-01-01#top'])(
  'keeps the same-site path %s',
  path => {
    expect(safeReturnTo(path)).toBe(path);
  }
);

// NFR-03
it.each([
  ['another site', 'https://example.test/'],
  ['a protocol-relative address', '//example.test/'],
  ['a slash and backslash', '/\\example.test/'],
  ['a backslash path', '\\\\example.test'],
  ['a scheme', 'javascript:alert(1)'],
  ['a relative path', 'map'],
  ['a tab inside the slashes', '/\t/example.test'],
  ['a newline', '/map\n'],
  ['an empty string', ''],
  ['nothing', undefined],
  ['a list', ['/map']],
  ['a number', 3],
])('falls back to the map for %s', (_what, value) => {
  expect(safeReturnTo(value)).toBe('/');
});
