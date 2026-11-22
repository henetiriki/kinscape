import styles from '@ks/app/components/feedback/LoadingBar.module.css';

/**
 * A grey bar, 20px high, that stands where text will be. A loading state uses it. A screen reader
 * skips it (`aria-hidden`), because the part that holds it sets `aria-busy`.
 */
export const LoadingBar = ({ width }: { width: number }) => (
  <span
    aria-hidden='true'
    className={styles.bar}
    data-bar=''
    style={{ width }}
  />
);
