The credits line.

## Design

- **Credits line** under the date dock is one line at every desktop width: a "Credits" button with the `info` icon, " · " and an "Attributions" link. 11px, `--credits`.
- **Credits card:** The "Credits" button sets `aria-expanded`. It opens a card above the line with the attribution text of the sources on screen, joined with " · ". The card covers the dock's corner and moves nothing. A second press, a press outside it or Esc closes it. A dialog on top keeps the card open.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `collapsible` | `boolean` | no |  |
| `defaultOpen` | `boolean` | no |  |
| `onOpenAttributions` | `() => void` | yes |  |
| `showPolities` | `boolean` | yes |  |
| `sources` | `{ attribution: string; author: string; dateChecked: string; id: string; layer: string; licence: string; licenceLink: string; title: string; processing?: string \| undefined; }[]` | yes |  |
