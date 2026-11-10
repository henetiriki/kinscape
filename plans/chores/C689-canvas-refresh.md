# Plan: C689: Refresh the canvas copy

- **Spec:** #689
- **Status:** approved

## Approach

1. Update the canvas install ([CANVAS.md](../../design/CANVAS.md#updating-the-install)). Copy each changed DS file into `project/ds/kinscape/`. Set the `designSystems` entry's `version` and `copiedAt`.
2. Refresh the copy ([CANVAS.md](../../design/CANVAS.md#refreshing-the-copy)). Use the Artifact tool: `list` with scope `files`, and `read` with `paths`.
3. Changed boards change their snapshots. The workflow Design: Render snapshots makes them.

## Decisions

**D1 · Who updates the canvas install** · Decides: Tech lead

The canvas lacks the eight new components.

- **A.** The agent copies the changed files, then refreshes.
- **B.** The tech lead updates the install. The agent waits.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · The changed boards** · Decides: Tech lead

Boards differ from the copy. They are board work for Spec #684.

- **A.** Copy them in this PR, and render their snapshots.
- **B.** Copy `ds/` only. The #684 PR copies the boards.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                  | What                      |
| ------------------------------------- | ------------------------- |
| `plans/chores/C689-canvas-refresh.md` | This plan                 |
| `design/canvas/**`                    | The refresh, `VERSION`    |
| `design/source/*`, JPGs               | The workflow commits them |
| Issue #689 body                       | `gh issue edit`           |

## Order of work

1. Run `npm run design-system`. Update the install.
2. Compare hashes, copy the changed files, and check each hash.
3. Set `VERSION`. Run `npm run design:export`. Discard `source/` changes.
4. Commit `design/canvas/` alone. Push. Run the workflow.
5. Edit the #689 body: name the refresh steps. Add a check for the install and for the hashes.

## Risks

- The sandbox cannot run `e2e`.

## Proof

| Acceptance check               | Proven by                    |
| ------------------------------ | ---------------------------- |
| The install has the components | The canvas file list         |
| `canvas/` matches the canvas   | The hash output in the PR    |
| The snapshots match            | The workflow run, then `e2e` |

## Deviations

- Canvas version `1794317639-643e`: 13 boards use the components. The account menus stay hand-drawn, because `MenuPanel` fails the export.
