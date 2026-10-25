import type { IconName } from '@/app/components/Icon';

/** The Foundations board's rows, in board order. Each is keyed by its token; the board reads the value. */
export const SPACE = [
  { step: '4', use: 'Icon to text, tight pairs' },
  { step: '8', use: 'Inside controls, between chips' },
  { step: '12', use: 'Icon gaps, row padding' },
  { step: '16', use: 'Panel padding on phone' },
  { step: '20', use: 'Panel and dock padding' },
  { step: '24', use: 'Between floating elements' },
  { step: '32', use: 'Between sections' },
  { step: '40', use: 'Between page blocks' },
  { step: '48', use: 'Sign-in form padding' },
  { step: '64', use: 'Page padding on boards' },
] as const;

export const RADII = [
  { name: 'link', use: 'Links, around the focus ring' },
  { name: 'small', use: 'Keyboard keys, checkboxes' },
  { name: 'segment-item', use: 'Segmented items' },
  { name: 'control', use: 'Buttons, fields' },
  { name: 'segment', use: 'Segmented track' },
  { name: 'panel', use: 'Panels, dock, popups, dialogs' },
  { name: 'sheet', use: 'Top of phone sheet' },
  { name: 'full', use: 'Chips, Play, avatar, pins' },
] as const;

export const SHADOWS = [
  { name: 'raised', title: 'Raised', use: 'Panels, dock, search, cards' },
  { name: 'floating', title: 'Floating', use: 'Popups, menus' },
  { name: 'modal', title: 'Modal', use: 'Dialogs, over a scrim' },
  { name: 'sheet', title: 'Sheet', use: 'Phone bottom sheets' },
  { name: 'segment', title: 'Segment', use: 'The selected segment' },
] as const;

export const ICONS = [
  { label: 'search', name: 'search' },
  { label: 'zoom in', name: 'zoomIn' },
  { label: 'zoom out', name: 'zoomOut' },
  { label: 'fit', name: 'fit' },
  { label: 'layers', name: 'layers' },
  { label: 'back', name: 'back' },
  { label: 'forward', name: 'forward' },
  { label: 'chevron down', name: 'chevronDown' },
  { label: 'play', name: 'play' },
  { label: 'close', name: 'close' },
  { label: 'copy', name: 'copy' },
  { label: 'place', name: 'place' },
  { label: 'alert', name: 'alert' },
  { label: 'done', name: 'done' },
  { label: 'export', name: 'export' },
  { label: 'document', name: 'document' },
  { label: 'sign out', name: 'signOut' },
  { label: 'eye', name: 'eye' },
  { label: 'eye off', name: 'eyeOff' },
] as const satisfies readonly { label: string; name: IconName }[];

export const MOTION = [
  { name: 'press', title: 'Hover, press', use: 'Colour and border only' },
  { name: 'popup', title: 'Popups, menus', use: 'Fade and 4px rise' },
  {
    name: 'sheet',
    title: 'Phone sheet',
    use: 'Slides; follows the finger while dragged',
  },
  {
    name: 'changed-border',
    title: 'Changed border',
    use: 'MAP-11 highlight, then gone',
  },
  {
    name: 'toast',
    title: 'Toast',
    use: 'A success toast leaves after 4 seconds; errors stay',
  },
] as const;

export const MAP_DATE_CHANGE = {
  title: 'Map date change',
  use: 'Redraw at once. Never animate or show a loader (NFR-01)',
  value: 'none',
} as const;
