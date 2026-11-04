import { afterEach, describe, expect, it } from 'vitest';

import type { ThrottleStore } from '@ks/lib/domain/auth/types.ts';

import { countFailure, emailKey, mayTry } from '@ks/server/auth/throttle.mts';

const MINUTE = 60_000;
const START = new Date('2030-01-01T00:00:00Z');

type Made = { close: () => Promise<void>; store: ThrottleStore };

/** The throttle rules over any store, with a fake clock. */
export const runThrottleContract = (
  name: string,
  make: () => Promise<Made>
) => {
  // NFR-03
  describe(`throttle on ${name}`, () => {
    let made: Made | undefined;
    let time = START.getTime();

    const setup = async () => {
      made = await make();
      time = START.getTime();

      return {
        at: (minutes: number, seconds = 0) => {
          time = START.getTime() + minutes * MINUTE + seconds * 1000;
        },
        now: () => new Date(time),
        store: made.store,
      };
    };

    afterEach(async () => {
      await made?.close();
      made = undefined;
    });

    it('allows an email with 4 failures in 15 minutes', async () => {
      const { now, store } = await setup();

      for (let i = 0; i < 4; i += 1) {
        await countFailure(store, now(), 'a@example.test');
      }

      expect(await mayTry(store, now(), 'a@example.test')).toBe(true);
    });

    it('refuses at the fifth failure and allows again 15 minutes later', async () => {
      const { at, now, store } = await setup();

      for (let i = 0; i < 5; i += 1) {
        await countFailure(store, now(), 'a@example.test');
      }

      expect(await mayTry(store, now(), 'a@example.test')).toBe(false);

      at(14, 59);

      expect(await mayTry(store, now(), 'a@example.test')).toBe(false);

      at(15);

      expect(await mayTry(store, now(), 'a@example.test')).toBe(true);
    });

    it('allows 5 failures spread over more than 15 minutes', async () => {
      const { at, now, store } = await setup();

      for (let i = 0; i < 5; i += 1) {
        at(i * 4);
        await countFailure(store, now(), 'a@example.test');

        expect(await mayTry(store, now(), 'a@example.test')).toBe(true);
      }
    });

    it('does not refuse another email', async () => {
      const { now, store } = await setup();

      for (let i = 0; i < 5; i += 1) {
        await countFailure(store, now(), 'a@example.test');
      }

      expect(await mayTry(store, now(), 'b@example.test')).toBe(true);
    });

    it('counts mixed case and spaces as one email', async () => {
      const { now, store } = await setup();
      const typed = ['A@example.test', ' a@EXAMPLE.test', 'a@example.test '];

      for (const email of [...typed, ...typed]) {
        await countFailure(store, now(), email);
      }

      expect(await mayTry(store, now(), 'a@example.test')).toBe(false);
      expect(emailKey('A@example.test')).toBe(emailKey(' a@example.test '));
    });

    it('forgets failures older than 30 minutes', async () => {
      const { at, now, store } = await setup();

      for (let i = 0; i < 5; i += 1) {
        await countFailure(store, now(), 'a@example.test');
      }

      at(31);
      await countFailure(store, now(), 'b@example.test');

      expect(
        await store.since(emailKey('a@example.test'), new Date(START.getTime()))
      ).toEqual([]);
    });
  });
};
