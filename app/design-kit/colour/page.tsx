import type { Metadata } from 'next';

import { Alert } from '@/app/components/feedback/Alert';
import { resolveTokens } from '@/lib/design/tokens.mts';

import rawTokens from '../../../design/tokens.json';
import { boardTitle } from '../boards';
import kit from '../kit.module.css';
import { describe, nameOf, valueAt } from './describe';
import styles from './page.module.css';
import { GROUPS, SYSTEM } from './swatches';

export const metadata: Metadata = { title: boardTitle('colour') };

// Map tokens have no CSS variable, and the board shows hex and ratios, so it reads the tokens itself.
const tokens = resolveTokens(rawTokens);

// White chips have no edge on a white card, so they get a line like the focus ring chip.
const EDGED = new Set([
  'colour.focus-ring-on-dark',
  'colour.surface',
  'colour.white',
]);

const opacity = `${Math.round(tokens.map.hatch.opacity * 100)}%`;

const ColourKit = () => (
  <main className={styles.kit}>
    <header className={kit.kitHeader}>
      <span className={kit.kitEyebrow}>Style guide · 02</span>
      <h1 className={kit.kitTitle}>Colour</h1>
      <p className={kit.kitLead}>
        Forest green carries the brand and every interactive thing. Burnt sienna
        is only for pins. Ratios are WCAG contrast, measured on white unless
        noted: 4.5 for text, 3 for borders, icons and focus rings. Each name is
        the token you type.
      </p>
    </header>

    {GROUPS.map(({ note, swatches, title }) => (
      <section aria-label={title} className={styles.group} key={title}>
        <div className={styles.heading}>
          <h2 className={styles.h2}>{title}</h2>
          <span className={styles.note}>{note}</span>
        </div>
        <div className={styles.swatches}>
          {swatches.map(({ on, path, role, use }) => (
            <div className={styles.swatch} key={path}>
              <div
                className={`${styles.chip} ${EDGED.has(path) ? styles.edge : ''} ${path === 'colour.focus-ring-on-dark' ? styles.ring : ''}`}
                style={{ background: valueAt(tokens, path) }}
              />
              <div className={styles.text}>
                <code className={styles.name}>{nameOf(path)}</code>
                <span className={styles.value}>
                  {describe(tokens, path, role, on)}
                </span>
                <span className={styles.use}>
                  {use.replace('{opacity}', opacity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    ))}

    <section aria-label='System colours' className={styles.group}>
      <div className={styles.heading}>
        <h2 className={styles.h2}>System colours</h2>
        <span className={styles.note}>
          Each comes as text, border-and-icon, and background. Always paired
          with an icon and words.
        </span>
      </div>
      <div className={styles.system}>
        {SYSTEM.map(({ lines, text, title, tone }) => (
          <div className={styles.tone} key={tone}>
            <Alert title={title} tone={tone}>
              {text}
            </Alert>
            <div className={styles.lines}>
              {lines.map(({ on, path, role, use }) => (
                <span key={path}>
                  {nameOf(path)} {describe(tokens, path, role, on)}
                  {use === undefined ? '' : ` · ${use}`}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>

    <p className={styles.footer}>
      The other map colours (sea, land, polity tints, rivers) are on the Map
      style board. They&apos;re MapLibre paint values under map in tokens.json,
      not custom properties.
    </p>
  </main>
);

export default ColourKit;
