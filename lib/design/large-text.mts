/** The 200% text check: its list of failures and the outcome of one screen and width. */

import type { LargeTextEntry, LargeTextResult } from '#ks/lib/design/types.ts';

const has = (list: LargeTextEntry[], screen: string, width: number) =>
  list.some(entry => entry.screen === screen && entry.width === width);

/** Fails a screen with problems and no entry, and an entry with no problems. Else it passes. */
export const verdictFor = (
  screen: string,
  width: number,
  problems: string[],
  list: LargeTextEntry[]
): LargeTextResult => {
  const listed = has(list, screen, width);

  if (problems.length > 0 && !listed) {
    return {
      ok: false,
      text: `${screen} at ${width}px fails at 200% text and is not on the list: ${problems.join('; ')}`,
    };
  }

  if (problems.length === 0 && listed) {
    return {
      ok: false,
      text: `${screen} at ${width}px passes at 200% text: remove its entry from lib/design/large-text.json`,
    };
  }

  return { ok: true, text: '' };
};

/** An entry with an unknown screen or width, and a second copy of an entry. */
export const listProblems = (
  list: LargeTextEntry[],
  screens: string[],
  widths: number[]
): string[] =>
  list.flatMap(({ screen, width }, at) => {
    const name = `${screen} at ${width}px`;

    if (!screens.includes(screen)) {
      return [`${name}: the screen is not in design/screens.json`];
    }

    if (!widths.includes(width)) {
      return [`${name}: the width is not ${widths.join(' or ')}`];
    }

    return list.findIndex(
      other => other.screen === screen && other.width === width
    ) === at
      ? []
      : [`${name}: the list holds it twice`];
  });
