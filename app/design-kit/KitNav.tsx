'use client';

import { usePathname } from 'next/navigation';

import { TextLink } from '@/app/components/TextLink';

import { BOARDS } from './boards';
import styles from './layout.module.css';

/** The kit's name, linking to the index; the index is marked as the current page on it. */
export const KitTitle = () => {
  const pathname = usePathname();

  return (
    <a
      aria-current={pathname === '/design-kit' ? 'page' : undefined}
      className={styles.title}
      href='/design-kit'>
      KinScape design kit
    </a>
  );
};

/** A link to each board; the one on screen is marked as the current page. */
export const KitNav = () => {
  const pathname = usePathname();

  return (
    <nav aria-label='Boards' className={styles.nav}>
      <ul>
        {BOARDS.map(({ label, slug }) => {
          const href = `/design-kit/${slug}`;

          return (
            <li key={slug}>
              <TextLink
                aria-current={pathname === href ? 'page' : undefined}
                href={href}>
                {label}
              </TextLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
