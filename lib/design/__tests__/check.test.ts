import { describe, expect, it } from 'vitest';

import {
  changedPixels,
  compare,
  outcomeFor,
  parseConfig,
  summarise,
  unionMask,
} from '../check.mts';

const known = { snapshots: ['map-desktop'], states: ['open'] };
const screen = {
  height: 900,
  mode: 'blocking',
  name: 'map-desktop',
  route: '/',
  width: 1440,
};

const image = (...pixels: number[][]) => new Uint8Array(pixels.flat());
const WHITE = [255, 255, 255, 255];
const BLACK = [0, 0, 0, 255];

describe('parseConfig', () => {
  it('defaults to no ignore areas', () => {
    const config = parseConfig({ screens: [screen], threshold: 0.5 }, known);

    expect(config.screens[0].ignore).toEqual([]);
    expect(config.threshold).toBe(0.5);
  });

  it('keeps a state and ignore areas', () => {
    const area = { height: 2, width: 3, x: 0, y: 1 };
    const config = parseConfig(
      { screens: [{ ...screen, ignore: [area], state: 'open' }], threshold: 0 },
      known
    );

    expect(config.screens[0]).toMatchObject({ ignore: [area], state: 'open' });
  });

  it.each([null, [], { screens: [] }, { screens: {}, threshold: 1 }])(
    'rejects a malformed file %j',
    raw => {
      expect(() => parseConfig(raw, known)).toThrow(/threshold/);
    }
  );

  it('rejects a negative threshold', () => {
    expect(() => parseConfig({ screens: [], threshold: -1 }, known)).toThrow(
      /threshold/
    );
  });

  it('names a screen with no snapshot', () => {
    expect(() =>
      parseConfig(
        { screens: [{ ...screen, name: 'nope' }], threshold: 1 },
        known
      )
    ).toThrow('nope: no snapshot in design/source');
  });

  it('names an unknown state', () => {
    expect(() =>
      parseConfig(
        { screens: [{ ...screen, state: 'gone' }], threshold: 1 },
        known
      )
    ).toThrow('map-desktop: unknown state "gone"');
  });

  it('reports every problem with a screen', () => {
    expect(() =>
      parseConfig(
        {
          screens: [
            { ...screen, height: 0, ignore: [{}], mode: 'x', route: 'a' },
            { ...screen, ignore: 'x', state: 3 },
            {},
          ],
          threshold: 1,
        },
        known
      )
    ).toThrow(
      /route must start[^]*positive[^]*mode must[^]*ignore must[^]*no name/
    );
  });
});

describe('changedPixels and unionMask', () => {
  it('marks the pixels that differ', () => {
    const a = image(WHITE, BLACK, WHITE);
    const b = image(WHITE, WHITE, [255, 255, 255, 0]);

    expect([...changedPixels(a, b)]).toEqual([0, 1, 1]);
    expect([
      ...unionMask(Uint8Array.of(1, 0, 0), Uint8Array.of(0, 0, 1)),
    ]).toEqual([1, 0, 1]);
  });
});

describe('compare', () => {
  const a = image(WHITE, BLACK, WHITE, WHITE);
  const b = image(WHITE, WHITE, WHITE, BLACK);

  it('scores the share of pixels that differ', () => {
    const score = compare(a, b, 2, new Uint8Array(4), []);

    expect(score.differing).toBe(2);
    expect(score.percent).toBe(50);
    expect(score.diff).toHaveLength(16);
  });

  it('scores 0% when the images differ only inside the mask', () => {
    const score = compare(a, b, 2, Uint8Array.of(0, 1, 0, 1), []);

    expect(score).toMatchObject({ differing: 0, percent: 0 });
  });

  it('skips ignored areas', () => {
    const score = compare(a, b, 2, new Uint8Array(4), [
      { height: 1, width: 1, x: 1, y: 0 },
    ]);

    expect(score.differing).toBe(1);
    expect(score.percent).toBeCloseTo(33.33, 1);
  });

  it('scores 0% when every pixel is skipped', () => {
    expect(compare(a, b, 2, Uint8Array.of(1, 1, 1, 1), []).percent).toBe(0);
  });
});

describe('outcomeFor', () => {
  it('matches at or under the threshold', () => {
    expect(outcomeFor(0.5, 0.5)).toBe('matches');
  });

  it('blocks a screen past the threshold', () => {
    expect(outcomeFor(9, 0.5)).toBe('blocked');
  });
});

describe('summarise', () => {
  it('lists each screen with its result', () => {
    const table = summarise(
      [
        { differing: 0, name: 'sign-in', outcome: 'matches', percent: 0 },
        { differing: 5, name: 'map-phone', outcome: 'blocked', percent: 2 },
      ],
      0.5
    );

    expect(table).toContain('| sign-in | 0 | 0.00% | Matches |');
    expect(table).toContain('| map-phone | 5 | 2.00% | Fails (blocking) |');
    expect(table).toContain('more than 0.5%');
  });
});
