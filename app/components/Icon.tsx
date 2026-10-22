const PATHS = {
  cloudOff: (
    <path d='M3 3l18 18M8.5 8.6A5.5 5.5 0 0 0 6.5 18H17M17.6 12.2A4 4 0 0 1 20.5 16' />
  ),
  error: (
    <>
      <circle cx='12' cy='12' r='9' />
      <path d='M12 7.5v5.5M12 16.5v.01' />
    </>
  ),
  info: (
    <>
      <circle cx='12' cy='12' r='9' />
      <path d='M12 11v5.5M12 7.5v.01' />
    </>
  ),
  success: (
    <>
      <circle cx='12' cy='12' r='9' />
      <path d='M8 12.5l2.7 2.7L16 9.8' />
    </>
  ),
  warning: (
    <>
      <path d='M12 3.5l9.5 17h-19z' />
      <path d='M12 10v4.5M12 17.5v.01' />
    </>
  ),
};

// The white mark on a filled disc; a warning is a disc too, as on the Alerts board.
const MARKS = {
  error: 'M12 6.5v6.5M12 16.5v.01',
  info: 'M12 11v6M12 7.5v.01',
  success: 'M7.5 12.5l3 3 6-6.5',
  warning: 'M12 6.5v6.5M12 16.5v.01',
};

export type FilledIconName = keyof typeof MARKS;
export type IconName = keyof typeof PATHS;

/** A decorative 18px icon in the current colour; the words beside it carry the meaning. */
export const Icon = ({ name }: { name: IconName }) => (
  <svg
    aria-hidden='true'
    data-icon={name}
    fill='none'
    height='18'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2.2'
    viewBox='0 0 24 24'
    width='18'>
    {PATHS[name]}
  </svg>
);

/** The 20px form for alerts: a disc in the current colour with a white mark. */
export const FilledIcon = ({ name }: { name: FilledIconName }) => (
  <svg
    aria-hidden='true'
    data-icon={name}
    fill='none'
    height='20'
    viewBox='0 0 24 24'
    width='20'>
    <circle cx='12' cy='12' fill='currentColor' r='12' />
    <path
      d={MARKS[name]}
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2.8'
      style={{ color: 'var(--white)' }}
    />
  </svg>
);
