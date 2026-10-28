import type { CSSProperties, ReactNode } from 'react';

import { Wordmark } from '@ks/app/components/map/Wordmark';
import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';

import styles from '@ks/app/components/auth/AuthLayout.module.css';

const { map } = resolveTokens(rawTokens);

const SEA = { '--auth-sea': map.sea } as CSSProperties;

/**
 * The sign-in page's two halves: `hero` left and `children` right, stacked on a phone.
 * It draws the wordmark (44 over the form, 36 over the hero on a phone) and holds no form logic.
 */
export const AuthLayout = ({
  children,
  hero,
}: {
  children: ReactNode;
  hero: ReactNode;
}) => (
  <div className={styles.layout} style={SEA}>
    <div className={styles.hero} data-slot='hero'>
      {hero}
      <div className={styles.phoneMark}>
        <Wordmark size={36} />
      </div>
    </div>
    <div className={styles.pane} data-slot='form'>
      <div className={styles.form}>
        <div className={styles.deskMark}>
          <Wordmark size={44} />
        </div>
        {children}
      </div>
    </div>
  </div>
);
