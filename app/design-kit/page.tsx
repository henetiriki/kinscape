import type { CSSProperties } from 'react';

import { Text } from '@/app/components/Text';
import { TextLink } from '@/app/components/TextLink';

import { BOARDS } from './boards';
import styles from './page.module.css';

const DesignKitIndex = () => (
  <main className={styles.index}>
    <Text as='h1' variant='h1'>
      Boards
    </Text>
    <ul
      className={styles.boards}
      style={{ '--rows': Math.ceil(BOARDS.length / 2) } as CSSProperties}>
      {BOARDS.map(({ eyebrow, line, slug, title }) => (
        <li className={styles.board} key={slug}>
          <Text variant='overline'>{eyebrow}</Text>
          <TextLink href={`/design-kit/${slug}`}>{title}</TextLink>
          <Text variant='body'>{line}</Text>
        </li>
      ))}
    </ul>
  </main>
);

export default DesignKitIndex;
