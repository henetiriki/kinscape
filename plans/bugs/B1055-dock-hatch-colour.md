# Plan: B1055: The DateDock and the Legend cannot mount on a board because the export rejects color-mix()

- **Spec:** #1055
- **Requirement IDs:** None (design only). Must not break: [BND-04](../../docs/requirements.md#bnd-04).
- **Status:** approved

## Approach

`lib/ui/hatch.ts` exports `HATCH_LINE`, `rgba(139, 74, 28, 0.34)`, built from `map.hatch`. `--hatch-line` and the `Legend`'s `--legend-hatch` take it, so the colour has one source. Chromium computes the old `color-mix()` as the same colour, so the cards keep their pixels (check 6).

The fix changes components in `CONTROLS`, so [Changing the design system](../../design/CANVAS.md#changing-the-design-system) applies. The export reads `design/canvas/project/ds/kinscape/`, so check 3 passes only after step 5. The `dock` slot then mounts `KinScape.DateDock` with the samples of `lib/design/samples.mts`. The `date-invalid` variant keeps its drawn dock: the real `DateDock` takes no typed text, so it cannot show `1901-02-30`.

## Decisions

**D1 · Who builds this Bug** · Decides: Tech lead

The CI build agent cannot run steps 4 and 5 ([design-system rule](../README.md#design-system)). No path of this plan is in `.github/CODEOWNERS`, so no `hand-back` label comes. #1052 and #1053, with no code, were hand-backs.

- **A.** Hand-back: the tech lead adds the `hand-back` label. A local session that the tech lead starts does all of Order of work except step 6. Cost: one local session.
- **B.** Split: the CI build agent does steps 1 to 3 and keeps the PR as a draft. A local session does steps 4 and 5. The CI build agent does steps 7 and 8. Cost: two more hand-offs.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- Teach the colour check `color-mix()`. The tech lead chose `rgba()` (Expected per).
- A token that holds the `rgba()` text: two tokens for one colour.

## Files that change

| File                                                                                      | New / changed | What                                                                                                                    |
| ----------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `lib/ui/hatch.ts`                                                                         | changed       | `HATCH_LINE`; `--hatch-line` takes it. No `color-mix()`.                                                                |
| `lib/ui/__tests__/hatch.test.ts`                                                          | new           | Check 1.                                                                                                                |
| `features/map/components/Legend.tsx`                                                      | changed       | `--legend-hatch` is `HATCH_LINE`; `--legend-hatch-opacity` goes.                                                        |
| `features/map/components/Legend.module.css`                                               | changed       | The `.hatch` stripe is `var(--legend-hatch) 0 3px`. No `color-mix()`.                                                   |
| `features/map/components/__tests__/Legend.test.tsx`                                       | changed       | The hatch lines expect `rgba(139, 74, 28, 0.34)` (check 2): the behaviour changes.                                      |
| `e2e/design-export.spec.mts`                                                              | changed       | Two boards: `KinScape.DateDock` with the contested samples and epochs, and `KinScape.Legend` (check 3).                 |
| `design/canvas/project/Map.dc.html`                                                       | changed       | `dock`: no chrome, `undefined`; `date-invalid`, the drawn dock; else `h(K.DateDock, …)`. The comment gives the new why. |
| `design/canvas/project/ds/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION` | changed       | Steps 4 and 5.                                                                                                          |
| `design/source/` and `design/*.jpg` of 9 shots                                            | changed       | The render workflow: the `Map` snapshots except `map-account-menu` and `map-date-invalid`.                              |
| `plans/bugs/B1055-dock-hatch-colour.md`                                                   | new           | This plan.                                                                                                              |

## Order of work

1. Write the tests of checks 1 and 2. See them fail on the `color-mix()` value, and paste the failing line in the PR.
2. Change `hatch.ts`, `Legend.tsx` and `Legend.module.css`. Add the two e2e boards. They pass only after step 5.
3. Run `npm run design-system` (design step 2).
4. A local Claude Code session that the tech lead starts, with a signed-in account, runs `/publish-design-system` and "Updating the install" (design steps 3 and 4).
5. The same session edits the `dock` slot of `project/Map.dc.html` on the canvas, as the table says. It runs "Refreshing the canvas copy" (5.1 to 5.5). It posts the sha256 pairs (check 7 and the `ds/kinscape/` files) and the `npm run design:export` output in the PR. It discards the exported `source/` changes, commits `design/canvas/` alone and pushes.
6. The tech lead runs Design: Render snapshots on the branch (design steps 6 and 7 in one render).
7. Compare the JPGs and card images with `origin/main`. Use `cmp` for `map-account-menu`, `map-date-invalid`, the `Map-phone` JPGs, `DateDock-1440.png` and `Legend-1440.png`. For the other nine, post the `changedPixels` box of `lib/design/check.mts`. List each visible difference of the dock for the tech lead (check 5).
8. Run the [Commands](../../AGENTS.md#commands) checks. Do the ready check. Write the PR body.

## Risks

- **The drawn dock differs from the real dock.** For example, the drawn slider hatch is `rgba(139,74,28,0.55)`. The PR lists each difference (Expected per).
- **A card image changes.** The computed colours are the same, so this is unlikely. If check 6 fails, stop for the tech lead.
- **The JPG blocks spread a change.** Read "inside the dock" as the dock box and its shadow, widened to whole 8×8 blocks.

## Proof

| Acceptance check                                            | Proven by                                                                                      |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1. `--hatch-line` is the `rgba()` value                     | `hatch.test.ts`; `git grep color-mix lib/ui/hatch.ts` has no match                             |
| 2. The `Legend` hatch is the `rgba()` value                 | `Legend.test.tsx`; `git grep color-mix features/map/components/Legend.module.css` has no match |
| 3. `snapshotProblems` empty for both boards                 | `e2e/design-export.spec.mts` in `npm run e2e`                                                  |
| 4. The `dock` slot mounts `DateDock`, except `date-invalid` | Read the slot                                                                                  |
| 5. Two JPGs same, nine differ in the dock                   | `cmp`; the boxes and the list of step 7                                                        |
| 6. Card images same                                         | `cmp` in step 7                                                                                |
| 7. Same sha256, `Map.dc.html`                               | The 5.2 pair in the PR                                                                         |
| 8. Test, typecheck, lint, coverage                          | The outputs in the PR                                                                          |
| Must not break: #924 `MapLayout` and other slots            | Read the board; the boxes of check 5 hold only the dock                                        |
| Must not break: #1052 and #1053 baseline                    | Step 7 compares with `origin/main`, which holds the #1060 and #1061 JPGs                       |
| Must not break: #921 cards                                  | `git diff origin/main -- lib/design/states.mts lib/design/samples.mts` is empty; check 6       |
| Must not break: BND-04 hatch colour                         | Checks 1, 2 and 6; `DateSlider.test.tsx` "draws a hatched span"                                |
| Must not break: #1051 `Legend`                              | The `Legend` board of check 3                                                                  |

## Out of scope

- The `dock` of `Map-phone.dc.html` and its sheet.
- A board that mounts the `Legend`: #1051.
- A typed-text prop on `DateDock` for `date-invalid`.

## Deviations

- `e2e/design-export.spec.mts` loads the samples with `createRequire`, not `import`: the Playwright config loads `model.mts` as CommonJS, so the `import` fails. Commit `test(B1055): load the samples with require`.
- The `Map` board holds the sample values as numbers: a board cannot import `lib/design/samples.mts`. Commit `dcf48ad7`.
