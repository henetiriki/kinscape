// The board icons are copied from design/source/style-3-foundations.html.
const PATHS = {
  alert: (
    <>
      <circle cx='12' cy='12' r='9' />
      <path d='M12 7.5v5.5M12 16.5v.01' />
    </>
  ),
  back: <path d='M15 5l-7 7 7 7' />,
  chevronDown: <path d='M6 9l6 6 6-6' />,
  close: <path d='M6 6l12 12M18 6L6 18' />,
  cloudOff: (
    <path d='M3 3l18 18M8.5 8.6A5.5 5.5 0 0 0 6.5 18H17M17.6 12.2A4 4 0 0 1 20.5 16' />
  ),
  copy: (
    <>
      <rect height='12' rx='2' width='12' x='8' y='8' />
      <path d='M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3' />
    </>
  ),
  document: (
    <>
      <path d='M6 4h9l3 3v13H6z' />
      <path d='M9 11h6M9 15h6' />
    </>
  ),
  done: (
    <>
      <circle cx='12' cy='12' r='9' />
      <path d='M8 12.5l2.7 2.7L16 9.8' />
    </>
  ),
  error: (
    <>
      <circle cx='12' cy='12' r='9' />
      <path d='M12 7.5v5.5M12 16.5v.01' />
    </>
  ),
  export: <path d='M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14' />,
  eye: (
    <>
      <path d='M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z' />
      <circle cx='12' cy='12' r='3' />
    </>
  ),
  eyeOff: (
    <>
      <path d='M6.6 6.7C3.7 8.6 2 12 2 12s3.6 7 10 7c2 0 3.7-.7 5.1-1.6M10 5.2c.6-.1 1.3-.2 2-.2 6.4 0 10 7 10 7s-.9 1.8-2.6 3.6' />
      <path d='M9.9 9.9a3 3 0 0 0 4.2 4.2' />
      <path d='M3 3l18 18' />
    </>
  ),
  fit: <path d='M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5' />,
  forward: <path d='M9 5l7 7-7 7' />,
  info: (
    <>
      <circle cx='12' cy='12' r='9' />
      <path d='M12 11v5.5M12 7.5v.01' />
    </>
  ),
  layers: (
    <>
      <path d='M12 3l9 5-9 5-9-5 9-5z' />
      <path d='M3 13l9 5 9-5' />
    </>
  ),
  menu: <path d='M4 7h16M4 12h16M4 17h16' />,
  place: (
    <>
      <path d='M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z' />
      <circle cx='12' cy='9.8' r='2.3' />
    </>
  ),
  play: <path d='M7 4.5v15l12.5-7.5z' fill='currentColor' stroke='none' />,
  search: (
    <>
      <circle cx='11' cy='11' r='6.5' />
      <path d='M16 16l4.5 4.5' />
    </>
  ),
  signOut: <path d='M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10' />,
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
  zoomIn: <path d='M12 5v14M5 12h14' />,
  zoomOut: <path d='M5 12h14' />,
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

export type IconSize = 14 | 16 | 18 | 20 | 24 | 28;

/** A decorative icon (18px unless sized) in the current colour; the words beside it carry the meaning. */
export const Icon = ({
  name,
  size = 18,
}: {
  name: IconName;
  size?: IconSize;
}) => (
  <svg
    aria-hidden='true'
    data-icon={name}
    fill='none'
    height={size}
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2'
    viewBox='0 0 24 24'
    width={size}>
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
