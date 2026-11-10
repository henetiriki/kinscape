# Plan: C691: Add the remaining actions, forms and feedback components to the design system

- **Spec:** #691
- **Status:** approved

## Approach

1. Add the eight, and `RemovableChip` (D1), to `CONTROLS` and `CARDS`, each at the end of its group.
2. Each card shows the props that change the look; `Banner` leaves out `placed`.
3. The React 18 test checks the `TokenField`, `SelectField`, `Banner` and `NoticeCard` events.

## Decisions

**D1 · The parts that the eight use** · Decides: Tech lead

**Answer: other, `RemovableChip` only: nine components** (@henetiriki). `CalloutPointer` needs a `className` that a board cannot write.

**D2 · The canvas check** · Decides: Tech lead

**Answer: Chromium renders each preview with the React 18 bundle** (@henetiriki). The tech lead cannot screenshot it.

**D3 · Board edits** · Decides: Tech lead

**Answer: the design agent uses the new components where nothing visible changes** (@henetiriki): `Map`, `Map-phone-states`, `SG-Feedback` and `SG-Inputs`.

## Files that change

`lib/design/{bundle,cards,states}.mts`, their tests, `design/canvas/`, `design/source/` and `design/*.jpg`.

## Order of work

1. Add the React 18 cases and counts; see them fail.
2. Run `npm run design-system`.
3. The tech lead runs steps 3 to 5 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system) in a signed-in session.
4. Run `npm run design:export`. If a board changed, run Design: Render snapshots.

## Risks

A new `bundle.css` rule can change a board's control, as `Popup` did in #690. `design:export` finds it.

## Proof

| Acceptance check                          | Proven by                              |
| ----------------------------------------- | -------------------------------------- |
| Bundle, types, README, card and size      | `design-system.test.ts`, `checkScript` |
| React 18 renders each state               | `react-18.test.tsx`                    |
| Previews render                           | A Chromium render (D2)                 |
| Hashes, snapshots, tests, lint, typecheck | PR output                              |

## Deviations

- Render snapshots (`409989c`) ran `design:export`, with no Chromium here. It changed 5 JPGs and 16 snapshots: `add-pin`, `add-pin-phone`, `map-account-menu-proposed`, `map-date-invalid`, `map-desktop`, `map-desktop-filters`, `map-districts`, `map-empty-date`, `map-empty-tree`, `map-empty-tree-phone`, `map-loading`, `map-loading-phone`, `map-offline`, `map-sources`, `style-5-feedback`, `style-6-components-inputs`.
- Each preview caption has an id, so `ProgressBar` has a name. Steps 2 to 5 ran again.
