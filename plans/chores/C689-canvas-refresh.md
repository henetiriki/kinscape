# Plan: C689: Refresh the canvas copy

- **Spec:** #689
- **Status:** approved

## Approach

1. Update the canvas install ([CANVAS.md](../../design/CANVAS.md#updating-the-install)). Publish to the canvas with `files` that copy each changed DS file into `project/ds/kinscape/`. Set the `designSystems` entry's `version` and `copiedAt`.
2. Refresh the copy ([CANVAS.md](../../design/CANVAS.md#refreshing-the-copy)). Use the Artifact tool: `list` with scope `files`, and `read` with `paths`.
3. The four changed boards change the `map-account-menu*` snapshots. The workflow Design: Render snapshots makes them.

## Decisions

**D1 · Who updates the canvas install** · Decides: Tech lead

The canvas lacks the eight new components.

- **A.** The agent copies the changed files, then refreshes.
- **B.** The tech lead updates the install. The agent waits.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · The four changed boards** · Decides: Tech lead

`Map`, `Map-account`, `Map-phone-account` and `Map-phone-states` differ. They are board work for Spec #684.

- **A.** Copy them in this PR, and render their snapshots.
- **B.** Copy `ds/` only. The #684 PR copies the boards.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                    | What                      |
| --------------------------------------- | ------------------------- |
| `plans/chores/C689-canvas-refresh.md`   | This plan                 |
| `design/canvas/**`                      | The refresh, `VERSION`    |
| `design/source/map-account-menu*`, JPGs | The workflow commits them |
| Issue #689 body                         | `gh issue edit`           |

## Order of work

1. Run `npm run design-system`. Update the install.
2. Compare hashes, copy the changed files, and check each hash.
3. Set `VERSION`. Run `npm run design:export`. Discard `source/` changes.
4. Commit `design/canvas/` alone. Push. Run the workflow.
5. Edit the #689 body: the constraint on `design/canvas/` now names the refresh steps. Add a check for the install and a check for the hashes.

## Risks

- A publish can conflict with a canvas edit. Read, then publish again.
- The sandbox cannot run `e2e`.

## Proof

| Acceptance check               | Proven by                    |
| ------------------------------ | ---------------------------- |
| The install has the components | The canvas file list         |
| `canvas/` matches the canvas   | The hash output in the PR    |
| The snapshots match            | The workflow run, then `e2e` |
