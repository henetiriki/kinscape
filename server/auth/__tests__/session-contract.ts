import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';

import type { SessionStore } from '@ks/lib/domain/auth/types.ts';

import {
  endSession,
  // Aliased: the hooks lint rule reads a `use…` call in a loop as a React Hook.
  useSession as resume,
  startSession,
} from '@ks/server/auth/sessions.mts';

export const ACCOUNT = '00000000-0000-4000-8000-0000000000a1';
export const OTHER = '00000000-0000-4000-8000-0000000000a2';

const DAY = 86_400_000;
const START = new Date('2030-01-01T00:00:00Z');

type Made = { close: () => Promise<void>; store: SessionStore };

/** The session rules over any store; the factory seeds Accounts `ACCOUNT` and `OTHER`. */
export const runSessionContract = (name: string, make: () => Promise<Made>) => {
  // NFR-03
  describe(`sessions on ${name}`, () => {
    let made: Made | undefined;
    let time = START.getTime();

    const setup = async () => {
      made = await make();
      time = START.getTime();

      return {
        day: (n: number) => {
          time = START.getTime() + n * DAY;
        },
        now: () => new Date(time),
        store: made.store,
      };
    };

    afterEach(async () => {
      await made?.close();
      made = undefined;
    });

    it('stores the token’s SHA-256, not the token', async () => {
      const { now, store } = await setup();
      const token = await startSession(store, now, {
        accountId: ACCOUNT,
        email: 'a@example.test',
      });
      const hash = createHash('sha256').update(token).digest('hex');

      expect(await store.find(token)).toBeUndefined();
      expect(await store.find(hash)).toMatchObject({
        accountId: ACCOUNT,
        email: 'a@example.test',
        tokenHash: hash,
      });
    });

    it('gives each sign-in a new token and its own row', async () => {
      const { now, store } = await setup();
      const who = { accountId: ACCOUNT, email: 'a@example.test' };
      const first = await startSession(store, now, who);
      const second = await startSession(store, now, who);

      expect(first).not.toBe(second);
      expect(await resume(store, now, first)).toEqual(who);
      expect(await resume(store, now, second)).toEqual(who);
    });

    it('accepts a session used within 30 days, and renews it', async () => {
      const { day, now, store } = await setup();
      const token = await startSession(store, now, {
        accountId: ACCOUNT,
        email: 'a@example.test',
      });

      day(29);
      expect(await resume(store, now, token)).toBeDefined();
      day(58);
      expect(await resume(store, now, token)).toBeDefined();
    });

    it('refuses a session last used 31 days ago and deletes its row', async () => {
      const { day, now, store } = await setup();
      const token = await startSession(store, now, {
        accountId: ACCOUNT,
        email: 'a@example.test',
      });

      day(31);
      expect(await resume(store, now, token)).toBeUndefined();
      day(0);
      expect(await resume(store, now, token)).toBeUndefined();
    });

    it('refuses a session created 91 days ago, however often used', async () => {
      const { day, now, store } = await setup();
      const token = await startSession(store, now, {
        accountId: ACCOUNT,
        email: 'a@example.test',
      });

      for (const n of [20, 40, 60, 80]) {
        day(n);
        expect(await resume(store, now, token)).toBeDefined();
      }

      day(91);
      expect(await resume(store, now, token)).toBeUndefined();
    });

    it('does not let renewal pass the 90-day cap', async () => {
      const { day, now, store } = await setup();
      const token = await startSession(store, now, {
        accountId: ACCOUNT,
        email: 'a@example.test',
      });

      for (const n of [20, 40, 60, 80]) {
        day(n);
        await resume(store, now, token);
      }

      const hash = createHash('sha256').update(token).digest('hex');

      expect((await store.find(hash))?.expiresAt).toEqual(
        new Date(START.getTime() + 90 * DAY)
      );
    });

    it('refuses an ended session', async () => {
      const { now, store } = await setup();
      const token = await startSession(store, now, {
        accountId: ACCOUNT,
        email: 'a@example.test',
      });

      await endSession(store, token);
      expect(await resume(store, now, token)).toBeUndefined();
    });

    it('ends a session once, and ending a malformed token does nothing', async () => {
      const { now, store } = await setup();
      const token = await startSession(store, now, {
        accountId: ACCOUNT,
        email: 'a@example.test',
      });

      await endSession(store, token);
      await endSession(store, token);
      await endSession(store, 'not a token');
      expect(await resume(store, now, token)).toBeUndefined();
    });

    it('renews nothing for an unknown hash', async () => {
      const { store } = await setup();

      await store.renew('0'.repeat(64), new Date(START));
      expect(await store.find('0'.repeat(64))).toBeUndefined();
    });

    it('refuses a malformed or unknown token', async () => {
      const { now, store } = await setup();

      expect(await resume(store, now, '')).toBeUndefined();
      expect(await resume(store, now, 'x'.repeat(43))).toBeUndefined();
      expect(await resume(store, now, 'a b')).toBeUndefined();
    });

    it('deletes every expired row when a session starts', async () => {
      const { day, now, store } = await setup();
      const old = await startSession(store, now, {
        accountId: OTHER,
        email: 'o@example.test',
      });
      const oldHash = createHash('sha256').update(old).digest('hex');

      day(40);
      await startSession(store, now, {
        accountId: ACCOUNT,
        email: 'a@example.test',
      });

      expect(await store.find(oldHash)).toBeUndefined();
    });
  });
};
