# Plan: B1053: The real ZoomControls card draws its corners differently from the Map board

- **Spec:** #1053
- **Requirement IDs:** None (design only). Must not break: [MAP-01](../../docs/requirements.md#map-01).
- **Status:** approved

## Approach

The `Map` board drops its drawn zoom card and mounts the real `ZoomControls` in the `zoom` slot: `vals.chrome ? h(K.ZoomControls) : undefined`. The tech lead chose the real card (#1053 D1: A, Expected per). The `account` variant sets `chrome` to false, so `map-account-menu` keeps no card and does not change. The other ten `Map` snapshots take the real card as their new baseline.

No component, token or `CONTROLS` entry changes, so no step of [Changing the design system](../../design/CANVAS.md#changing-the-design-system) applies. The canvas install is current: #1054 check 11 matched it, and only #1059 and #1060 merged after it. Neither changed a component. Only the tech lead or a local session edits `design/canvas/` ([D2](#decisions)).

Do not use the [board swap prompt](../../design/COMPONENTS.md#board-swap-prompt): it keeps the old board on a pixel change, and this Bug expects a change inside the card.

## Decisions

**D2 · Who builds this Bug** · Decides: Tech lead

The CI build agent cannot edit `design/canvas/`. No path of this Bug is in `.github/CODEOWNERS`, so `claude-hand-back.yml` adds no `hand-back` label. In #1052 (D1: A), the tech lead chose a hand-back for the same kind of board swap.

- **A.** Hand-back: the tech lead adds the `hand-back` label. A local session that the tech lead starts does steps 1, 2, 4 and 5 of Order of work. Cost: one local session.
- **B.** Split: a local session does steps 1 and 2. The CI build agent does steps 4 and 5. Cost: one more hand-off, and the CI run needs Chromium for check 2.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- Change `ZoomControls` to a white card with `overflow: hidden`. The tech lead chose the real card, its comment says why it has no `overflow: hidden`, and #920 must not change its card.

## Files that change

| File                                            | New / changed | What                                                                                                  |
| ----------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| `design/canvas/project/Map.dc.html`             | changed       | The `zoom` value is `vals.chrome ? h(K.ZoomControls) : undefined`. The drawn card and its `mount` go. |
| `design/canvas/VERSION`                         | changed       | Line 2: the canvas version (5.3).                                                                     |
| `design/source/` and `design/*.jpg` of 10 shots | changed       | The render workflow. All `Map` snapshots except `map-account-menu`.                                   |
| `plans/bugs/B1053-map-zoom-card.md`             | new           | This plan.                                                                                            |

## Order of work

1. A local Claude Code session that the tech lead starts, with a signed-in account, edits the `zoom` slot of `project/Map.dc.html` on the canvas with the Artifact tool, as the table says.
2. The same session runs "Refreshing the canvas copy" (5.1 to 5.5). It posts the sha256 pair of `Map.dc.html` (check 4) and the `npm run design:export` output (check 2) in the PR. It discards the exported `source/` changes, commits `design/canvas/` alone and pushes.
3. The tech lead runs Design: Render snapshots on the branch.
4. Compare each of the 11 JPGs with `origin/main` (check 3). Use `cmp` for `map-account-menu`. For the other ten, use `changedPixels` of `lib/design/check.mts` and post the box that holds the changed pixels.
5. Run the [Commands](../../AGENTS.md#commands) checks (check 5). Do the ready check. Write the PR body.

## Risks

- **A pixel changes outside the card**, for example the shadow. Both cards use the same radius, shadow and 44px buttons, so this is unlikely. If check 3 fails, stop for the tech lead.
- **The JPG blocks spread a change.** A JPG codes 8×8 blocks, so a changed pixel can change its block. Read "inside the zoom card" as the card box and its shadow, widened to whole blocks.
- **#1055 waits on this Bug** and edits the `dock` slot of `Map.dc.html`. It takes the JPGs of this Bug as its baseline (its check 5).

## Proof

| Acceptance check                                   | Proven by                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1. The `zoom` slot mounts `ZoomControls`           | Read the slot; `git grep 'aria-label="Zoom in"'` on the board has no match                        |
| 2. The export passes on the 11 snapshots           | The `npm run design:export` output in the PR                                                      |
| 3. `map-account-menu` same, ten differ in the card | `cmp`; the changed-pixel boxes of step 4                                                          |
| 4. Same sha256, `Map.dc.html`                      | The 5.2 pair in the PR                                                                            |
| 5. Test, typecheck, lint, coverage                 | The outputs in the PR                                                                             |
| Must not break: #924 `MapLayout` and other slots   | Read the board; the boxes of check 3 hold only the card                                           |
| Must not break: #1052 baseline                     | Step 4 compares with `origin/main`, which holds the #1060 JPGs                                    |
| Must not break: #920 `ZoomControls` card           | `git diff origin/main -- design/cards/ features/` is empty                                        |
| Must not break: MAP-01, no app file                | `git diff --stat origin/main` names only `design/` and `plans/`; `npm run e2e` passes (pan, zoom) |

## Deviations

- Nine JPGs differ, not ten: the open account menu of `map-account-menu-proposed` covers the whole zoom card, so its JPG is byte-identical.

## Out of scope

- The `dock` slot: #1055.
- The `MapLayout` swaps of #925.
