# Components: the path for a new or updated component

Two cases end the same way:

- A Spec builds a component from a design on the canvas.
- A component exists in the app and is not yet in the design system.

Add the component to `CONTROLS`. Run the steps of [Changing the design system](CANVAS.md#changing-the-design-system) on one branch and one pull request. The plan lists the boards for [step 7](CANVAS.md#changing-the-design-system).

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
