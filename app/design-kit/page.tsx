import type { CSSProperties } from 'react';

import { TextLink } from '@ks/app/components/actions/TextLink';
import { Text } from '@ks/app/components/foundation/Text';
import { BOARDS } from '@ks/app/design-kit/boards';
import { requireSession } from '@ks/server/auth/current.mts';

import styles from '@ks/app/design-kit/page.module.css';

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

const Page = async () => {
  await requireSession();

  return <DesignKitIndex />;
};

export default Page;
