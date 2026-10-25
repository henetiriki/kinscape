import { Text } from '@/app/components/foundation/Text';

import styles from './Wordmark.module.css';

const NAME = { 32: 'h3', 36: 'h3', 44: 'h2' } as const;

/**
 * The icon and "KinScape" in Bricolage 700; `iconOnly` drops the name and names the icon instead.
 * Beside the name the icon is decoration. It is not a link.
 */
export const Wordmark = ({
  iconOnly,
  size = 44,
}: {
  iconOnly?: boolean;
  size?: keyof typeof NAME;
}) => (
  <span className={styles.wordmark}>
    {/* eslint-disable-next-line @next/next/no-img-element -- a 32 to 44px SVG: nothing for next/image to resize */}
    <img
      alt={iconOnly ? 'KinScape' : ''}
      className={styles.icon}
      height={size}
      src='/icon0.svg'
      style={{ borderRadius: size / 4 }}
      width={size}
    />
    {!iconOnly && (
      <Text as='span' variant={NAME[size]}>
        KinScape
      </Text>
    )}
  </span>
);
