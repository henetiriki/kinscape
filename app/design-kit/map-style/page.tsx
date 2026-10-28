import type { Metadata } from 'next';

import { Text } from '@ks/app/components/foundation/Text';
import { boardTitle } from '@ks/app/design-kit/boards';
import { LAYERS, LEGEND } from '@ks/app/design-kit/map-style/layers';
import { Preview } from '@ks/app/design-kit/map-style/Preview';
import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';

import kit from '@ks/app/design-kit/kit.module.css';

import styles from '@ks/app/design-kit/map-style/page.module.css';

export const metadata: Metadata = { title: boardTitle('map-style') };

// The map's land is a map token, which has no CSS variable.
const { map } = resolveTokens(rawTokens);

const SAMPLE = `const onDate = ['all',
  ['<=', ['get', 'from'], d],
  ['>',  ['get', 'to'],   d]];
for (const id of DATED_LAYERS) map.setFilter(id, onDate);

// pins: range events by from/to, point events by a window
const pinsOn = ['all',
  ['<=', ['get', 'earliest'], d + win],
  ['>=', ['get', 'latest'],   d - win]];`;

const MapStyleKit = () => (
  <main className={styles.kit}>
    <div className={styles.intro}>
      <header className={kit.kitHeader}>
        <span className={kit.kitEyebrow}>Map style</span>
        <h1 className={kit.kitTitle}>MapLibre layer stack</h1>
        <p className={kit.kitLead}>
          Bottom to top. Everything drawn on the map is one of these layers. The
          panels, date dock, popup and zoom buttons are HTML on top of the map.
        </p>
      </header>
      <ul aria-label='Legend' className={styles.legend}>
        {LEGEND.map(({ colour, name }) => (
          <li key={name}>
            <span className={styles.swatch} style={{ background: colour }} />
            {name} {colour.toUpperCase()}
          </li>
        ))}
      </ul>
    </div>

    <div aria-label='Layer stack' className={styles.stack} role='table'>
      <div className={`${styles.row} ${styles.columns}`} role='row'>
        <span role='columnheader'>#</span>
        <span role='columnheader'>Looks like</span>
        <span role='columnheader'>Layer id</span>
        <span role='columnheader'>Type</span>
        <span role='columnheader'>Source / filter</span>
        <span role='columnheader'>Key properties</span>
        <span role='columnheader'>Covers</span>
      </div>
      {LAYERS.map(
        ({ covers, filter, id, preview, properties, type }, index) => (
          <div className={styles.row} key={id} role='row'>
            <span className={styles.number} role='cell'>
              {String(index + 1).padStart(2, '0')}
            </span>
            <span role='cell'>
              <Preview kind={preview} />
            </span>
            <span className={styles.id} role='cell'>
              {id}
            </span>
            <span role='cell'>
              <code className={styles.type}>{type}</code>
            </span>
            <span className={styles.field} role='cell'>
              <span aria-hidden='true' className={styles.label}>
                Source / filter
              </span>
              <span>{filter}</span>
            </span>
            <span
              className={`${styles.field} ${styles.properties}`}
              role='cell'>
              <span aria-hidden='true' className={styles.label}>
                Key properties
              </span>
              <span>{properties}</span>
            </span>
            <span className={`${styles.field} ${styles.covers}`} role='cell'>
              <span aria-hidden='true' className={styles.label}>
                Covers
              </span>
              <span>{covers.join(', ')}</span>
            </span>
          </div>
        )
      )}
    </div>

    <div className={`${kit.kitNotes} ${styles.notes}`}>
      <section>
        <h2>The date moves filters, not data</h2>
        <Text variant='body'>
          Every dated feature carries <code>from </code>and <code>to </code>as
          day numbers since 1652-01-01 (open = 999999). Moving the slider calls{' '}
          <code>setFilter </code>on each dated layer, so nothing is fetched
          while scrubbing (NFR-01).
        </Text>
        <pre className={styles.code} style={{ color: map.land }}>
          {SAMPLE}
        </pre>
      </section>
      <section>
        <h2>Kept to what MapLibre can draw</h2>
        <ul>
          <li>
            Flat polygon fills only. No shadows, glows or gradient fills on
            polygons.
          </li>
          <li>
            The contested hatch is a <code>fill-pattern </code>image added with{' '}
            <code>map.addImage </code>. Pattern colour is fixed in the image, so
            each hatch colour needs its own image.
          </li>
          <li>
            Halos are blurred circles ( <code>circle-blur </code>), because
            circle strokes can&apos;t be dashed.
          </li>
          <li>
            Labels use text halos, not background boxes. Contested names are one{' '}
            <code>format </code>expression: the name, then a smaller italic
            line.
          </li>
          <li>
            Pin glyphs are SDF icons, so <code>icon-color </code>and{' '}
            <code>icon-halo </code>restyle them. The shape shows the event type,
            so colour is never the only cue (NFR-06).
          </li>
          <li>
            Map text needs glyph PBFs: Public Sans Regular, SemiBold and Italic,
            built once and served from{' '}
            <code>/fonts/{'{fontstack}/{range}'}.pbf </code>.
          </li>
          <li>
            Popup: <code>maplibregl.Popup </code>with{' '}
            <code>className: &apos;ks-popup&apos; </code>and its own close
            button. Zoom and fit are a custom IControl.
          </li>
        </ul>
      </section>
    </div>
  </main>
);

export default MapStyleKit;
