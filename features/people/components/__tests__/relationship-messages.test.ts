import { describe, expect, it } from 'vitest';

import { messageOf } from '@ks/features/people/components/relationship-messages';

// PPL-02
describe('messageOf', () => {
  it.each([
    [
      'self',
      "A person can't be their own relative",
      'Choose someone else.',
      undefined,
    ],
    [
      'cycle',
      "This link isn't possible",
      'This would make Hendrik Willem du Toit their own ancestor.',
      undefined,
    ],
    [
      'third-biological-parent',
      'Too many biological parents',
      'A person has at most two. Choose adoptive or step, or edit a link.',
      undefined,
    ],
    [
      'duplicate',
      'These people are already linked',
      'They already have this link. Edit it from the list.',
      undefined,
    ],
    [
      'tree-full',
      'Your Tree holds the most links it can',
      'Nothing was saved.',
      undefined,
    ],
    [
      'conflict',
      'This link changed while you were editing',
      'Nothing was saved. Reload to see the latest version, then make your changes again.',
      'Reload',
    ],
    [
      'not-found',
      'This person or link no longer exists',
      'Nothing was saved. It may have been deleted.',
      'Go to People',
    ],
    [
      'divorce-before-marriage',
      'The divorce is before the marriage',
      'Nothing was saved. Change one of the dates.',
      undefined,
    ],
  ] as const)('gives the board text of %s', (code, title, line, action) => {
    expect(messageOf(code, 'Hendrik Willem du Toit')).toEqual({
      action,
      line,
      title,
    });
  });
});
