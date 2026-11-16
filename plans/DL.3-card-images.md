# Plan: DL.3: Card images: CI compares each component card with a committed PNG

- **Spec:** #896
- **Requirement IDs:** None. The Spec changes tooling only.
- **Status:** approved

## Approach

The gallery spec compares a full-page screenshot of each gallery file with `design/cards/<Name>-<width>.png` through `toHaveScreenshot`, with no pixel tolerance. `e2e/gallery.config.ts` sets `snapshotPathTemplate` and starts Chromium with `--num-raster-threads=1`, as the JPG render does (Bug #848). Outside the pinned image, the spec skips only the comparison and prints one line (D1). The render job of "Design: Render snapshots" runs `npm run design:gallery -- --update-snapshots`. In Playwright 1.65 that flag rewrites only the images that differ (check 4). A unit test fails on a file in `design/cards/` with no card (check 6).

This is a [hand-back](README.md#hand-back): the tech lead builds it.

## Decisions

**D1 · How the gallery spec knows that it runs in the pinned image** · Decides: Tech lead

Behaviour 2 and 3 need a test that tells the pinned image from other machines. No related issue holds a value.

- **A.** Compare only when `PLAYWRIGHT_BROWSERS_PATH` is `/ms-playwright`. The Microsoft Playwright image sets it. A pure `pinnedImage(env)` in `lib/design/cards.mts` reads it. No new variable, and `ci.yml` does not change.
- **B.** A new test-only variable, which the `design` job of `ci.yml` and the render job set. It needs a Blocking decision and a row in `docs/infrastructure.md` ([new infrastructure](../docs/security.md#new-infrastructure)), and it edits `ci.yml`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · When "Changing the design system" runs the workflow** · Decides: Tech lead

On `main`, [Changing the design system](../design/CANVAS.md#changing-the-design-system) runs "Design: Render snapshots" only in step 7, if a board shows the change. After this Spec, each component change changes its card images. #897 (DL.4), Behaviour 2, says that the steps run the workflow.

- **A.** Step 6 also says: the tech lead runs the workflow on the branch. #897 then matches the steps.
- **B.** Change no step. The `design` job fails, and the tech lead runs the workflow (check 3). The steps then lack the run that #897 names.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                        | New / changed | What                                                                                                         |
| ------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| `lib/design/cards.mts`                      | Changed       | `CARD_WIDTHS` (from the spec), `CARD_IMAGES = 'design/cards'`, `cardImage`, `strayCardImages`, `pinnedImage` |
| `lib/design/__tests__/cards.test.ts`        | Changed       | Tests of the new functions; a test that reads `design/cards/` and names each stray file (check 6)            |
| `lib/design/shots.mts`                      | Changed       | `LAUNCH_ARGS` moves here from `scripts/design-shots.mts`, so the gallery config uses it too                  |
| `scripts/design-shots.mts`                  | Changed       | Imports `LAUNCH_ARGS`                                                                                        |
| `e2e/gallery.config.ts`                     | Changed       | `snapshotPathTemplate`; `launchOptions.args`                                                                 |
| `e2e/design-gallery.spec.ts`                | Changed       | After the present checks: the comparison, or the skip line                                                   |
| `scripts/design-shots-ci.mts`               | Changed       | `parseStatus` returns `cards`; `check` accepts them; `summary` lists them                                    |
| `scripts/__tests__/design-shots-ci.test.ts` | Changed       | New cases for `design/cards/*.png`                                                                           |
| `.github/workflows/design-agent-shots.yml`  | Changed       | Render step "Render the card images"; upload and `git add` include `design/cards/*.png`; header comment      |
| `.gitattributes`                            | Changed       | `design/cards/*.png linguist-generated`                                                                      |
| `AGENTS.md`                                 | Changed       | The workflow also makes `design/cards/`; never edit those three                                              |
| `design/CANVAS.md`                          | Changed       | "Making the snapshots and JPGs" names `design/cards/`; step 6 if D2 is A                                     |
| `docs/glossary.md`                          | Changed       | "Card JPG" becomes "Card image" (Behaviour 8)                                                                |
| `design/cards/*.png`                        | New           | 90 images (45 cards, two widths), which the workflow commits                                                 |
| `plans/DL.3-card-images.md`                 | New           | This plan                                                                                                    |

The `summary` and `check` tests of `design-shots-ci` change: a new summary section, a new error text ([failing-tests rule](README.md#failing-tests)).

## Order of work

1. Write the tests of the new functions in `cards.test.ts`. See them fail on the behaviour. Then write the functions. Move `LAUNCH_ARGS`.
2. Change the config and the spec. Run `npm run design:gallery` outside the image: 90 pass and the skip line shows (check 7).
3. Write the `design-shots-ci` tests, see them fail, then change the script. Change the workflow, `.gitattributes` and the docs.
4. Push and mark the PR ready, because a draft PR does not run the `design` job. The first run fails for each card with no image (check 5).
5. The tech lead runs "Design: Render snapshots". It commits 90 images, and CI passes (check 1).
6. Commit a one-line CSS change to `Button.module.css`. CI fails and names `Button` and the width (check 2). Run the workflow, and CI passes (check 3). Revert both commits.
7. Run the workflow again: the commit job does not run (check 4).
8. Run the checks in `AGENTS.md` › Commands. Paste the output, the total size of `design/cards/` and the time of the gallery step in Evidence.

## Risks

- **Two renders of one commit differ (#848).** Then check 4 fails. The Spec says: stop and report it on #893.
- **`PLAYWRIGHT_BROWSERS_PATH` is not set in the image (D1 A).** Then CI skips each comparison and passes. Step 4 must show 90 failures, or the build stops and asks.
- **Another Playwright image on a laptop** passes D1 A and can differ by a pixel. Nobody does this. A version check costs about 20 lines.

## Proof

| Acceptance check                  | Proven by                                                        |
| --------------------------------- | ---------------------------------------------------------------- |
| 1. Two PNGs for each card         | CI run of step 5; `cards.test.ts`                                |
| 2. A CSS change fails the job     | CI run of step 6                                                 |
| 3. The workflow fixes it          | The workflow commit and the next CI run of step 6                |
| 4. No change, no commit           | Workflow run of step 7                                           |
| 5. A card with no image fails     | CI run of step 4                                                 |
| 6. A stray image fails `npm test` | `cards.test.ts`                                                  |
| 7. Skipped outside the image      | Output of step 2                                                 |
| 8. The "Card image" row           | `git grep -n -e "Card JPG" -e "Planned (#893)" docs/glossary.md` |
| 9. `npm test` with 100% coverage  | `npm test` output                                                |

## Out of scope

Each item of the Spec's "Out of scope / carried forward".
