# Components: the path for a new or updated component

Two cases end the same way:

- A Spec builds a component from a design on the canvas.
- A component exists in the app and is not yet in the design system.

All steps run on one branch and one pull request. The plan lists the boards to swap. Step detail is in [`CANVAS.md`](CANVAS.md).

## Steps

1. **Build agent.** Build or change the component and its `CONTROLS` entry. Run `npm run design-system`. ([Order](CANVAS.md#changing-the-design-system), steps 1 and 2.)
2. **Tech lead, in a signed-in session** (or a local Claude Code session that they start). Read the canvas in full, then run `/publish-design-system`. (Step 3.)
3. **Same session.** Update the install: [Updating the install](CANVAS.md#updating-the-install). The gate is the tech lead's OK on the file list in its step 3.
4. **Same session.** Refresh the copy: [Refreshing the copy](CANVAS.md#refreshing-the-copy). Commit `design/canvas/` alone, then push.
5. **Design agent.** Swap each board in the plan with the prompt below.
6. **Same session.** Refresh the copy a second time to bring in the swapped boards.
7. **CI.** Run the workflow Design: Render snapshots on the branch. It exports and renders. A session with no Chromium skips `npm run design:export`.
8. **Build agent.** Run the checks in `AGENTS.md`, then mark the pull request ready.

The CI build agent cannot sign in, so it stops after step 1 and hands over to the tech lead.

## Board swap prompt

Paste this prompt into the design agent:

```text
Swap the new component into the boards that the plan lists, on the canvas.
First check the exporter version.
Then list every snapshot that could change, including a board you did not edit.
New bundle CSS changes the inline styles that the exporter writes.
For each drawing, swap it only if the export passes and the pixels match.
If a swap fails the export or changes pixels, keep the old drawing.
Leave the other drawings alone, and report each error with its board name.
Do not edit design/source/ or the JPGs.
```
