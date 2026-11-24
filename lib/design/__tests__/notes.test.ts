import { describe, expect, it } from 'vitest';

import type { DtcgTree } from '@ks/lib/design/types.ts';

import { noteProblems } from '@ks/lib/design/notes.mts';

const colour = (hex: string) => ({
  $type: 'color',
  $value: { colorSpace: 'srgb', components: [0, 0, 0], hex },
});
const px = (value: number) => ({
  $type: 'dimension',
  $value: { unit: 'px', value },
});
const num = (value: number) => ({ $type: 'number', $value: value });
const ref = (type: string, path: string) => ({
  $type: type,
  $value: `{${path}}`,
});

const tokens: DtcgTree = {
  $schema: 'https://www.designtokens.org/schemas/2025.10/format.json',
  breakpoint: { 'phone-width': px(639.98) },
  colour: {
    brand: colour('#264f29'),
    focus: ref('color', 'colour.brand'),
    white: colour('#ffffff'),
  },
  focus: { width: px(2) },
  font: {
    body: {
      $type: 'fontFamily',
      $value: ['Public Sans', 'system-ui', 'sans-serif'],
    },
  },
  layout: { 'dock-left': px(368) },
  map: {
    coastline: { colour: colour('#7e9a98'), width: num(0.9) },
    hillshade: { exaggeration: num(0.3), shadow: colour('#5b6355') },
    land: colour('#e9ebe2'),
    pin: { halo: ref('color', 'colour.white'), 'halo-width': num(2) },
  },
  motion: {
    press: {
      $type: 'transition',
      $value: {
        delay: { unit: 'ms', value: 0 },
        duration: { unit: 'ms', value: 120 },
        timingFunction: [0, 0, 0.58, 1],
      },
    },
  },
  radius: { panel: px(12) },
  shadow: {
    raised: {
      $type: 'shadow',
      $value: {
        blur: { unit: 'px', value: 2 },
        color: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#000000' },
        offsetX: { unit: 'px', value: 0 },
        offsetY: { unit: 'px', value: 1 },
        spread: { unit: 'px', value: 0 },
      },
    },
  },
  size: { touch: px(44) },
  space: { '4': px(4) },
  type: { body: { font: ref('fontFamily', 'font.body'), size: px(15) } },
  z: { dock: num(5) },
};

const notes: Record<string, string> = {
  'breakpoint.phone-width': 'Phone layout starts below this width.',
  'colour.brand': 'Primary buttons.',
  'colour.focus': 'Focus outline.',
  'colour.white': 'Text on dark.',
  'focus.width': 'Outline thickness.',
  'font.body': 'All UI text.',
  'layout.dock-left': 'Left edge of the dock.',
  'map.coastline.colour': 'Coast line.',
  'map.hillshade.shadow': 'Shaded slopes.',
  'map.land': 'Land fill.',
  'map.pin.halo': 'Ring round a Pin.',
  'radius.panel': 'Panels and the dock.',
  'shadow.raised': 'Panels.',
  'size.touch': 'Smallest target.',
  'space.4': 'The smallest step.',
  'type.body': 'Panels and popups.',
  'z.dock': 'Stacks the dock above the map.',
};

/** The fixture with a `$description` at each path of `given`: a path that holds no token gets a bare group. */
const withNotes = (given: Record<string, string>): DtcgTree => {
  const tree = structuredClone(tokens);

  for (const [path, note] of Object.entries(given)) {
    const keys = path.split('.');
    const parent = keys
      .slice(0, -1)
      .reduce<DtcgTree>((at, key) => (at[key] ??= {}) as DtcgTree, tree);
    const node = (parent[keys.at(-1)!] ??= {}) as DtcgTree;

    node.$description = note;
  }

  return tree;
};

const without = (...paths: string[]): Record<string, string> =>
  Object.fromEntries(
    Object.entries(notes).filter(([path]) => !paths.includes(path))
  );

describe('noteProblems', () => {
  it('finds none when every token that needs a note has one', () => {
    expect(noteProblems(withNotes(notes))).toEqual([]);
  });

  it('names a token with no note, including a style in type and a colour in map', () => {
    expect(
      noteProblems(
        withNotes(without('colour.focus', 'map.coastline.colour', 'type.body'))
      )
    ).toEqual([
      'colour.focus has no note',
      'map.coastline.colour has no note',
      'type.body has no note',
    ]);
  });

  it('names every token when there is no note', () => {
    expect(noteProblems(tokens)).toHaveLength(17);
    expect(noteProblems(tokens)).toContain('colour.brand has no note');
  });

  it('names an empty or blank note', () => {
    expect(
      noteProblems(
        withNotes({ ...notes, 'colour.brand': '', 'colour.focus': '  ' })
      )
    ).toEqual([
      'colour.brand has an empty note',
      'colour.focus has an empty note',
    ]);
  });

  it('names a note for a token that does not exist, and one below a type style', () => {
    expect(
      noteProblems(
        withNotes({
          ...notes,
          'colour.brnad': 'A typo.',
          'type.body.size': 'The size.',
        })
      )
    ).toEqual([
      'colour.brnad: a note where none is needed',
      'type.body.size: a note where none is needed',
    ]);
  });

  it('names a note on a token that stays out of the design system', () => {
    expect(
      noteProblems(
        withNotes({
          ...notes,
          'map.coastline.width': 'Line width.',
          'map.hillshade.exaggeration': 'Relief.',
          'map.pin.halo-width': 'Halo width.',
          'motion.press': 'Press.',
        })
      )
    ).toEqual([
      'map.coastline.width: a note where none is needed',
      'map.hillshade.exaggeration: a note where none is needed',
      'map.pin.halo-width: a note where none is needed',
      'motion.press: a note where none is needed',
    ]);
  });

  it('names a layout, breakpoint or z token with no note', () => {
    expect(
      noteProblems(
        withNotes(
          without('breakpoint.phone-width', 'layout.dock-left', 'z.dock')
        )
      )
    ).toEqual([
      'breakpoint.phone-width has no note',
      'layout.dock-left has no note',
      'z.dock has no note',
    ]);
  });

  it('names a note that repeats its token’s value, ignoring case', () => {
    expect(
      noteProblems(
        withNotes({
          ...notes,
          'colour.brand': 'The green #264F29.',
          'focus.width': 'A 2px outline.',
        })
      )
    ).toEqual([
      'colour.brand: its note repeats the value',
      'focus.width: its note repeats the value',
    ]);
  });

  it('lists a missing note before the problems found in the notes', () => {
    expect(
      noteProblems(
        withNotes({ ...without('colour.brand'), 'colour.stray': 'x' })
      )
    ).toEqual([
      'colour.brand has no note',
      'colour.stray: a note where none is needed',
    ]);
  });
});
