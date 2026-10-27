import styles from '@ks/app/components/foundation/Divider.module.css';

/** A hairline; with `label` it reads as "or" between two choices. */
export const Divider = ({ label }: { label?: string }) =>
  label ? (
    <div className={styles.labelled}>
      <span aria-hidden='true' className={styles.line} />
      <span className={styles.label}>{label}</span>
      <span aria-hidden='true' className={styles.line} />
    </div>
  ) : (
    <hr className={styles.rule} />
  );
