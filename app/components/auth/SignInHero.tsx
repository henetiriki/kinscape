import type { CSSProperties } from 'react';

import { useId } from 'react';

import { BORDERS, LAND, RIVERS } from '@ks/app/components/auth/signInHeroPaths';
import { Text } from '@ks/app/components/foundation/Text';
import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';

import styles from '@ks/app/components/auth/SignInHero.module.css';

const { colour, map } = resolveTokens(rawTokens);

/** The drawing's values, as the map draws them; the hero follows `map.*` in `tokens.json`. */
export const HERO_VARS = {
  '--hero-border': map.border.colour,
  '--hero-border-width': `${map.border.width}px`,
  '--hero-dash': `${map.border['dash-on']} ${map.border['dash-off']}`,
  '--hero-halo': map['pin-halo'].colour,
  '--hero-halo-opacity': map['pin-halo'].opacity,
  '--hero-ink': colour.ink,
  '--hero-label-halo': map['label-halo'].colour,
  '--hero-land': map.land,
  '--hero-muted': map['muted-label'],
  '--hero-pin': map.pin.colour,
  '--hero-pin-stroke': map.pin.halo,
  '--hero-pin-stroke-width': `${map.pin['halo-width']}px`,
  '--hero-river': map.river.colour,
  '--hero-river-width': `${map.river['width-min']}px`,
} as CSSProperties;

const Lines = ({ d }: { d: string[] }) =>
  d.map(path => <path d={path} key={path} />);

/**
 * The sign-in hero: an illustrated map, the headline, tagline and a caption saying how borders are drawn.
 * The illustration is decoration and loads nothing; each line in the caption is drawn as well as coloured (NFR-06).
 * Two drawings share the path data: the wide one with a label, the phone crop without (the `@media` block shows one).
 */
export const SignInHero = () => {
  const id = useId();
  const clip = `${id}-land`;
  const shade = `${id}-shade`;
  const halo = `${id}-halo`;

  return (
    <div className={styles.hero} style={HERO_VARS}>
      <svg
        aria-hidden='true'
        className={`${styles.art} ${styles.wide}`}
        data-art='wide'
        preserveAspectRatio='xMidYMid meet'
        viewBox='180 40 1000 880'>
        <defs>
          <clipPath id={clip}>
            <path d={LAND} />
          </clipPath>
          <filter height='100%' id={shade} width='100%' x='0' y='0'>
            <feTurbulence
              baseFrequency='0.011'
              numOctaves='5'
              seed='11'
              type='fractalNoise'
            />
            <feDiffuseLighting
              diffuseConstant='1.1'
              lightingColor={colour.white}
              surfaceScale='4'>
              <feDistantLight azimuth='315' elevation='38' />
            </feDiffuseLighting>
          </filter>
          <filter height='200%' id={halo} width='200%' x='-50%' y='-50%'>
            <feGaussianBlur stdDeviation='7' />
          </filter>
        </defs>
        <path className={styles.land} d={LAND} />
        <g clipPath={`url(#${clip})`}>
          <rect
            className={styles.shade}
            filter={`url(#${shade})`}
            height='1000'
            width='1300'
            x='0'
            y='-100'
          />
        </g>
        <g className={styles.rivers}>
          <Lines d={[...RIVERS.both, ...RIVERS.wide]} />
        </g>
        <g className={styles.borders}>
          <Lines d={[...BORDERS.wide, ...BORDERS.both]} />
          <path className={styles.dashed} d={BORDERS.approximate} />
        </g>
        <circle
          className={styles.halo}
          cx='640'
          cy='693'
          filter={`url(#${halo})`}
          r='30'
        />
        <rect
          className={styles.pin}
          height='14'
          rx='2'
          width='14'
          x='633'
          y='686'
        />
        <text className={styles.place} x='656' y='690'>
          Farm Rietfontein
        </text>
        <text className={styles.dates} x='656' y='707'>
          FROM 1872 TO 1910
        </text>
      </svg>
      <svg
        aria-hidden='true'
        className={`${styles.art} ${styles.phone}`}
        data-art='phone'
        preserveAspectRatio='xMidYMid slice'
        viewBox='200 90 960 790'>
        <path className={styles.land} d={LAND} />
        <g className={styles.rivers}>
          <Lines d={RIVERS.both} />
        </g>
        <g className={styles.borders}>
          <Lines d={BORDERS.both} />
        </g>
        <rect
          className={styles.pin}
          height='18'
          rx='2.5'
          width='18'
          x='631'
          y='684'
        />
      </svg>
      <div className={styles.copy}>
        <Text as='h2' variant='display'>
          Borders move.
          <br />
          Places don&apos;t.
        </Text>
        <Text variant='bodyL'>
          South Africa as it was on any date from 1652 to today, with your
          family where they were.
        </Text>
      </div>
      <div className={styles.caption}>
        <span aria-hidden='true' className={styles.key} />
        <Text variant='mono'>Map date 1901-01-01 · borders as recorded</Text>
        <span aria-hidden='true' className={`${styles.key} ${styles.dash}`} />
        <Text variant='mono'>approximate</Text>
      </div>
    </div>
  );
};
