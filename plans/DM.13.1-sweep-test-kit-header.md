# Plan: DM.13.1: Sweep test, kit header and nav, index and menu at 0.5%

- **Spec:** #156 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** approved

## Approach

A pure `sweepProblems` checks `screens.json` against the images in `design/` and a `NOT_BUILT` list; a unit test runs it on the repo. Then I fix the kit banner, `KitNav`, the index and `KitMenu` with `/match-design` and flip the three screens to `blocking`.

"Sized as its snapshot" means the JPG's size divided by `shotFor(name).scale`. Six phone heights are wrong, so this PR corrects them: `design-kit-phone` 941 → 1325, `style-1-type-phone` 1800 → 2743, `style-2-colour-phone` 4552 → 4554, `style-4-states-phone` 2400 → 4126, `style-5-feedback-phone` 3000 → 4276, `map-style-phone` 4872 → 4854.

Differences found by reading the CSS beside each snapshot:

- **Banner (every board):** `align-items: baseline`, not `center`; nav links 22px line height.
- **Phone banner:** title in a 44px row; the Boards button has 15px text, 12px left padding and an 18px icon.
- **Phone index:** no phone rule yet. The snapshot has padding 32/16/48, gap 24, a 28/32 heading (as `kit.module.css` has), no gap inside a board, and 44px-tall links.
- **Menu:** rows 60px tall, padding 8/12, 2px inner gap, 4px apart; the current row is 600 in `--brand-hover`. "All boards" has 12px padding; the sheet 24px bottom padding.

## Decisions

**D1 · The Type board behind the menu** · Decides: Tech lead

`design-kit-menu-phone` opens the menu on `/design-kit/type`. About 30px of that board shows above the sheet, and it sits 8px too high: phone padding is 24 where the snapshot has 32.

- **A.** Fix the Type board's phone top padding and the shared board header gap (`kit.module.css`, 10 → 8) here. DM.13.2 starts from that.
- **B.** Leave the Type board to DM.13.2. If the menu stays above 0.5%, it stays `report` until then, and an acceptance check changes.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                    | New / changed | What                                                                                                             |
| ------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `lib/design/sweep.mts`                                  | New           | `jpegSize(bytes)`; `sweepProblems(raw, images, notBuilt)` lists missing, doubled, wrong-sized, `ignore`, not 0.5 |
| `lib/design/__tests__/screens.test.ts`                  | New           | `NOT_BUILT` (25 names); the repo has no problems; each problem on stubs                                          |
| `design/screens.json`                                   | Changed       | `map-desktop` out; six heights; three entries `blocking`                                                         |
| `app/design-kit/layout.module.css`                      | Changed       | Banner alignment, nav line height, phone title                                                                   |
| `app/design-kit/page.module.css`                        | Changed       | Phone index                                                                                                      |
| `app/design-kit/KitMenu.*`                              | Changed       | Button, rows, "All boards", sheet padding                                                                        |
| `app/design-kit/kit.module.css`, `type/page.module.css` | Changed       | D1 A only                                                                                                        |
| `app/design-kit/__tests__/*`                            | Changed       | Only if markup changes                                                                                           |
| `design/source/*.html`, `design/*.jpg`                  | Changed       | Only where a token disagrees with a snapshot                                                                     |

## Order of work

1. `sweep.mts`, test first; `screens.json` entries and heights.
2. Banner and nav; full `npm run design:check`, recording all 23 scores.
3. Phone index, then the menu (and D1 A).
4. Flip the three to `blocking`; lint, test, validator, e2e.
5. Throwaway commit moving the index heading 8px; link the failed run; revert.

## Risks

- **Banner fix moves every board.** The PR lists all 23 scores before and after; no board is `blocking` yet.
- **New heights change five other boards' scores**, as they now compare the whole snapshot. They are `report`, but the numbers in DM.13.2 to DM.13.7 go stale.
- **Sheet padding:** the Surfaces snapshots use 16 and 24, so I set it in `KitMenu`, not `Sheet`.

## Proof

| Acceptance check                      | Proven by                                  |
| ------------------------------------- | ------------------------------------------ |
| Every image: sized entry or not built | `screens.test.ts` on the repo              |
| No `ignore`; threshold 0.5            | `screens.test.ts`                          |
| New unlisted image fails `npm test`   | `screens.test.ts` on a stubbed list        |
| Three screens `blocking`, ≤ 0.5%      | `npm run e2e` output; the PR's score table |
| 8px move fails CI, names screen       | The linked failed run                      |
| Tests, e2e, validator, 100%           | Output in the PR                           |

## Deviations

- D1 A: also bottom padding 48, eyebrow line 16.
- `.menu > button`: `.menu button` hit Close.
- D2 A: snapshot dialogs get `will-change`.

## Out of scope

The other 20 kit screens (DM.13.2 to DM.13.7); removing `ignore` support from `check.mts`.
