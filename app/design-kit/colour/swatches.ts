/** What the colour board shows, in board order. Values come from `design/tokens.json`; the page resolves them. */

import type {
  Group,
  On,
  Role,
  System,
  SystemLine,
} from '@ks/app/design-kit/colour/types';

const BRAND: On = ['colour.brand', 'brand'];
const INK: On = ['colour.ink', 'ink'];
const LAND: On = ['map.land', 'land'];

export const GROUPS: Group[] = [
  {
    note: 'Primary actions, links, selection and focus.',
    swatches: [
      {
        path: 'colour.brand-pressed',
        role: 'text',
        use: 'Pressed buttons and links',
      },
      {
        path: 'colour.brand-hover',
        role: 'text',
        use: 'Hover on buttons and links; a link underline thickens to 2px',
      },
      {
        path: 'colour.brand',
        role: 'text',
        use: 'Primary buttons, links (underlined 1px, offset 3px), selected point, app icon background',
      },
      {
        path: 'colour.brand-tint',
        role: 'fill only',
        use: 'Selected tab, chip on, pressed secondary',
      },
      {
        path: 'colour.brand-tint-hover',
        role: 'fill only',
        use: 'Hover on a chip that is on',
      },
      {
        path: 'colour.brand-tint-pressed',
        role: 'fill only',
        use: 'Pressing a chip that is on',
      },
    ],
    title: 'Brand',
  },
  {
    note: 'Only for pins and things that mean "a person was here".',
    swatches: [
      {
        path: 'colour.pin',
        role: 'border',
        use: 'Pins, clusters, event glyphs',
      },
      {
        path: 'map.hatch.colour',
        role: 'map only',
        use: 'Contested hatch, at map.hatch.opacity ({opacity}). A MapLibre paint value, not a custom property',
      },
    ],
    title: 'Accent',
  },
  {
    note: 'Text, borders and surfaces.',
    swatches: [
      { path: 'colour.ink', role: 'text', use: 'Main text, dark banners' },
      { path: 'colour.ink-2', role: 'text', use: 'Secondary text' },
      { path: 'colour.ink-3', role: 'text', use: 'Helper text, overlines' },
      {
        path: 'colour.ink-disabled',
        role: 'text',
        use: 'Disabled text and icons',
      },
      {
        path: 'colour.icon-disabled',
        role: 'disabled',
        use: 'The glyph in a disabled icon button',
      },
      {
        path: 'colour.field-border',
        role: 'border',
        use: 'Field and checkbox borders (meets 3:1)',
      },
      {
        path: 'colour.line-strong',
        role: 'decorative',
        use: 'Secondary button borders',
      },
      {
        path: 'colour.line',
        role: 'decorative',
        use: 'Dividers, disabled primary buttons',
      },
      {
        path: 'colour.track',
        role: 'decorative',
        use: 'Date slider track, unselected year buttons',
      },
      {
        path: 'colour.segment',
        role: 'fill only',
        use: 'Segmented control track',
      },
      {
        path: 'colour.surface-2',
        role: 'fill only',
        use: 'Insets, hover fills, sign-in page',
      },
      {
        path: 'colour.surface',
        role: 'fill only',
        use: 'Panels, dock, popups, dialogs',
      },
      {
        on: BRAND,
        path: 'colour.white',
        role: 'text',
        use: 'Text and icons on --brand and --ink',
      },
    ],
    title: 'Neutrals',
  },
  {
    note: 'One colour family, so anything green can be clicked.',
    swatches: [
      {
        path: 'colour.focus-ring',
        role: 'border',
        use: 'Same value as --brand. 2px outline, 2px offset, on every focusable thing',
      },
      {
        on: INK,
        path: 'colour.focus-ring-on-dark',
        role: 'border',
        use: 'Same value as --white. Focus ring inside dark banners',
      },
    ],
    title: 'Focus',
  },
  {
    note: 'Drawn on top of the map rather than on a panel.',
    swatches: [
      {
        path: 'colour.scrim',
        role: 'overlay',
        use: 'Behind dialogs and phone sheets',
      },
      {
        on: LAND,
        path: 'colour.credits',
        role: 'text',
        use: 'Credits line under the date dock',
      },
    ],
    title: 'Over the map',
  },
  {
    note: "Google's own colours, for its sign-in button and nothing else.",
    swatches: [
      { path: 'colour.google-text', role: 'text', use: 'Google button label' },
      {
        path: 'colour.google-border',
        role: 'border',
        use: 'Google button border',
      },
      {
        path: 'colour.google-mark',
        role: 'border',
        use: 'The placeholder G mark in the mockups',
      },
    ],
    title: 'Third party',
  },
];

const line = (
  tone: System['tone'],
  suffix: '-bg' | '-border' | '',
  role: SystemLine['role']
): SystemLine => ({
  ...(suffix === '' ? { on: [`colour.${tone}-bg`, 'bg'] as const } : {}),
  path: `colour.${tone}${suffix}`,
  role,
});

const lines = (tone: System['tone']): SystemLine[] => [
  line(tone, '', 'text'),
  line(tone, '-border', 'border'),
  line(tone, '-bg', 'plain'),
];

export const SYSTEM: System[] = [
  {
    lines: [
      ...lines('error'),
      {
        path: 'colour.error-border-soft',
        role: 'note',
        use: 'sign-in alert border',
      },
    ],
    text: "That date doesn't exist.",
    title: 'Error',
    tone: 'error',
  },
  {
    lines: lines('warning'),
    text: 'No borders are mapped for 1750 yet.',
    title: 'Warning',
    tone: 'warning',
  },
  {
    lines: lines('success'),
    text: 'Jurisdiction chain copied.',
    title: 'Success',
    tone: 'success',
  },
  {
    lines: lines('info'),
    text: 'Switched to month precision.',
    title: 'Info',
    tone: 'info',
  },
];

/** The least contrast a role may show: text 4.5, a border or icon 3. */
export const MINIMUM: Partial<Record<Role | SystemLine['role'], number>> = {
  border: 3,
  text: 4.5,
};
