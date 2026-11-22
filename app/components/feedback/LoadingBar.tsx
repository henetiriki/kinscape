import styles from '@ks/app/components/feedback/LoadingBar.module.css';

/**
 * A grey bar that stands where text will be, 20px high. It is for a loading state and is hidden
 * from a screen reader: the part that holds it sets `aria-busy`.
 */
export const LoadingBar = ({ width }: { width: number }) => (
  <span
    aria-hidden='true'
    className={styles.bar}
    data-bar=''
    style={{ width }}
  />
);
