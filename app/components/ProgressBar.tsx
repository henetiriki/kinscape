import styles from './ProgressBar.module.css';

/** How much is done, 0 to 100. Determinate only; `labelledBy` is the id of the text that names it. */
export const ProgressBar = ({
  labelledBy,
  value,
}: {
  labelledBy: string;
  value: number;
}) => {
  const shown = Math.min(100, Math.max(0, value));

  return (
    <span
      aria-labelledby={labelledBy}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={shown}
      className={styles.track}
      role='progressbar'>
      <span className={styles.fill} style={{ width: `${shown}%` }} />
    </span>
  );
};
