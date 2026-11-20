import { expect, it } from 'vitest';

import { retryQuery } from '@ks/app/query-retry';

// NFR-01. A failed query repeats, but not when a repeat gives the same answer.
const withStatus = (status: number) =>
  Object.assign(new Error(`failed: ${status}`), { status });

it.each([
  ['a 401', withStatus(401), 0, false],
  ['a 404', withStatus(404), 0, false],
  ['a 403', withStatus(403), 0, true],
  ['a 500', withStatus(500), 0, true],
  ['a 503 on the last retry', withStatus(503), 2, true],
  ['a 503 after three retries', withStatus(503), 3, false],
  ['a dropped connection', new TypeError('Failed to fetch'), 0, true],
  ['a dropped connection after three retries', new TypeError('x'), 3, false],
])('retryQuery gives the right answer for %s', (_name, error, count, retry) => {
  expect(retryQuery(count, error)).toBe(retry);
});
