/** Synthetic samples: the design kit's boards and the design system's cards both draw them. */

export const CHAIN = [
  { level: 'District', name: 'Kimberley' },
  {
    detail: 'Was Griqualand West until 1880',
    level: 'Colony',
    name: 'Cape Colony',
  },
];

/** Seven lines, so the box of a long text field's long content state scrolls. */
export const LONG_NOTES = Array.from(
  { length: 7 },
  (_, line) => `Line ${line + 1} of the notes.`
).join('\n');

export const PINS = [
  {
    date: '1901-03-14',
    event: 'marriage' as const,
    id: 'marriage',
    people: 'J. Rossouw & M. du Toit',
    title: 'Marriage',
  },
];
