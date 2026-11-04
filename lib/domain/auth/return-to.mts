// A control character, or a backslash that a browser reads as a slash.
const UNSAFE = /[\u0000-\u001f\u007f\\]/;
const BASE = 'http://return-to.invalid';

/**
 * Where to go after signing in: `value` if it is a path on this site (one leading `/`, not `//`,
 * also once dot segments are resolved), otherwise the map.
 */
export const safeReturnTo = (value: unknown): string => {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//')
  )
    return '/';
  if (UNSAFE.test(value)) return '/';
  const url = new URL(value, BASE);

  if (url.origin !== BASE || url.pathname.startsWith('//')) return '/';

  return url.pathname + url.search + url.hash;
};
