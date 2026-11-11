# Components: the path for a new or updated component

Two cases end the same way:

- A Spec builds a component from a design on the canvas.
- A component exists in the app and is not yet in the design system.

All steps run on one branch and one pull request. The plan lists the boards to swap. Step detail is in [`CANVAS.md`](CANVAS.md).

## Steps

1. **Build agent.** Build or change the component and its `CONTROLS` entry. Run `npm run design-system`. ([Order](CANVAS.md#changing-the-design-system), steps 1 and 2.) The build agent cannot sign in, so it asks the tech lead to run steps 2 to 4 ([design-system rule](../plans/README.md#design-system)).
2. **Tech lead, in a signed-in session.** Use a local Claude Code session in the clone where the branch is checked out, one at a time ([Who](CANVAS.md#changing-the-design-system)). Run `/publish-design-system` ([Order](CANVAS.md#changing-the-design-system), step 3).
3. **Tech lead, same session.** Update the install: [Updating the install](CANVAS.md#updating-the-install). The tech lead gives the OK on its file list.
4. **Tech lead, same session.** Refresh the copy: [Refreshing the copy](CANVAS.md#refreshing-the-copy). Commit `design/canvas/` alone. Push the branch.
5. **Design agent.** Swap each board in the plan with the [board swap prompt](#board-swap-prompt).
6. **Tech lead, same session as step 4.** Refresh the copy a second time: [Refreshing the copy](CANVAS.md#refreshing-the-copy). This step adds the swapped boards.
7. **Tech lead or build agent.** Start the workflow Design: Render snapshots on the branch. It has only a manual trigger. See [Making the snapshots and JPGs](CANVAS.md#making-the-snapshots-and-jpgs).
8. **Build agent.** Run the checks in `AGENTS.md`, section "Verifying your work". The tech lead then marks the pull request ready ([design-system rule](../plans/README.md#design-system)).

## Board swap prompt

Run the design agent on the same machine as the Claude Code session, in the clone where the branch is checked out. Do not use a design agent that has its own copy of the repository: its copy can be on `main`, with a different exporter. Run one swap at a time in that clone.

Paste this prompt into the design agent:

```text
Swap the new component into the boards that the plan lists, on the canvas.
First check the exporter version.
Then list every snapshot that could change, including a board you did not edit.
New bundle CSS changes the inline styles that the exporter writes.
For each board, swap it only if the export passes and the pixels match.
If a swap fails the export or changes pixels, keep the old board.
Leave the other boards alone.
Report each error with its board name.
Do not edit design/source/ or the JPGs.
```
