/**
 * The built design kit boards, in style guide order; each is at `/design-kit/<slug>`.
 * `title` is the landing page link and the board's heading; `label` is the short name for the menu bar.
 */
export const BOARDS = [
  {
    label: 'Typography',
    line: 'Three families, each with one job, and the 14 styles they set.',
    number: '01',
    slug: 'type',
    title: 'Typography and hierarchy',
  },
  {
    label: 'Colour',
    line: 'Every colour token with its value, contrast ratio and use.',
    number: '02',
    slug: 'colour',
    title: 'Colour',
  },
  {
    label: 'Foundations',
    line: 'The small set of values every screen is built from.',
    number: '03',
    slug: 'foundations',
    title: 'Spacing, shape, depth, icons, motion',
  },
  {
    label: 'Component states',
    line: 'Every control at rest, hovered, focused, pressed and disabled.',
    number: '04',
    slug: 'states',
    title: 'Component states',
  },
  {
    label: 'Feedback',
    line: 'The map date field, its errors and how it checks what you type.',
    number: '05',
    slug: 'feedback',
    title: 'Feedback and validation',
  },
] as const;

export type Board = (typeof BOARDS)[number];

export const boardTitle = (slug: Board['slug']) =>
  BOARDS.find(board => board.slug === slug)!.title;
