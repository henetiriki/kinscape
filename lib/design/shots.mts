import type { Shot } from '#ks/lib/design/types.ts';

/** One raster thread: several threads can tile a page in a different order on each run, which changes the image bytes. */
export const LAUNCH_ARGS = ['--num-raster-threads=1'];

/** The map style phone board is a long page; every other phone file is one screen. */
const PHONE_BOARD = 'map-style-phone';

/** Boards taller than one screen. */
const FULL_PAGE = new Set([
  'fuzzy-date-readings',
  'map-style',
  'spacing-and-controls',
  'type-scale',
]);

/** Phone screens and the tall boards each have their own size. */
export const shotFor = (name: string): Shot => {
  if (name.includes('phone')) {
    return {
      fullPage: name === PHONE_BOARD,
      height: 844,
      scale: 2,
      width: 390,
    };
  }

  if (FULL_PAGE.has(name)) {
    return { fullPage: true, height: 900, scale: 1, width: 1440 };
  }

  return { fullPage: false, height: 900, scale: 1, width: 1440 };
};
