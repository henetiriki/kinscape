import { describe, expect, it } from 'vitest';

import { noteProblems } from '@ks/lib/design/notes.mts';

const tokens = {
  colour: { brand: '#264f29', focus: '{colour.brand}', white: '#ffffff' },
  focus: { width: '2px' },
  font: { body: "'Public Sans', system-ui, sans-serif" },
  layout: { 'dock-left': '368px' },
  map: {
    coastline: { colour: '#7e9a98', width: 0.9 },
    hillshade: { exaggeration: 0.3, shadow: '#5b6355' },
    land: '#e9ebe2',
    pin: { halo: '{colour.white}', 'halo-width': 2 },
  },
  motion: { press: '120ms ease-out' },
  radius: { panel: '12px' },
  scalar: 'ignored',
  shadow: { raised: '0 1px 2px rgb(0 0 0 / 0.1)' },
  size: { touch: '44px' },
  space: { '4': '4px' },
  type: { body: { font: '{font.body}', size: '15px' } },
};

const notes = {
  colour: {
    brand: 'Primary buttons.',
    focus: 'Focus outline.',
    white: 'Text on dark.',
  },
  focus: { width: 'Outline thickness.' },
  font: { body: 'All UI text.' },
  map: {
    coastline: { colour: 'Coast line.' },
    hillshade: { shadow: 'Shaded slopes.' },
    land: 'Land fill.',
    pin: { halo: 'Ring round a Pin.' },
  },
  radius: { panel: 'Panels and the dock.' },
  shadow: { raised: 'Panels.' },
  size: { touch: 'Smallest target.' },
  space: { '4': 'The smallest step.' },
  type: { body: 'Panels and popups.' },
};

describe('noteProblems', () => {
  it('finds none when every token that needs a note has one', () => {
    expect(noteProblems({ ...tokens, notes })).toEqual([]);
  });

  it('names a token with no note, including a style in type and a colour in map', () => {
    expect(
      noteProblems({
        ...tokens,
        notes: {
          ...notes,
          colour: { brand: notes.colour.brand, white: notes.colour.white },
          map: { ...notes.map, coastline: {} },
          type: {},
        },
      })
    ).toEqual([
      'colour.focus has no note',
      'map.coastline.colour has no note',
      'type.body has no note',
    ]);
  });

  it('names every token when there is no notes group', () => {
    expect(noteProblems(tokens)).toHaveLength(14);
    expect(noteProblems(tokens)).toContain('colour.brand has no note');
  });

  it('names an empty or blank note, and a note that is not text', () => {
    expect(
      noteProblems({
        ...tokens,
        notes: {
          ...notes,
          colour: { brand: '', focus: '  ', white: notes.colour.white },
          font: { body: 3 },
        },
      })
    ).toEqual([
      'colour.brand has an empty note',
      'colour.focus has an empty note',
      'font.body has no note',
    ]);
  });

  it('names a note for a token that does not exist, and one below a type style', () => {
    expect(
      noteProblems({
        ...tokens,
        notes: {
          ...notes,
          colour: { ...notes.colour, brnad: 'A typo.' },
          type: { body: { size: 'The size.' } },
        },
      })
    ).toEqual([
      'type.body has no note',
      'notes.colour.brnad names no token that needs a note',
      'notes.type.body.size names no token that needs a note',
    ]);
  });

  it('names a note on a token that stays out of the design system', () => {
    expect(
      noteProblems({
        ...tokens,
        notes: {
          ...notes,
          layout: { 'dock-left': 'Left of the gutter.' },
          map: {
            ...notes.map,
            coastline: { ...notes.map.coastline, width: 'Line width.' },
            hillshade: { ...notes.map.hillshade, exaggeration: 'Relief.' },
            pin: { ...notes.map.pin, 'halo-width': 'Halo width.' },
          },
          motion: { press: 'Press.' },
        },
      })
    ).toEqual([
      'notes.map.coastline.width names no token that needs a note',
      'notes.map.hillshade.exaggeration names no token that needs a note',
      'notes.map.pin.halo-width names no token that needs a note',
      'notes.layout.dock-left names no token that needs a note',
      'notes.motion.press names no token that needs a note',
    ]);
  });

  it('names a note that repeats its token’s value, ignoring case', () => {
    expect(
      noteProblems({
        ...tokens,
        notes: {
          ...notes,
          colour: { ...notes.colour, brand: 'The green #264F29.' },
          focus: { width: 'A 2px outline.' },
        },
      })
    ).toEqual([
      'colour.brand: its note repeats the value',
      'focus.width: its note repeats the value',
    ]);
  });

  it('lists a missing note before the problems found in the notes', () => {
    expect(
      noteProblems({
        ...tokens,
        notes: { ...notes, colour: { stray: 'x' } },
      })
    ).toEqual([
      'colour.brand has no note',
      'colour.focus has no note',
      'colour.white has no note',
      'notes.colour.stray names no token that needs a note',
    ]);
  });
});
