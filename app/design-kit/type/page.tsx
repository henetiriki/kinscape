import type { Metadata } from 'next';

import type { TextVariant } from '@/app/components/Text';

import { Text } from '@/app/components/Text';
import { resolveTokens } from '@/lib/design/tokens.mts';

import rawTokens from '../../../design/tokens.json';
import { boardTitle } from '../boards';
import kit from '../kit.module.css';
import { type Label, labelStyle } from '../mapLabels';
import styles from './page.module.css';

export const metadata: Metadata = { title: boardTitle('type') };

type Heading = 'display' | 'h1' | 'h2' | 'h3';

type Row = {
  hint: string;
  name: string;
  sample: string;
  spec: string;
} & (
  | { tag: 'div' | 'h1' | 'h2' | 'h3'; variant: Heading }
  | { tag?: undefined; variant: Exclude<TextVariant, Heading> }
);

const STYLES: Row[] = [
  {
    hint: 'Sign-in headline',
    name: 'Display',
    sample: "Borders move. Places don't.",
    spec: 'Bricolage 52 / 56 · 700 · −0.02em',
    tag: 'div',
    variant: 'display',
  },
  {
    hint: 'Page title',
    name: 'H1',
    sample: 'Sign in',
    spec: 'Bricolage 32 / 40 · 500 · −0.015em',
    tag: 'h1',
    variant: 'h1',
  },
  {
    hint: 'Dialog, section',
    name: 'H2',
    sample: 'Sources and attributions',
    spec: 'Bricolage 24 / 32 · 700',
    tag: 'h2',
    variant: 'h2',
  },
  {
    hint: 'Place, card title',
    name: 'H3',
    sample: 'Kimberley',
    spec: 'Bricolage 22 / 28 · 700',
    tag: 'h3',
    variant: 'h3',
  },
  {
    hint: 'Notice, row title',
    name: 'Title',
    sample: 'No pins in 1901',
    spec: 'Public Sans 15 / 22 · 600',
    variant: 'title',
  },
  {
    hint: 'Sign-in, fields',
    name: 'Body L',
    sample: 'Your tree is private. Sign in to open the map.',
    spec: 'Public Sans 16 / 24 · 400',
    variant: 'bodyL',
  },
  {
    hint: 'Panels, popups',
    name: 'Body',
    sample: 'Nobody in your filters is pinned to this date.',
    spec: 'Public Sans 15 / 22 · 400',
    variant: 'body',
  },
  {
    hint: 'Field labels, rows',
    name: 'Label',
    sample: 'Place names',
    spec: 'Public Sans 14 / 20 · 600',
    variant: 'label',
  },
  {
    hint: 'Helper text',
    name: 'Small',
    sample: 'As they were on the map date',
    spec: 'Public Sans 13 / 20 · 400 · ink-3',
    variant: 'small',
  },
  {
    hint: 'Credits, footnotes',
    name: 'Caption',
    sample: 'Last backup: today, 02:00',
    spec: 'Public Sans 12.5 / 18 · 400 · ink-3',
    variant: 'caption',
  },
  {
    hint: 'Section heading',
    name: 'Overline',
    sample: 'On this spot in 1901',
    spec: 'Public Sans 11 / 16 · 600 · 0.1em · CAPS',
    variant: 'overline',
  },
  {
    hint: 'Button labels',
    name: 'Button',
    sample: 'Continue with Google',
    spec: 'Public Sans 16 or 14 · 600',
    variant: 'button',
  },
  {
    hint: 'Map date field',
    name: 'Mono L',
    sample: '1901-06-14',
    spec: 'JetBrains Mono 22 / 28 · 500',
    variant: 'monoL',
  },
  {
    hint: 'Dates, coordinates',
    name: 'Mono',
    sample: '28.738° S · 24.764° E · 1901-03-14',
    spec: 'JetBrains Mono 12 / 16 · 400',
    variant: 'mono',
  },
];

const { map } = resolveTokens(rawTokens);

type Sample = { name: string; sample: string } & Label;

const LABELS: Sample[] = [
  {
    caps: true,
    key: 'polity-label',
    name: 'Polity',
    sample: 'ORANGE FREE STATE',
    weight: 600,
  },
  {
    italic: true,
    key: 'contested-label',
    name: 'contested note',
    sample: 'contested · Orange River Colony',
    weight: 400,
  },
  { key: 'place-label', name: 'place', sample: 'Kimberley', weight: 500 },
  {
    italic: true,
    key: 'river-label',
    name: 'river',
    sample: 'Vaal',
    weight: 400,
  },
  {
    caps: true,
    italic: true,
    key: 'context-label',
    name: 'context',
    sample: 'BECHUANALAND PROTECTORATE',
    weight: 400,
  },
  {
    caps: true,
    italic: true,
    key: 'water-label',
    name: 'water',
    sample: 'INDIAN OCEAN',
    weight: 400,
  },
];

const labelNote = ({ caps, italic, key, name, weight }: Sample) => {
  const token = map[key];
  const tracking = 'tracking' in token ? `, tracking ${token.tracking}em` : '';
  const style = [
    weight === 400 ? '' : ` / ${weight}`,
    italic ? ' italic' : '',
    caps ? ' uppercase' : '',
  ].join('');

  return `${name} ${token.size}${style}${tracking}`;
};

const NOTE = `${LABELS.map(labelNote).join(' · ')}. All with a ${map['label-halo'].width}px land-coloured halo.`;

const TypeKit = () => (
  <main className={styles.kit}>
    <header className={kit.kitHeader}>
      <span className={kit.kitEyebrow}>Style guide · 01</span>
      <p className={kit.kitTitle}>Typography and hierarchy</p>
      <p className={kit.kitLead}>
        Three families, each with one job. Bricolage Grotesque for headings,
        Public Sans for everything you read or click, JetBrains Mono for dates
        and coordinates.
      </p>
    </header>

    <div aria-label='Type scale' className={styles.scale} role='table'>
      <div className={`${styles.row} ${styles.columns}`} role='row'>
        <span role='columnheader'>Style</span>
        <span role='columnheader'>Font · size / line · weight</span>
        <span role='columnheader'>Sample</span>
      </div>
      {STYLES.map(row => (
        <div className={styles.row} key={row.variant} role='row'>
          <span className={styles.name} role='cell'>
            <span>{row.name}</span>
            <span className={styles.hint}>{row.hint}</span>
          </span>
          <span className={styles.spec} role='cell'>
            {row.spec}
          </span>
          <span role='cell'>
            {/* Display is a div and the header title a paragraph, so the H1 sample is the only h1. */}
            {row.tag ? (
              <Text
                as={row.tag}
                data-variant={row.variant}
                variant={row.variant}>
                {row.sample}
              </Text>
            ) : (
              <Text as='div' data-variant={row.variant} variant={row.variant}>
                {row.sample}
              </Text>
            )}
          </span>
        </div>
      ))}
    </div>

    <div className={kit.kitNotes}>
      <section>
        <h2>Map labels</h2>
        <div className={styles.mapLabels} style={{ background: map.land }}>
          <div className={styles.polity}>
            {LABELS.slice(0, 2).map(label => (
              <span key={label.key} style={labelStyle(label)}>
                {label.sample}
              </span>
            ))}
          </div>
          {LABELS.slice(2, 5).map(label => (
            <span key={label.key} style={labelStyle(label)}>
              {label.sample}
            </span>
          ))}
          <span
            className={styles.chip}
            style={{ ...labelStyle(LABELS[5]), background: map.sea }}>
            {LABELS[5].sample}
          </span>
        </div>
        <p className={styles.note}>{NOTE}</p>
      </section>
      <section>
        <h2>Rules</h2>
        <ul>
          <li>
            Line height: 1.1–1.25 for headings, 1.45–1.55 for anything you read
            in sentences, 1.3–1.4 for single-line UI text.
          </li>
          <li>Keep running text under 68 characters a line.</li>
          <li>
            Weights: Public Sans 400, 500 and 600 only. Bricolage 500 for page
            titles, 700 for everything else. No other weights.
          </li>
          <li>Never set body text below 12.5px, or map labels below 11px.</li>
          <li>
            Sentence case everywhere. Uppercase only for overlines and polity or
            context labels, always with letter-spacing.
          </li>
          <li>
            JetBrains Mono for anything a person compares digit by digit: dates,
            coordinates, archive references. Ligatures off.
          </li>
          <li>
            Field text is 16px on phones so the browser doesn&apos;t zoom in.
          </li>
        </ul>
      </section>
    </div>
  </main>
);

export default TypeKit;
