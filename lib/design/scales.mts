/** The steps of a scale: built from the settings in `$extensions.kinscape` of a step group (#1197). */

import type { DtcgTree, ScaleSettings } from '#ks/lib/design/types.ts';

import { cssText, isTree } from '#ks/lib/design/dtcg.mts';

type Step = { name: string; note: string; value: number };

const FIRST = 100;
const BASE_STEP = 400;

/** Rounds `value` to the nearest multiple of `unit`. A halfway value rounds to the larger multiple. The 9-decimal round lifts a half that floating point puts just below. */
export const roundTo = (value: number, unit: number): number =>
  Number(
    (Math.floor(Number((value / unit).toFixed(9)) + 0.5) * unit).toFixed(9)
  );

const gridSteps = (
  grid: number,
  count: number,
  unit: string
): Omit<Step, 'name'>[] =>
  Array.from({ length: count }, (_, at) => ({
    note: `Grid of ${grid}${unit}, step ${at + 1}.`,
    value: roundTo((at + 1) * grid, grid),
  }));

const named = (
  scale: string,
  first: number,
  entries: Omit<Step, 'name'>[]
): Step[] => {
  const steps = entries.map((entry, at) => ({
    ...entry,
    name: String(first + at * FIRST),
  }));

  if (first < FIRST) {
    throw new Error(`scale.${scale}: the settings give a step below ${FIRST}`);
  }

  return steps;
};

/** The steps of the group `scale` under `scale.`, from its settings. It throws, naming the group, if a name falls below 100 or the mode is unknown. */
export const stepsOf = (scale: string, settings: ScaleSettings): Step[] => {
  const px = settings.unit === 'rem' ? 'px' : settings.unit;

  switch (settings.mode) {
    case 'explicit':
      return named(
        scale,
        FIRST,
        settings.values.map((value, at) => ({
          note: `Explicit list, value ${at + 1}.`,
          value,
        }))
      );
    case 'grid':
      return named(scale, FIRST, gridSteps(settings.grid, settings.steps, px));
    case 'hybrid': {
      const count = Math.round(settings.limit / settings.grid);

      return named(scale, FIRST, [
        ...gridSteps(settings.grid, count, px),
        ...Array.from({ length: settings.above }, (_, at) => ({
          note: `Ratio ${settings.ratio} from ${settings.limit}${px}, rounded to ${settings.grid}${px}, step ${at + 1}.`,
          value: roundTo(
            settings.limit * settings.ratio ** (at + 1),
            settings.grid
          ),
        })),
      ]);
    }
    case 'ratio':
      return named(
        scale,
        BASE_STEP - settings.below * FIRST,
        Array.from({ length: settings.below + 1 + settings.above }, (_, at) => {
          const power = at - settings.below;

          return {
            note: `Base ${settings.base}${px}, ratio ${settings.ratio} to the power ${power}, rounded to ${settings.round}${px}.`,
            value: roundTo(
              settings.base * settings.ratio ** power,
              settings.round
            ),
          };
        })
      );
    default:
      throw new Error(
        `scale.${scale}: unknown mode "${(settings as { mode: string }).mode}"`
      );
  }
};

const settingsOf = (group: DtcgTree): ScaleSettings | undefined =>
  (group.$extensions as { kinscape?: ScaleSettings } | undefined)?.kinscape;

/** The token of a step. A rem group builds its steps in px, so the token holds px ÷ 16 (exact in binary). */
const tokenOf = (settings: ScaleSettings, step: Step): DtcgTree => ({
  $description: step.note,
  $type:
    settings.unit === 'px' || settings.unit === 'rem'
      ? 'dimension'
      : 'duration',
  $value: {
    unit: settings.unit,
    value: settings.unit === 'rem' ? step.value / 16 : step.value,
  },
});

/** The groups of `scale` that have settings, by name. */
const groupsOf = (tree: DtcgTree): [string, DtcgTree, ScaleSettings][] =>
  Object.entries((tree.scale ?? {}) as DtcgTree).flatMap(([name, group]) => {
    const settings = settingsOf(group as DtcgTree);

    return name.startsWith('$') || settings === undefined
      ? []
      : [[name, group as DtcgTree, settings]];
  });

/** The tree with the steps of each `scale` group written from its settings. A group with no settings stays. */
export const withSteps = (tree: DtcgTree): DtcgTree => {
  const scale = { ...((tree.scale ?? {}) as DtcgTree) };

  for (const [name, group, settings] of groupsOf(tree)) {
    scale[name] = {
      ...Object.fromEntries(
        Object.entries(group).filter(([key]) => key.startsWith('$'))
      ),
      ...Object.fromEntries(
        stepsOf(name, settings).map(step => [
          step.name,
          tokenOf(settings, step),
        ])
      ),
    };
  }

  return 'scale' in tree ? { ...tree, scale } : tree;
};

/** The CSS text of a step value, or its JSON when it is not a dimension or a duration. */
const text = (type: unknown, value: unknown, path: string): string =>
  isTree(value)
    ? cssText({ $type: type as string, $value: value, path: path.split('.') })
    : JSON.stringify(value);

/** A step that differs from its settings, a missing or extra step, and two equal steps in one scale. Each message names its path. */
export const scaleProblems = (tree: DtcgTree): string[] =>
  groupsOf(tree).flatMap(([name, group, settings]) => {
    const wanted = new Map(
      stepsOf(name, settings).map(step => [step.name, tokenOf(settings, step)])
    );
    const have = Object.entries(group).filter(([key]) => !key.startsWith('$'));
    const names = new Set([...wanted.keys(), ...have.map(([key]) => key)]);
    const problems = [...names].toSorted().flatMap(step => {
      const path = `scale.${name}.${step}`;
      const expected = wanted.get(step);
      const actual = group[step] as DtcgTree | undefined;

      if (expected === undefined) {
        return [`${path}: is a step that the settings do not give`];
      }

      if (actual === undefined) {
        return [
          `${path}: is missing, the settings give ${text(expected.$type, expected.$value, path)}`,
        ];
      }

      if (JSON.stringify(actual.$value) !== JSON.stringify(expected.$value)) {
        return [
          `${path}: is ${text(expected.$type, actual.$value, path)}, the settings give ${text(expected.$type, expected.$value, path)}`,
        ];
      }

      return JSON.stringify(actual) === JSON.stringify(expected)
        ? []
        : [`${path}: differs from what its settings write`];
    });
    const keys = [...wanted.keys()];
    const equal = keys.flatMap((key, at) =>
      at > 0 &&
      JSON.stringify(wanted.get(key)!.$value) ===
        JSON.stringify(wanted.get(keys[at - 1])!.$value)
        ? [
            `scale.${name}: steps ${keys[at - 1]} and ${key} are both ${text(wanted.get(key)!.$type, wanted.get(key)!.$value, `scale.${name}.${key}`)}`,
          ]
        : []
    );

    return [...problems, ...equal];
  });
