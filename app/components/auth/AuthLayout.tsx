import type { CSSProperties, ReactNode } from 'react';

import rawTokens from '@/design/tokens.json';
import { resolveTokens } from '@/lib/design/tokens.mts';

import styles from './AuthLayout.module.css';
import { Wordmark } from '@/app/components/map/Wordmark';

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
