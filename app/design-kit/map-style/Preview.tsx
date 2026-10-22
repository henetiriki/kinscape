import type { CSSProperties } from 'react';

import { resolveTokens } from '@/lib/design/tokens.mts';

import type { PreviewKind } from './layers';

import rawTokens from '../../../design/tokens.json';
import { type Label, labelStyle } from '../mapLabels';
import styles from './Preview.module.css';

const { map } = resolveTokens(rawTokens);

type Vars = CSSProperties & Record<`--${string}`, number | string>;

const GLYPHS = ['●', '■', '◆', '✚'];

const text = (label: Label) => ({
  ...labelStyle(label),
  textShadow: `0 0 ${map['label-halo'].width}px ${map['label-halo'].colour}`,
});

const line = (colour: string, width: number, dash = false): Vars => ({
  '--line': colour,
  '--line-style': dash ? 'dashed' : 'solid',
  '--line-width': `${width}px`,
});

const base = (background: string): Vars => ({ '--fill': background });

const vars = (values: Vars): Vars => values;

/** A layer drawn in CSS from the `map` tokens, as small as the board's "Looks like" column. */
export const Preview = ({ kind }: { kind: PreviewKind }) => {
  switch (kind) {
    case 'background':
      return <span className={styles.box} style={base(map.sea)} />;
    case 'cluster':
      return (
        <span className={styles.box} style={base(map.land)}>
          <span
            className={styles.cluster}
            style={{
              background: map.pin.colour,
              border: `2px solid ${map.pin.halo}`,
            }}>
            3
          </span>
        </span>
      );
    case 'coastline':
      return (
        <span
          className={`${styles.box} ${styles.coast}`}
          style={vars({
            ...base(map.sea),
            ...line(map.coastline.colour, map.coastline.width),
            '--land': map.land,
          })}
        />
      );
    case 'contested':
      return (
        <span
          className={`${styles.box} ${styles.hatch}`}
          style={vars({
            ...base(map.polity.default),
            '--hatch': map.hatch.colour,
            '--hatch-opacity': map.hatch.opacity,
          })}
        />
      );
    case 'district':
      return (
        <span
          className={`${styles.box} ${styles.stroke}`}
          style={{
            ...base(map.land),
            ...line(map.district.colour, map.district.width),
          }}
        />
      );
    case 'glyphs':
      return (
        <span
          className={styles.box}
          style={{ ...base(map.land), color: map.pin.colour, gap: 6 }}>
          {GLYPHS.map(glyph => (
            <span aria-hidden key={glyph}>
              {glyph}
            </span>
          ))}
        </span>
      );
    case 'halo':
      return (
        <span className={styles.box} style={base(map.land)}>
          <span
            className={styles.blur}
            style={{
              background: map['pin-halo'].colour,
              filter: `blur(${map['pin-halo'].blur * 4}px)`,
              opacity: map['pin-halo'].opacity * 2,
            }}
          />
        </span>
      );
    case 'hillshade':
      return (
        <span
          className={`${styles.box} ${styles.hillshade}`}
          style={vars({
            '--fill': map.land,
            '--highlight': map.hillshade.highlight,
            '--mid': map.hillshade.mid,
            '--shadow': map.hillshade.shadow,
          })}
        />
      );
    case 'land':
      return <span className={styles.box} style={base(map.land)} />;
    case 'line':
      return (
        <span
          className={`${styles.box} ${styles.stroke}`}
          style={{
            ...base(map.land),
            ...line(map.border.colour, map.border.width),
          }}
        />
      );
    case 'line-approx':
      return (
        <span
          className={`${styles.box} ${styles.stroke}`}
          style={{
            ...base(map.land),
            ...line(map.border.colour, map.border.width, true),
          }}
        />
      );
    case 'line-changed':
      return (
        <span
          className={`${styles.box} ${styles.stroke}`}
          style={{
            ...base(map.land),
            ...line(map.changed.colour, map.changed.width),
          }}
        />
      );
    case 'place-dot':
      return (
        <span className={styles.box} style={base(map.land)}>
          <span
            className={styles.dot}
            style={{
              background: map['place-dot'].colour,
              border: `${map['place-dot']['stroke-width']}px solid ${map['place-dot'].stroke}`,
              height: map['place-dot'].radius * 2,
              width: map['place-dot'].radius * 2,
            }}
          />
        </span>
      );
    case 'place-label':
      return (
        <span className={styles.box} style={base(map.land)}>
          <span style={text({ key: 'place-label', weight: 500 })}>
            Kimberley
          </span>
        </span>
      );
    case 'polity':
      return (
        <span
          className={styles.box}
          style={{ ...base(map.polity['free-state']), opacity: 0.6 }}
        />
      );
    case 'polity-label':
      return (
        <span className={styles.box} style={base(map.polity['free-state'])}>
          <span style={text({ caps: true, key: 'polity-label', weight: 600 })}>
            NATAL
          </span>
        </span>
      );
    case 'ring':
      return (
        <span className={styles.box} style={base(map.land)}>
          <span
            className={styles.ring}
            style={{
              border: `${map.selected.width}px solid ${map.selected.colour}`,
              height: map.selected.radius * 2,
              width: map.selected.radius * 2,
            }}
          />
        </span>
      );
    case 'river':
      return (
        <span
          className={`${styles.box} ${styles.stroke}`}
          style={{
            ...base(map.land),
            ...line(map.river.colour, map.river['width-max'] - 1),
          }}
        />
      );
    case 'river-label':
      return (
        <span className={styles.box} style={base(map.land)}>
          <span style={text({ italic: true, key: 'river-label', weight: 400 })}>
            Vaal
          </span>
        </span>
      );
    case 'water-label':
      return (
        <span className={styles.box} style={base(map.sea)}>
          <span
            style={text({
              caps: true,
              italic: true,
              key: 'water-label',
              weight: 400,
            })}>
            OCEAN
          </span>
        </span>
      );
  }
};
