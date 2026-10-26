import type { CSSProperties } from 'react';

import { resolveTokens } from '@/lib/design/tokens.mts';

import type { PreviewKind } from './types';

import rawTokens from '../../../design/tokens.json';
import styles from './Preview.module.css';

const { map } = resolveTokens(rawTokens);

const BORDER_ROW = 17;

/** Land with one horizontal stripe, `from` px down, `width` px thick. */
const stripe = (colour: string, from: number, width: number) =>
  `linear-gradient(to bottom, ${map.land} 0 ${from}px, ${colour} ${from}px ${from + width}px, ${map.land} ${from + width}px)`;

/** Round marks on land: the colour stops are `[colour, to]` pairs from the centre out. */
const target = (...stops: [string, number][]) => {
  let from = 0;
  const list = stops.map(([colour, to]) => {
    const stop = `${colour} ${from}px ${to}px`;

    from = to;

    return stop;
  });

  return `radial-gradient(circle, ${list.join(', ')}, ${map.land} ${from}px)`;
};

const label = (
  background: string,
  font: string,
  colour: string,
  letterSpacing: number
): CSSProperties => ({ background, color: colour, font, letterSpacing });

const PREVIEWS: Record<
  PreviewKind,
  { content?: string; style: CSSProperties }
> = {
  background: { style: { background: map.sea } },
  cluster: {
    content: '3',
    style: label(
      target([map.pin.colour, 12], [map.pin.halo, 14]),
      '600 12px var(--font-body)',
      map.pin.halo,
      0
    ),
  },
  coastline: {
    style: {
      background: `linear-gradient(to bottom, ${map.land} 0 50%, ${map.sea} 50%)`,
    },
  },
  contested: {
    style: {
      background: `repeating-linear-gradient(45deg, color-mix(in srgb, ${map.hatch.colour} ${map.hatch.opacity * 100}%, transparent) 0 3px, ${map.polity['free-state']} 3px 9px)`,
    },
  },
  district: { style: { background: stripe(map.district.colour, 17, 1) } },
  glyphs: {
    content: '●■◆✚',
    style: label(map.land, '16px var(--font-body)', map.pin.colour, 4),
  },
  halo: {
    style: {
      background: `radial-gradient(circle, color-mix(in srgb, ${map.pin.colour} 35%, transparent) 0, transparent 17px), ${map.land}`,
    },
  },
  hillshade: {
    style: {
      background: `radial-gradient(circle at 30% 30%, var(--surface-2), ${map.hillshade.mid})`,
    },
  },
  land: {
    style: { background: map.land, border: '1px solid var(--track)' },
  },
  line: {
    style: { background: stripe(map.border.colour, BORDER_ROW, 2) },
  },
  'line-approx': {
    style: {
      background: `repeating-linear-gradient(90deg, ${map.border.colour} 0 8px, transparent 8px 13px) 0 ${BORDER_ROW}px / 100% 2px no-repeat, ${map.land}`,
    },
  },
  'line-changed': {
    style: { background: stripe(map.changed.colour, 15, 5) },
  },
  'place-dot': {
    style: {
      background: target(
        [map['place-dot'].colour, 3.5],
        [map['place-dot'].stroke, 5]
      ),
    },
  },
  'place-label': {
    content: 'Kimberley',
    style: label(
      map.land,
      '500 12px var(--font-body)',
      map['place-label'].colour,
      0
    ),
  },
  polity: { style: { background: map.polity['western-cape'] } },
  'polity-label': {
    content: 'NATAL',
    style: label(
      map.polity['free-state'],
      '600 10px var(--font-body)',
      map['polity-label'].colour,
      1.2
    ),
  },
  ring: {
    style: {
      background: target(
        [map.land, 11],
        [map.selected.colour, 13.5],
        [map.pin.halo, 15]
      ),
    },
  },
  river: {
    style: {
      background: stripe(map.river.colour, 16, map.river['width-max']),
    },
  },
  'river-label': {
    content: 'Vaal',
    style: label(
      map.land,
      'italic 12px var(--font-body)',
      map['river-label'].colour,
      0
    ),
  },
  'water-label': {
    content: 'OCEAN',
    style: label(
      map.sea,
      'italic 11px var(--font-body)',
      map['water-label'].colour,
      1.5
    ),
  },
};

/** A layer drawn in CSS from the `map` tokens, as small as the board's "Looks like" column. */
export const Preview = ({ kind }: { kind: PreviewKind }) => {
  const { content, style } = PREVIEWS[kind];

  return (
    <span aria-hidden='true' className={styles.box} style={style}>
      {content}
    </span>
  );
};
