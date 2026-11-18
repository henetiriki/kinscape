# Plan: DL.19: The map furniture tests move, and /design-kit/map-furniture goes

- **Spec:** #922
- **Requirement IDs:** [NFR-05](../docs/requirements.md#nfr-05), [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

Two tests of `e2e/map-furniture.spec.ts` move to `e2e/gallery-looks.spec.ts`, and one moves to `e2e/map-zoom.spec.ts`. Then the board retires by the steps of DL.11, as `plans/DL.14-feedback-retire.md` did.

The Wordmark test reads the states `Wordmark · 44`, `Wordmark · 36` and `Wordmark · 32`. Each icon is as wide as its label, with a radius of a quarter of that. The state `Wordmark · icon only` is 44, not the 32 of the board, so the test does not read it. The phone test reads `SearchBar · pill` and `LayersButton · default` at 390px.

In `e2e/design-kit.spec.ts`, the "Map furniture" entry of `BOARD_LINKS` gets `gone: true`. The test "a board that is gone gives a 404" then opens `/design-kit/map-furniture` (see Deviations).

`DesktopOnly` and `PhoneOnly` of `app/design-kit/inputs/Board.tsx` lose their only caller, so coverage fails. Step 6.9 of DL.11 applies: the build deletes them and lists them in the PR.

## Decisions

**D1 · The focus ring test on `/`** · Decides: Tech lead

Item 4 copies the board check: it fails if any ancestor of the button has an `overflow` other than `visible`. On `main`, `.stage` (`features/map/components/Stage.module.css:4`) has `overflow: hidden`, and it holds the zoom slot. The zoom card is `--size-gutter` inside that edge, so `.stage` does not cut the 2px ring. #924 moves `Stage` to `MapLayout` with the same CSS rules.

- **A.** Copy the board check. It fails on `.stage`, so it gets `test.fail`. The PR names `.stage`, and the build files a Bug (Spec concern). While `.stage` clips, the test cannot catch a new clip on the zoom card.
- **B.** For each ancestor whose `overflow` is not `visible`, the test checks that the ring box is inside the client box of the ancestor. The ring box is the button box plus the outline offset and width. It passes on `main`, and it fails if the zoom card or a new wrapper cuts the ring. The build rewords item 4 to "no ancestor cuts its focus ring". About 10 more lines.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                    | New / changed | What                                                                                                        |
| --------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| `e2e/gallery-looks.spec.ts`             | changed       | The Wordmark test at 1440px, and the pill and layers button test at 390px (items 1, 2)                      |
| `e2e/map-zoom.spec.ts`                  | changed       | The focus ring test on `/` at 1440 × 900 (item 4, D1)                                                       |
| `e2e/map-furniture.spec.ts`             | deleted       | Item 5.2; the two tests of item 3 go with it                                                                |
| `e2e/widths.spec.ts`                    | changed       | The `describe` "a board at a small desktop width" and its test go (item 5.2)                                |
| `app/design-kit/map-furniture/`         | deleted       | `page.tsx`, `sections.tsx`, `DateDockDrawing.tsx`, `ZoomDemo.tsx`, the two stylesheets, the test (item 5.1) |
| `design/screens.json`                   | changed       | The three `style-8-*` entries go (item 5.3)                                                                 |
| `lib/design/__tests__/screens.test.ts`  | changed       | `NO_ENTRY` gains the three names, in sort order (item 5.5)                                                  |
| `e2e/design-kit.spec.ts`                | changed       | `gone: true` on "Map furniture" (items 5.6, 5.7)                                                            |
| `app/design-kit/inputs/Board.tsx`       | changed       | `DesktopOnly` and `PhoneOnly` go; the comment on line 59 names board 07 only                                |
| `app/design-kit/inputs/page.module.css` | changed       | The comment on line 19 names board 07 only                                                                  |

## Order of work

1. Add the two gallery tests. Run `npm run design:gallery`.
2. Add the focus ring test to `e2e/map-zoom.spec.ts`, as D1 says. Run it.
3. Run `git rm -r app/design-kit/map-furniture e2e/map-furniture.spec.ts`.
4. Delete the `widths.spec.ts` test, the three screen entries, and `DesktopOnly` and `PhoneOnly`. Add the three names to `NO_ENTRY`. Set `gone: true`. Fix the two comments.
5. Run `git grep -n design-kit/map-furniture -- app e2e lib design/screens.json`. Expect only `KitNav.test.tsx`, `KitMenu.test.tsx` and `e2e/design-kit.spec.ts`.
6. Run `npm run design:check` and the checks in `AGENTS.md`. Push.

## Risks

- A gallery test can fail because the card state differs from the board. Then the build stops and comments on #893. It changes no component or card state, because the Spec changes no design system file.
- #961 (DL.20) edits the same lines of `BOARD_LINKS`, `design/screens.json` and `NO_ENTRY`. #958 and #964 also edit `e2e/widths.spec.ts` and `NO_ENTRY`. The PR that merges second resolves the conflict.
- If coverage names another branch of `Board.tsx` that only the deleted board reaches, the build deletes it and lists it in the PR (DL.11 step 6.9).

## Proof

| Acceptance check | Proven by                                                                      |
| ---------------- | ------------------------------------------------------------------------------ |
| 1                | `npm run design:gallery` output in the PR                                      |
| 2                | The new test in `e2e/map-zoom.spec.ts`                                         |
| 3                | The `git grep` of step 5, pasted in the PR                                     |
| 4                | The test "a board that is gone gives a 404" in `e2e/design-kit.spec.ts`        |
| 5                | `npm run design:check`                                                         |
| 6                | `git diff main --stat -- design/canvas design/source 'design/*.jpg'` in the PR |
| 7                | `app/design-kit/surfaces/` imports each of the three files                     |
| 8                | The check output in the PR                                                     |

## Out of scope

- The `SG-Furniture` boards, their snapshots, JPGs and `design/DESIGN.md` rows, and the three `NO_ENTRY` names: DL.21 (#929).
- `Board`, `types` and `page.module.css` of `app/design-kit/inputs/`: DL.21 (#929).

## Deviations

- Spec item 5.7 says one new 404 test. The test "a board that is gone gives a 404" of DL.11 covers each `gone` board, so the build adds no test. The route stays as plain text in `BOARD_LINKS`.
- The lint rule blocks `test.fail`, so the focus ring test has an `eslint-disable-next-line` with its reason. The Bug is #991.
