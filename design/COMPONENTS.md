# Components: the path for a new or updated component

A component that the app does not have follows [A component that is not built](#a-component-that-is-not-built). A component that the app has follows [A built component](#a-built-component).

## A component that is not built

Follow these steps in order:

1. Draw the component on a board of the draft page ("Drafts") of the canvas. The board has a snapshot and a JPG, and no entry in `design/screens.json`. Add a Screens row for the snapshot to `design/DESIGN.md`. Add its name to `NO_ENTRY` in `lib/design/__tests__/screens.test.ts`. Raise the snapshot count in `lib/design/__tests__/design.test.ts` and `scripts/__tests__/design-export.test.ts` by one.
2. Build the component from that board. Add it to `CONTROLS`. Write its card states in `lib/design/states.mts`. If its CSS has a width query, or it fills the viewport, add it to `PHONE_CARDS` in `lib/design/cards.mts`. Write its Components text in `design/DESIGN.md` from the notes of the draft board. A note is each size, rule, offset, state and accessible name that the board shows or says.
3. Run the steps of [Changing the design system](CANVAS.md#changing-the-design-system) on one branch and one pull request. The plan lists the boards for [step 7](CANVAS.md#changing-the-design-system). The workflow "Design: Render snapshots" writes its card images.
4. Swap it into each screen board that shows it. Then, when each note of the draft board is in the Components text, in a card state or in the code, delete the board. A note that the code holds needs no second copy in the Components text. Follow [the deletion rule](CANVAS.md#who-deletes-a-generated-file).

## A built component

If the app has the component and the design system does not, do steps 2 and 3 above. Draw no draft board.

## Board swap prompt

Follow these rules:

- If the real component draws differently from the board, do not swap that part. Raise a Bug that names the board and the difference. The Bug does not block the other swaps.
- Fix the component first. Then swap it.
- Never change a component to make it mount on a board or to make a check pass.

Paste this prompt into a local session:

```text
Do not edit design/source/ or the JPGs.
Swap the new component into the boards that the plan lists.
Edit each board in the repo copy, design/canvas/project/.
First check the exporter version.
Then list every snapshot that could change, including a board you did not edit.
New bundle CSS changes the inline styles that the exporter writes.
For each board, swap it only if npm run design:export passes.
If a swap fails the export, keep the old board.
Do not compare pixels. The tech lead compares the JPGs after the workflow run.
Leave the other boards alone.
Report each error with its board name.
```
