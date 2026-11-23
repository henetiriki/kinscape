import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { jpegSize, sweepProblems } from '@ks/lib/design/sweep.mts';

/**
 * The folders of `app/screens/` that stay: no app route can show the page today. Each blocker names
 * the data or outcome that is missing. When an app route can show the page, delete the folder and its row.
 */
const SCREEN_ONLY: { blocker: string; folder: string }[] = [
  {
    blocker:
      'The boards draw the map at 1901 with its search bar and contested claims, which `/` does not.',
    folder: 'pin-form',
  },
  {
    blocker: 'The open menu is a state of the map, which has no People.',
    folder: 'map-account-menu',
  },
  {
    blocker:
      'The map has no Pin popup in the loading or failed state until a request is slow or fails.',
    folder: 'map-pin-popup',
  },
  {
    blocker:
      'The board draws the map at 1901 with its search bar and the tabbed panel, which `/` does not.',
    folder: 'pin-click-popup',
  },
  {
    blocker:
      'The card of the count marker looks is part of the board, not a state of the map.',
    folder: 'map-pin-count',
  },
  {
    blocker:
      'The map needs a Tree with three Pins on Example Farm, and the board holds a hover look.',
    folder: 'map-pin-fan',
  },
  {
    blocker: 'No app route holds the loading state.',
    folder: 'people-loading',
  },
  {
    blocker: 'A conflict needs a save from a second tab.',
    folder: 'person-conflict',
  },
];

/** Lists each folder of `app/screens/` with no row, each row with no folder, and each empty blocker. */
const screenOnlyProblems = (
  folders: string[],
  rows: { blocker: string; folder: string }[]
): string[] => [
  ...folders
    .filter(folder => !rows.some(row => row.folder === folder))
    .map(folder => `${folder}: has no row in SCREEN_ONLY`),
  ...rows.flatMap(({ blocker, folder }) => [
    ...(folders.includes(folder)
      ? []
      : [`${folder}: SCREEN_ONLY row has no folder in app/screens`]),
    ...(blocker.trim() === ''
      ? [`${folder}: SCREEN_ONLY row has no blocker`]
      : []),
  ]),
];

/** Images in `design/` that `screens.json` has no entry for: draft boards, and screens that the app has not built. Remove a name when its slice adds the entry, or when a PR deletes its draft board. */
const NO_ENTRY = [
  'fuzzy-date-readings',
  'map-account-menu-phone-proposed',
  'map-account-menu-proposed',
  'map-credits-narrow',
  'map-credits-narrow-open',
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
  'map-style',
  'map-style-phone',
  'pin-edit',
  'pin-edit-load-failed',
  'pin-edit-loading',
  'pin-edit-moved',
  'relationship-messages',
  'sign-in-desktop-proposed',
  'sign-in-phone-error-proposed',
  'sign-in-phone-proposed',
  'sign-in-phone-unavailable',
  'sign-in-unavailable',
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

  it('accepts sized entries and listed no-entry images', () => {
    expect(
      sweepProblems(config(screen('a-phone', 390, 500)), images, ['b'])
    ).toEqual([]);
  });

  it('flags an image with no entry that is not listed', () => {
    expect(
      sweepProblems(config(screen('a-phone', 390, 500)), images, [])
    ).toEqual(['b: has no entry and is not in NO_ENTRY']);
  });

  it('flags a doubled entry, with an image or in NO_ENTRY', () => {
    expect(
      sweepProblems(
        config(screen('a-phone', 390, 500), screen('a-phone', 390, 500)),
        images,
        ['a-phone', 'b']
      )
    ).toEqual([
      'a-phone: listed twice',
      'a-phone: also in NO_ENTRY',
      'a-phone: listed twice',
      'a-phone: also in NO_ENTRY',
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

describe('screenOnlyProblems', () => {
  it('accepts a folder with a row that has a blocker', () => {
    expect(
      screenOnlyProblems(['a'], [{ blocker: 'no route shows it', folder: 'a' }])
    ).toEqual([]);
  });

  it('names a folder with no row', () => {
    expect(
      screenOnlyProblems(['a', 'b'], [{ blocker: 'x', folder: 'a' }])
    ).toEqual(['b: has no row in SCREEN_ONLY']);
  });

  it('names a row with no folder', () => {
    expect(screenOnlyProblems([], [{ blocker: 'x', folder: 'a' }])).toEqual([
      'a: SCREEN_ONLY row has no folder in app/screens',
    ]);
  });

  it('names a row with an empty blocker', () => {
    expect(screenOnlyProblems(['a'], [{ blocker: ' ', folder: 'a' }])).toEqual([
      'a: SCREEN_ONLY row has no blocker',
    ]);
  });
});

describe('app/screens', () => {
  it('has a SCREEN_ONLY row for every folder, each with a blocker', () => {
    const folders = readdirSync(join(process.cwd(), 'app/screens'), {
      withFileTypes: true,
    })
      .filter(entry => entry.isDirectory() && entry.name !== '__tests__')
      .map(entry => entry.name);

    expect(screenOnlyProblems(folders, SCREEN_ONLY)).toEqual([]);
  });
});

describe('design/screens.json', () => {
  it('has a sized entry for every image, or lists it in NO_ENTRY', () => {
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

    expect(sweepProblems(raw, images, NO_ENTRY)).toEqual([]);
  });
});
