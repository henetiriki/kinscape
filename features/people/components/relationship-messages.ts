import type {
  AlertCode,
  Message,
} from '@ks/features/people/components/types.ts';

const MESSAGES: Record<AlertCode, (name: string) => Message> = {
  conflict: () => ({
    action: 'Reload',
    line: 'Nothing was saved. Reload to see the latest version, then make your changes again.',
    title: 'This link changed while you were editing',
  }),
  cycle: name => ({
    line: `This would make ${name} their own ancestor.`,
    title: "This link isn't possible",
  }),
  'divorce-before-marriage': () => ({
    line: 'Nothing was saved. Change one of the dates.',
    title: 'The divorce is before the marriage',
  }),
  duplicate: () => ({
    line: 'They already have this link. Edit it from the list.',
    title: 'These people are already linked',
  }),
  'not-found': () => ({
    action: 'Go to People',
    line: 'Nothing was saved. It may have been deleted.',
    title: 'This person or link no longer exists',
  }),
  self: () => ({
    line: 'Choose someone else.',
    title: "A person can't be their own relative",
  }),
  'third-biological-parent': () => ({
    line: 'A person has at most two. Choose adoptive or step, or edit a link.',
    title: 'Too many biological parents',
  }),
  'tree-full': () => ({
    line: 'Nothing was saved.',
    title: 'Your Tree holds the most links it can',
  }),
};

/** Every code that shows an alert, in alphabetical order. */
export const alertCodes = Object.keys(MESSAGES).sort() as AlertCode[];

/** The title, line and action of `code`. `name` is the Person that a `cycle` line names. */
export const messageOf = (code: AlertCode, name: string): Message => ({
  action: undefined,
  ...MESSAGES[code](name),
});
