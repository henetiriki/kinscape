/** The built design kit boards, in style guide order; each is at `/design-kit/<slug>`. */
export const BOARDS = [
  {
    line: 'Three families, each with one job, and the 14 styles they set.',
    number: '01',
    slug: 'type',
    title: 'Typography and hierarchy',
  },
  {
    line: 'Every control at rest, hovered, focused, pressed and disabled.',
    number: '04',
    slug: 'states',
    title: 'Component states',
  },
  {
    line: 'The map date field, its errors and how it checks what you type.',
    number: '05',
    slug: 'feedback',
    title: 'Feedback and validation',
  },
] as const;

export type Board = (typeof BOARDS)[number];

export const boardTitle = (slug: Board['slug']) =>
  BOARDS.find(board => board.slug === slug)!.title;
