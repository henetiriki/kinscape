import { expect, it } from 'vitest';

import type { TreeStore } from '@ks/lib/domain/trees/types.ts';

import { asDay } from '@ks/lib/domain/boundaries/model.mts';
import { parseAccountId, parseTreeId } from '@ks/lib/domain/ids/ids.mts';
import { stepDay } from '@ks/lib/domain/map/map-date.mts';

// `npm run typecheck` fails when a line below stops being an error.
it('rejects the three misuses at typecheck', () => {
  const accountId = parseAccountId('00000000-0000-4000-8000-0000000000a1')!;
  const treeId = parseTreeId('00000000-0000-4000-8000-0000000000b1')!;
  const find = (() => {}) as unknown as TreeStore['findTree'];

  // @ts-expect-error The ids are swapped.
  find({ accountId: treeId, treeId: accountId });
  // @ts-expect-error A number is not a Day.
  stepDay(5, 'day', 1, asDay(10));
  // @ts-expect-error A string is not a TreeId.
  find({ accountId, treeId: '00000000-0000-4000-8000-0000000000b1' });
  expect(true).toBe(true);
});
