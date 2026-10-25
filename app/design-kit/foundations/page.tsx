import type { Metadata } from 'next';

import { Icon } from '@/app/components/foundation/Icon';
import { Text } from '@/app/components/foundation/Text';

import rawTokens from '../../../design/tokens.json';
import { boardTitle } from '../boards';
import kit from '../kit.module.css';
import styles from './page.module.css';
import {
  ICONS,
  MAP_DATE_CHANGE,
  MOTION,
  RADII,
  SHADOWS,
  SPACE,
} from './values';

export const metadata: Metadata = { title: boardTitle('foundations') };

// Bars, radii and shadows draw from CSS variables; the Elevation backdrop is the map's sea, which has none.
const { map, motion, radius, shadow, space } = rawTokens;

const FoundationsKit = () => (
  <main className={styles.kit}>
    <header className={kit.kitHeader}>
      <span className={kit.kitEyebrow}>Style guide · 03</span>
      <h1 className={kit.kitTitle}>Spacing, shape, depth, icons, motion</h1>
      <p className={kit.kitLead}>
        The small set of values every screen is built from.
      </p>
    </header>

    <div className={styles.columns}>
      <section aria-label='Spacing' className={styles.section}>
        <Text as='h2' variant='h3'>
          Spacing
        </Text>
        <Text variant='small'>
          A 4px base. Use these steps and nothing in between.
        </Text>
        <div className={styles.spaceRows}>
          {SPACE.map(({ step, use }) => (
            <div className={styles.spaceRow} key={step}>
              <Text variant='mono'>{space[step]}</Text>
              <span
                className={styles.bar}
                style={{ width: `calc(var(--space-${step}) * 4)` }}
              />
              <Text variant='caption'>{use}</Text>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.stack}>
        <section aria-label='Corner radius' className={styles.section}>
          <Text as='h2' variant='h3'>
            Corner radius
          </Text>
          <div className={styles.radii}>
            {RADII.map(({ name, use }) => (
              <div className={styles.radius} key={name}>
                <span
                  className={styles.box}
                  style={{ borderRadius: `var(--radius-${name})` }}
                />
                <Text variant='mono'>
                  {name === 'full' ? name : radius[name]}
                </Text>
                <Text variant='caption'>{use}</Text>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-label='Elevation'
          className={`${styles.section} ${styles.elevation}`}>
          <Text as='h2' variant='h3'>
            Elevation
          </Text>
          <div className={styles.sea} style={{ background: map.sea }}>
            {SHADOWS.map(({ name, title, use }) => (
              <div
                className={styles.card}
                key={name}
                style={{ boxShadow: `var(--shadow-${name})` }}>
                <Text variant='label'>{title}</Text>
                <Text variant='caption'>{use}</Text>
                <Text variant='mono'>{shadow[name]}</Text>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>

    <div className={styles.columns}>
      <section aria-label='Icons' className={styles.section}>
        <Text as='h2' variant='h3'>
          Icons
        </Text>
        <Text variant='small'>
          Outline icons on a 24px grid, 2px stroke for every icon, round caps
          and joins, drawn in currentColor. Shown at 16, 18 or 20px (24 on the
          phone layers button). Always{' '}
          <code className={styles.code}>aria-hidden</code>; an icon-only button
          carries the name, such as &quot;Zoom out&quot;, &quot;Show
          password&quot;, &quot;Hide password&quot; or &quot;Sign out&quot;.
        </Text>
        <div className={styles.icons}>
          {ICONS.map(({ label, name }) => (
            <div className={styles.tile} key={name}>
              <Icon name={name} size={24} />
              <Text variant='caption'>{label}</Text>
            </div>
          ))}
        </div>
      </section>

      <section aria-label='Motion' className={styles.section}>
        <Text as='h2' variant='h3'>
          Motion
        </Text>
        <div className={styles.motion}>
          {[
            ...MOTION.map(({ name, title, use }) => ({
              title,
              use,
              value: motion[name],
            })),
            MAP_DATE_CHANGE,
          ].map(({ title, use, value }) => (
            <div className={styles.motionRow} key={title}>
              <Text variant='label'>{title}</Text>
              <Text variant='mono'>{value}</Text>
              <Text variant='small'>{use}</Text>
            </div>
          ))}
        </div>
        <Text variant='small'>
          With prefers-reduced-motion, drop every transition except colour
          changes, and make Play step without easing.
        </Text>
      </section>
    </div>
  </main>
);

export default FoundationsKit;
