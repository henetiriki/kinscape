const PATHS = {
  error: (
    <>
      <circle cx='12' cy='12' r='9' />
      <path d='M12 7.5v5.5M12 16.5v.01' />
    </>
  ),
  warning: (
    <>
      <path d='M12 3.5l9.5 17h-19z' />
      <path d='M12 10v4.5M12 17.5v.01' />
    </>
  ),
};

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
