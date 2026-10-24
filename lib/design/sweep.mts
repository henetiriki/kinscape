/** The design sweep: holds `design/screens.json` to one entry per built snapshot image. */
import { shotFor } from '../../scripts/design-shots.mts';

export type Size = { height: number; width: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Not a frame header: DHT (C4), JPG (C8) and DAC (CC) share the SOF range. */
const isFrame = (marker: number) =>
  marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);

/** Reads the pixel size from a JPEG's start-of-frame header. */
export const jpegSize = (bytes: Uint8Array): Size => {
  let at = 2;

  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('not a JPEG');

  while (at + 9 <= bytes.length) {
    if (bytes[at] !== 0xff) throw new Error('bad JPEG marker');

    if (isFrame(bytes[at + 1])) {
      return {
        height: (bytes[at + 5] << 8) | bytes[at + 6],
        width: (bytes[at + 7] << 8) | bytes[at + 8],
      };
    }

    at += 2 + ((bytes[at + 2] << 8) | bytes[at + 3]);
  }

  throw new Error('no JPEG frame');
};

/**
 * Lists what stops `screens.json` covering every image: an image with no entry
 * and not in `notBuilt`, an entry that is also in `notBuilt` or has no image,
 * one that is not the snapshot's size, an `ignore` area, or a threshold other than 0.5.
 */
export const sweepProblems = (
  raw: unknown,
  images: Record<string, Size>,
  notBuilt: string[]
): string[] => {
  const config = isRecord(raw) ? raw : {};
  const screens = (Array.isArray(config.screens) ? config.screens : []).filter(
    isRecord
  );
  const named = screens.map(screen => String(screen.name));
  const problems: string[] = [];

  if (config.threshold !== 0.5) problems.push('threshold must be 0.5');

  for (const name of Object.keys(images)) {
    if (!named.includes(name) && !notBuilt.includes(name)) {
      problems.push(`${name}: has no entry and is not in NOT_BUILT`);
    }
  }

  for (const screen of screens) {
    const name = String(screen.name);
    const image = images[name];

    if (named.indexOf(name) !== named.lastIndexOf(name)) {
      problems.push(`${name}: listed twice`);
    }

    if (notBuilt.includes(name)) problems.push(`${name}: also in NOT_BUILT`);

    if (screen.ignore !== undefined) problems.push(`${name}: has ignore`);

    if (image === undefined) {
      problems.push(`${name}: no image in design/`);
      continue;
    }

    const { scale } = shotFor(name);
    const want = { height: image.height / scale, width: image.width / scale };

    if (screen.width !== want.width || screen.height !== want.height) {
      problems.push(
        `${name}: sized ${String(screen.width)}x${String(screen.height)}, snapshot is ${want.width}x${want.height}`
      );
    }
  }

  return problems;
};
