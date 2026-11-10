# Plan: C689: Refresh the canvas copy

- **Spec:** #689
- **Status:** approved

## Approach

1. Update the canvas install ([CANVAS.md](../../design/CANVAS.md#updating-the-install)).
2. Refresh the copy ([CANVAS.md](../../design/CANVAS.md#refreshing-the-copy)). Call the Artifact tool `list`, then `read`.
3. The workflow Design: Render snapshots makes the snapshots.

## Decisions

**D1 · Who updates the canvas install** · Decides: Tech lead

The canvas lacks the eight new components.

- **A.** The agent copies the changed files, then refreshes.
- **B.** The tech lead updates the install.
- **Other:** your own.

Recommended: A, because the agent can check each hash.

**Answer: A** (@henetiriki)

**D2 · The changed boards** · Decides: Tech lead

Boards differ from the copy.

- **A.** Copy them here, and render their snapshots.
- **B.** Copy `ds/` only.
- **Other:** your own.

Recommended: A, because boards and snapshots then change together.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | New / changed | What                      |
| ----------------------------------------- | ------------- | ------------------------- |
| `plans/chores/C689-canvas-refresh.md`     | New           | This plan                 |
| `design/canvas/**`                        | Changed       | The refresh, `VERSION`    |
| `design/source/*`, JPGs                   | Changed       | The workflow commits them |
| `scripts/__tests__/design-export.test.ts` | Changed       | A 30 s timeout            |

## Order of work

1. Run `npm run design-system`. Update the install.
2. Compare the hashes. Copy the changed files.
3. Set `VERSION`. Run `npm run design:export`.
4. Commit `design/canvas/` alone. Run the workflow.

## Proof

| Acceptance check               | Proven by                    |
| ------------------------------ | ---------------------------- |
| The install has the components | The canvas file list         |
| `canvas/` matches the canvas   | The hash output in the PR    |
| The snapshots match            | The workflow run, then `e2e` |

## Deviations

- Canvas version `1794317639-643e`: the first copy lacked the board changes (3967ce3, 80ae64f).
- Account menus stay hand-drawn: the `<hr>` colour of `MenuPanel` and the unlabelled `Divider` is not a token (991d78d).
- The `chrome` flag in `Map.dc.html` and `Map-phone-states.dc.html` hides map controls in the `account` variant. The design agent must confirm it (a21a16c).
- The snapshot test has a 30 s timeout: it timed out at 5 s (eca7c54).
