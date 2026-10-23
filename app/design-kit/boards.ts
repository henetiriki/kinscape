/**
 * The built design kit boards, in style guide order; each is at `/design-kit/<slug>`.
 * `title` is the landing page link and the board's heading; `label` is the short name for the menu bar.
 */
export const BOARDS = [
  {
    eyebrow: 'Style guide · 01',
    label: 'Typography',
    line: 'Three families, each with one job, and the 14 styles they set.',
    slug: 'type',
    title: 'Typography and hierarchy',
  },
  {
    eyebrow: 'Style guide · 02',
    label: 'Colour',
    line: 'Brand, accent, neutral and system colours, each with its contrast ratio.',
    slug: 'colour',
    title: 'Colour',
  },
  {
    eyebrow: 'Style guide · 03',
    label: 'Foundations',
    line: 'The spacing steps, corner radii, shadows, icons and motion every screen is built from.',
    slug: 'foundations',
    title: 'Spacing, shape, depth, icons, motion',
  },
  {
    eyebrow: 'Style guide · 04',
    label: 'Component states',
    line: 'Every control at rest, hovered, focused, pressed and disabled.',
    slug: 'states',
    title: 'Component states',
  },
  {
    eyebrow: 'Style guide · 05',
    label: 'Feedback',
    line: 'The map date field, its errors and how it checks what you type.',
    slug: 'feedback',
    title: 'Feedback and validation',
  },
  {
    eyebrow: 'Style guide · 06',
    label: 'Inputs and actions',
    line: 'Buttons, fields, chips, tabs, checkbox rows, alerts, dividers and key hints.',
    slug: 'inputs',
    title: 'Inputs and actions',
  },
  {
    eyebrow: 'Map style',
    label: 'Map style',
    line: 'Every layer drawn on the map, bottom to top, with the paint values it uses.',
    slug: 'map-style',
    title: 'MapLibre layer stack',
  },
] as const;

export type Board = (typeof BOARDS)[number];

export const boardTitle = (slug: Board['slug']) =>
  BOARDS.find(board => board.slug === slug)!.title;
