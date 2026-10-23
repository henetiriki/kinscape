import styles from './KeyHint.module.css';

/** A keyboard key, drawn in mono. In a sentence it is read as part of it; `decorative` hides it when the control carries `aria-keyshortcuts`. */
export const KeyHint = ({
  children,
  decorative,
}: {
  children: string;
  decorative?: boolean;
}) => (
  <kbd aria-hidden={decorative || undefined} className={styles.key}>
    {children}
  </kbd>
);
