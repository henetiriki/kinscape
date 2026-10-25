/** The design check: validates `design/screens.json`, compares pixels outside the mask, summarises. */
import pixelmatch from 'pixelmatch';

export type Area = { height: number; width: number; x: number; y: number };

export type Config = { screens: Screen[]; threshold: number };

export type Known = { snapshots: string[]; states: string[] };

export type Outcome = 'blocked' | 'matches';

export type Result = {
  differing: number;
  name: string;
  outcome: Outcome;
  percent: number;
};

export type Score = { diff: Uint8Array; differing: number; percent: number };

export type Screen = {
  height: number;
  ignore: Area[];
  mode: 'blocking';
  name: string;
  route: string;
  state?: string;
  width: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const areaProblem = (area: unknown): boolean =>
  !isRecord(area) ||
  !isCount(area.width) ||
  !isCount(area.height) ||
  typeof area.x !== 'number' ||
  typeof area.y !== 'number';

const screenProblems = (raw: unknown, known: Known): string[] => {
  if (!isRecord(raw) || typeof raw.name !== 'string') {
    return ['a screen has no name'];
  }

  const { name } = raw;
  const problems: string[] = [];
  const bad = (what: string) => problems.push(`${name}: ${what}`);

  if (!known.snapshots.includes(name)) bad('no snapshot in design/source');

  if (typeof raw.route !== 'string' || !raw.route.startsWith('/')) {
    bad('route must start with /');
  }

  if (!isCount(raw.width) || !isCount(raw.height)) {
    bad('width and height must be positive whole numbers');
  }

  if (raw.mode !== 'blocking') {
    bad('mode must be "blocking"');
  }

  if (
    raw.state !== undefined &&
    (typeof raw.state !== 'string' || !known.states.includes(raw.state))
  ) {
    bad(`unknown state ${JSON.stringify(raw.state)}`);
  }

  if (
    raw.ignore !== undefined &&
    (!Array.isArray(raw.ignore) || raw.ignore.some(areaProblem))
  ) {
    bad('ignore must list { x, y, width, height } areas');
  }

  return problems;
};

/** Returns the parsed config; throws one error listing everything wrong with it. */
export const parseConfig = (raw: unknown, known: Known): Config => {
  if (
    !isRecord(raw) ||
    typeof raw.threshold !== 'number' ||
    !(raw.threshold >= 0) ||
    !Array.isArray(raw.screens)
  ) {
    throw new Error(
      'screens.json needs a threshold (percent) and a screens list'
    );
  }

  const problems = raw.screens.flatMap(screen => screenProblems(screen, known));

  if (problems.length > 0) throw new Error(problems.join('\n'));

  return {
    screens: (raw.screens as Partial<Screen>[]).map(screen => ({
      ...(screen as Screen),
      ignore: screen.ignore ?? [],
    })),
    threshold: raw.threshold,
  };
};

/** One byte per pixel: 1 where the two RGBA images differ. */
export const changedPixels = (a: Uint8Array, b: Uint8Array): Uint8Array => {
  const changed = new Uint8Array(a.length / 4);

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) changed[Math.floor(i / 4)] = 1;
  }

  return changed;
};

export const unionMask = (a: Uint8Array, b: Uint8Array): Uint8Array =>
  a.map((value, i) => value | b[i]);

const covers = (area: Area, x: number, y: number) =>
  x >= area.x &&
  x < area.x + area.width &&
  y >= area.y &&
  y < area.y + area.height;

/**
 * Compares two RGBA images `width` pixels wide, skipping the masked and ignored
 * pixels. `percent` is the share of the compared pixels that differ.
 * `diff` is red where they differ, white where they match, blue where skipped.
 */
export const compare = (
  built: Uint8Array,
  design: Uint8Array,
  width: number,
  mask: Uint8Array,
  ignore: Area[]
): Score => {
  const marks = new Uint8Array(built.length);

  // pixelmatch paints a differing pixel [255, 0, 0] and skips anti-aliased ones.
  pixelmatch(built, design, marks, width, mask.length / width, {
    aaColor: [255, 255, 255],
    alpha: 0,
    diffColor: [255, 0, 0],
    threshold: 0.1,
  });

  const diff = new Uint8Array(built.length);
  let compared = 0;
  let differing = 0;

  for (let i = 0; i < mask.length; i += 1) {
    const x = i % width;
    const y = Math.floor(i / width);
    const skipped = mask[i] === 1 || ignore.some(area => covers(area, x, y));
    let colour = [255, 255, 255, 255];

    if (skipped) {
      colour = [200, 210, 255, 255];
    } else {
      compared += 1;

      if (marks[i * 4 + 1] === 0 && marks[i * 4] === 255) {
        differing += 1;
        colour = [255, 0, 0, 255];
      }
    }

    diff.set(colour, i * 4);
  }

  return {
    diff,
    differing,
    percent: compared === 0 ? 0 : (differing / compared) * 100,
  };
};

export const outcomeFor = (percent: number, threshold: number): Outcome =>
  percent <= threshold ? 'matches' : 'blocked';

const LABEL: Record<Outcome, string> = {
  blocked: 'Fails (blocking)',
  matches: 'Matches',
};

/** A Markdown table for the job summary. */
export const summarise = (results: Result[], threshold: number): string =>
  [
    '## Design check',
    '',
    `A screen fails when more than ${threshold}% of its unmasked pixels differ.`,
    '',
    '| Screen | Differing pixels | Difference | Result |',
    '| --- | ---: | ---: | --- |',
    ...results.map(
      ({ differing, name, outcome, percent }) =>
        `| ${name} | ${differing} | ${percent.toFixed(2)}% | ${LABEL[outcome]} |`
    ),
  ].join('\n');
