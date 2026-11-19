# Plan: B1052: The real SearchBar draws a pixel or two differently from the Map board search bar

- **Spec:** #1052
- **Requirement IDs:** None (design only). Must not break: [EXP-04](../../docs/requirements.md#exp-04).
- **Status:** draft

## Approach

The `Map` board drops its drawn search bar and mounts the real `SearchBar` in the `search` slot: `vals.chrome ? h(K.SearchBar, { form: 'bar' }) : undefined`. The `Map-phone` board already mounts the pill this way. The `account` variant sets `chrome` to false, so `map-account-menu` keeps no bar and does not change. The other ten `Map` snapshots take the real bar as their new baseline.

No component, token or `CONTROLS` entry changes, so no step of [Changing the design system](../../design/CANVAS.md#changing-the-design-system) applies. The canvas install is current: #1054 check 11 matched it, and no `SearchBar` or `TextField` file changed after it. Only the tech lead or a local session edits `design/canvas/`, so a local session edits the board and refreshes the copy ([D1](#decisions)).

Do not use the [board swap prompt](../../design/COMPONENTS.md#board-swap-prompt): it keeps the old board on a pixel change, and this Bug expects a change inside the bar.

## Decisions

**D1 · Who builds this Bug** · Decides: Tech lead

The CI build agent cannot edit `design/canvas/`. No path of this Bug is in `.github/CODEOWNERS`, so `claude-hand-back.yml` adds no `hand-back` label. In #1054 (D6), the tech lead added the label, and a local session built it all.

- **A.** Hand-back: the tech lead adds the `hand-back` label. A local session that the tech lead starts does steps 1, 2, 4 and 5 of Order of work. Cost: one local session.
- **B.** Split: a local session does steps 1 and 2. The CI build agent does steps 4 and 5. Cost: one more hand-off, and the CI run needs Chromium for check 2.
- **Other:** your own.

Recommended: A, because one session then holds the canvas hashes, the export output and the pixel comparison.

## Alternatives considered

- Change `SearchBar` to match the drawn bar. The tech lead chose the real bar (Expected per), and #920 must not change its card.
- Keep the drawn bar and move its icon, placeholder and hint by 1px. Check 1 needs the real component.

## Files that change

| File                                            | New / changed | What                                                                                                   |
| ----------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `design/canvas/project/Map.dc.html`             | changed       | The `search` value is `vals.chrome ? h(K.SearchBar, { form: 'bar' }) : undefined`. The drawn bar goes. |
| `design/canvas/VERSION`                         | changed       | Line 2: the canvas version (5.3).                                                                      |
| `design/source/` and `design/*.jpg` of 10 shots | changed       | The render workflow. All `Map` snapshots except `map-account-menu`.                                    |
| `plans/bugs/B1052-map-search-bar.md`            | new           | This plan.                                                                                             |

## Order of work

1. A local Claude Code session that the tech lead starts, with a signed-in account, edits the `search` slot of `project/Map.dc.html` on the canvas with the Artifact tool, as the table says.
2. The same session runs "Refreshing the canvas copy" (5.1 to 5.5). It posts the sha256 pair of `Map.dc.html` (check 4) and the `npm run design:export` output (check 2) in the PR. It discards the exported `source/` changes, commits `design/canvas/` alone and pushes.
3. The tech lead runs Design: Render snapshots on the branch.
4. Compare each of the 11 JPGs with `origin/main` (check 3). Use `cmp` for `map-account-menu`. For the other ten, use `changedPixels` of `lib/design/check.mts` and post the box that holds the changed pixels.
5. Run the [Commands](../../AGENTS.md#commands) checks (check 5). Do the ready check. Write the PR body.

## Risks

- **The export rejects a part of the real bar.** The phone board mounts the pill, and #1049 rendered the bar, so this is unlikely. If it fails, stop: check 2 changes.
- **A pixel changes outside the bar**, for example the shadow or the bar width. The real bar uses the same tokens as the drawn bar (52px high, a 340px field). If check 3 fails, stop for the tech lead.
- **The JPG blocks spread a change.** A JPG codes 8×8 blocks, so a changed pixel can change its block. Read "inside the search bar" as the bar box, widened to whole blocks.
- **#1053 and #1055 also edit `Map.dc.html`** (the `zoom` and `dock` slots). The later branch rebases on the earlier one. Its render takes the earlier JPGs as the baseline, as #1055 says.

## Proof

| Acceptance check                                  | Proven by                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1. The `search` slot mounts `SearchBar` (`bar`)   | Read the slot; `git grep "Search people and places"` on the board has no match   |
| 2. The export passes on the 11 snapshots          | The `npm run design:export` output in the PR                                     |
| 3. `map-account-menu` same, ten differ in the bar | `cmp`; the changed-pixel boxes of step 4                                         |
| 4. Same sha256, `Map.dc.html`                     | The 5.2 pair in the PR                                                           |
| 5. Test, typecheck, lint, coverage                | The outputs in the PR                                                            |
| Must not break: #924 `MapLayout` and other slots  | Read the board; the boxes of check 3 hold only the bar                           |
| Must not break: #920 `SearchBar` card             | `git diff origin/main -- design/cards/` is empty                                 |
| Must not break: #925 other boards                 | `git diff --stat origin/main -- design/canvas/project/` names only `Map.dc.html` |
| Must not break: EXP-04, no app file               | `git diff --stat origin/main` names only `design/` and `plans/`                  |

## Out of scope

- The `zoom` slot: #1053.
- The `dock` slot: #1055.
- The `MapLayout` swaps of #925.
