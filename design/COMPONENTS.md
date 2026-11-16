# Components: the path for a new or updated component

A component that the app does not have follows [A component that is not built](#a-component-that-is-not-built). A component that the app has follows [A built component](#a-built-component).

## A component that is not built

Follow these steps in order:

1. Draw the component on a board of the draft page ("Drafts") of the canvas. The board has a snapshot and a JPG, and no entry in `design/screens.json`. Add a Screens row for the snapshot to `design/DESIGN.md`. Add its name to `NO_ENTRY` in `lib/design/__tests__/screens.test.ts`. Raise the snapshot count in `lib/design/__tests__/design.test.ts` and `scripts/__tests__/design-export.test.ts` by one.
2. Build the component from that board. Add it to `CONTROLS`. Write its card states in `lib/design/states.mts`. If its CSS has a width query, or it fills the viewport, add it to `PHONE_CARDS` in `lib/design/cards.mts`.
3. Run the steps of [Changing the design system](CANVAS.md#changing-the-design-system) on one branch and one pull request. The plan lists the boards for [step 7](CANVAS.md#changing-the-design-system). The workflow "Design: Render snapshots" writes its card images.
4. Swap it into each screen board that shows it. Then delete the draft board. The tech lead, or a local session that the tech lead starts, deletes its snapshot and its JPG. Remove its Screens row and its `NO_ENTRY` name. Lower the two counts by one.
5. Add no section to `/design-kit` and no `SG-*` board.

## A built component

If the app has the component and the design system does not, do steps 2 and 3 above. Draw no draft board.

A change to a component that a `/design-kit` page shows still updates that page and its `SG-*` board, until the route retires.

## Board swap prompt

Paste this prompt into a local session:

```text
Do not edit design/source/ or the JPGs.
Swap the new component into the boards that the plan lists, on the canvas.
First check the exporter version.
Then list every snapshot that could change, including a board you did not edit.
New bundle CSS changes the inline styles that the exporter writes.
For each board, swap it only if the export passes and the pixels match.
If a swap fails the export or changes pixels, keep the old board.
Leave the other boards alone.
Report each error with its board name.
```
