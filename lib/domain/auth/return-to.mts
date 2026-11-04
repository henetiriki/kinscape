// A control character, or a backslash that a browser reads as a slash.
const UNSAFE = /[\u0000-\u001f\u007f\\]/;

/**
 * Where to go after signing in: `value` if it is a path on this site (one leading `/`, not `//`),
 * otherwise the map.
 */
export const safeReturnTo = (value: unknown): string =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !UNSAFE.test(value)
    ? value
    : '/';
