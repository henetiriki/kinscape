---
paths:
  - 'app/components/layout/**'
  - 'features/map/components/**'
  - 'features/people/components/**'
---

# Layout

## Layout

- Desktop first. The map fills the window and everything else floats on it with a 24px gutter.
- Desktop: search bar top left. The Layers / Filters panel sits below it, 320px wide. The date dock runs along the bottom, right of the panel. Account and zoom controls are top right. The credits line sits under the dock.
- Phone: search pill on top, a layers button under it, and a bottom sheet. When collapsed, the sheet holds only the date stepper and Play. When the user taps the map, the sheet opens with the look-up result. A user cannot edit on a phone.
- Sizes, offsets and stacking come from the `layout`, `breakpoint` and `z` tokens in `design/kinscape.tokens.json`.
- `MapLayout` places the search, action, account, zoom, panel, dock, credits and overlay slots from those tokens. On a phone only, it also places a Layers button. Its overlay area runs from `dock-left` to the gutter and from `furniture-top` to the dock's top. A popup sits left of its map point (`popup-gap`, `popup-point-y`), with the pointer on its right edge.
- A notice centres in the free map area, not the window.
- `SignInLayout` places the sign-in hero and form from `layout.sign-in`. On desktop the hero is left, and the form pane is at least 440 wide with a form of at most 360. On a phone, a 188px hero with the wordmark over it comes first, then the form. `SignInHero`'s coast and border lines are a hand-drawn sketch, traced from no dataset (NFR-08).
- `ColumnLayout` frames the People screens: a header, one centred column that scrolls and an optional action bar. `column` sets the width, gap and padding. `list` and `detail` are `layout.list-width` wide; `form` is `layout.content-width` wide.
- Pass MapLibre `padding` so the map centres in the space the panel and dock leave.
