import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { jpegSize, sweepProblems } from '@ks/lib/design/sweep.mts';

/** Images in `design/` with no `screens.json` entry yet. Remove a name when its slice adds the entry. */
const NOT_BUILT = [
  'map-account-menu',
  'map-account-menu-phone',
  'map-date-invalid',
  'map-date-invalid-phone',
  'map-desktop',
  'map-desktop-filters',
  'map-districts',
  'map-districts-phone',
  'map-empty-date',
  'map-empty-date-phone',
  'map-empty-tree',
  'map-empty-tree-phone',
  'map-loading',
  'map-loading-phone',
  'map-offline',
  'map-offline-phone',
  'map-phone',
  'map-phone-collapsed',
  'map-phone-filters',
  'map-phone-layers',
  'map-sources',
  'map-sources-phone',
  'sign-in-desktop',
  'sign-in-phone',
  'sign-in-phone-error',
];

const jpeg = (width: number, height: number, ...before: number[][]) =>
  new Uint8Array([
    0xff,
    0xd8,
    ...before.flat(),
    0xff,
    0xc0,
    0,
    11,
    8,
    height >> 8,
    height & 0xff,
    width >> 8,
    width & 0xff,
  ]);

const screen = (name: string, width: number, height: number) => ({
  height,
  mode: 'blocking',
  name,
  route: '/',
  width,
});

const config = (...screens: object[]) => ({ screens, threshold: 0.5 });

describe('jpegSize', () => {
  it('reads the size, skipping segments before the frame', () => {
    expect(jpegSize(jpeg(780, 2650, [0xff, 0xe0, 0, 4, 1, 1]))).toEqual({
      height: 2650,
      width: 780,
    });
    // DHT (C4) is not a frame.
    expect(jpegSize(jpeg(5, 6, [0xff, 0xc4, 0, 2]))).toEqual({
      height: 6,
      width: 5,
    });
  });

  it('rejects a file that is not a JPEG, or has no frame', () => {
    expect(() => jpegSize(new Uint8Array([1, 2]))).toThrow('not a JPEG');
    expect(() => jpegSize(new Uint8Array([0xff, 0xd8, 1, 2, 3]))).toThrow(
      'no JPEG frame'
    );
    expect(() =>
      jpegSize(new Uint8Array([0xff, 0xd8, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
    ).toThrow('bad JPEG marker');
  });
});

describe('sweepProblems', () => {
  const images = {
    'a-phone': { height: 1000, width: 780 },
    b: { height: 9, width: 8 },
  };

  it('accepts sized entries and listed not-built images', () => {
    expect(
      sweepProblems(config(screen('a-phone', 390, 500)), images, ['b'])
    ).toEqual([]);
  });

  it('flags an image with no entry that is not listed', () => {
    expect(
      sweepProblems(config(screen('a-phone', 390, 500)), images, [])
    ).toEqual(['b: has no entry and is not in NOT_BUILT']);
  });

  it('flags a doubled entry, with an image or in NOT_BUILT', () => {
    expect(
      sweepProblems(
        config(screen('a-phone', 390, 500), screen('a-phone', 390, 500)),
        images,
        ['a-phone', 'b']
      )
    ).toEqual([
      'a-phone: listed twice',
      'a-phone: also in NOT_BUILT',
      'a-phone: listed twice',
      'a-phone: also in NOT_BUILT',
    ]);
  });

  it('flags an entry with no image', () => {
    expect(sweepProblems(config(screen('c', 1, 1)), {}, [])).toEqual([
      'c: no image in design/',
    ]);
  });

  it('flags a wrong size, scaled for phones', () => {
    expect(
      sweepProblems(config(screen('a-phone', 390, 1000)), images, ['b'])
    ).toEqual(['a-phone: sized 390x1000, snapshot is 390x500']);
  });

  // NFR-05
  it('flags an entry that is not blocking', () => {
    expect(
      sweepProblems(
        config({ ...screen('a-phone', 390, 500), mode: 'report' }),
        images,
        ['b']
      )
    ).toEqual(['a-phone: is not blocking']);
  });

  it('flags ignore areas and a threshold other than 0.5', () => {
    expect(
      sweepProblems(
        {
          screens: [{ ...screen('a-phone', 390, 500), ignore: [] }],
          threshold: 1,
        },
        images,
        ['b']
      )
    ).toEqual(['threshold must be 0.5', 'a-phone: has ignore']);
  });

  it('treats a malformed config as empty', () => {
    expect(sweepProblems('x', {}, [])).toEqual(['threshold must be 0.5']);
    expect(sweepProblems({ screens: [3] }, {}, [])).toEqual([
      'threshold must be 0.5',
    ]);
  });
});

describe('design/screens.json', () => {
  it('has a sized entry for every image, or lists it in NOT_BUILT', () => {
    const dir = join(process.cwd(), 'design');
    const images = Object.fromEntries(
      readdirSync(dir)
        .filter(file => file.endsWith('.jpg'))
        .map(file => [
          file.slice(0, -'.jpg'.length),
          jpegSize(readFileSync(join(dir, file))),
        ])
    );
    const raw: unknown = JSON.parse(
      readFileSync(join(dir, 'screens.json'), 'utf8')
    );

    expect(sweepProblems(raw, images, NOT_BUILT)).toEqual([]);
  });
});
