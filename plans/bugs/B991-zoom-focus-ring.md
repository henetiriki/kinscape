# Plan: B991: An ancestor of the zoom buttons has overflow hidden

- **Bug:** #991
- **Requirement IDs:** [MAP-01](../../docs/requirements.md#map-01)
- **Status:** approved

## Approach

On `main` (c48c50f), the expected failure still fails: `.stage` (`features/map/components/Stage.module.css:4`) has `overflow: hidden`, and it holds the zoom slot. The zoom card is 24px (`--size-gutter`) inside the right edge of `.stage`. The ring sticks out 4px (`--focus-offset` 2px and `--focus-width` 2px), so `.stage` does not cut it.

The Bug allows two fixes (D1). Under the recommended option, the test checks the geometry: for each ancestor whose `overflow` is not `visible`, the ring box must be inside the client box of that ancestor. The app does not change. The test loses `test.fail`, its comment and its `eslint-disable` line.

## Decisions

**D1 · How the focus ring test passes** · Decides: Tech lead

The Bug names two fixes. #924 (open, `status: draft`) moves `Stage` to `MapLayout` with its CSS rules as they are on `main` when it builds.

- **A.** Change the test. It reads the ring box from the button box, `outline-offset` and `outline-width`. It reads each clipping ancestor's client box from `getBoundingClientRect()`, `clientLeft`, `clientTop`, `clientWidth` and `clientHeight`. It expects each ring edge inside each client box, and keeps the `2px` check. It passes today, and it fails if the zoom card or a new wrapper cuts the ring. Cost: about 15 changed lines in one test, and no change to the app or to #924.
- **B.** Remove `overflow: hidden` from `.stage`. The test does not change. Then an overflow from the map (`100vw` × `100dvh` in `app/globals.css`), the phone sheet or the account menu card reaches the page, and the page can scroll. This touches `/`, `/screens/add-pin` and `/screens/map-account-menu`. Cost: one CSS line, a manual check of the three routes on a phone and on desktop, and `npm run design:check`. If #924 merges first, `MapLayout` is in `CONTROLS`, so the change also runs steps 2 to 7 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system).
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- `overflow: clip` with `overflow-clip-margin` on `.stage`: its `overflow` is still not `visible`, so the test as written still fails.
- Delete the test: nothing then catches a cut ring on the zoom card.

## Files that change

Under D1 A:

| File                                 | New / changed | What                                                                                                                                                       |
| ------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/map-zoom.spec.ts`               | Changed       | The focus ring test becomes `test`, without `test.fail`, its comment and its `eslint-disable` line. It checks the ring box against each clipping ancestor. |
| `plans/bugs/B991-zoom-focus-ring.md` | New           | This plan.                                                                                                                                                 |

Under D1 B, `features/map/components/Stage.module.css` loses line 4 in place of the test change. `e2e/map-zoom.spec.ts` only loses `test.fail`, its comment and its `eslint-disable` line.

## Order of work

1. Run `git fetch origin main`. Rebase `bug/B991-zoom-focus-ring` on `origin/main`. Commit this plan as `plan(B991): approved by @<tech lead>`.
2. Make the change that D1 chooses.
3. Show that the test can fail. Add `overflow: hidden` and `right: 0` to `.zoom` in `Stage.module.css` for one local run. See the test fail on the ring check. Remove the edit, and paste the failing line in the PR Evidence.
4. Run `npm run e2e -- e2e/map-zoom.spec.ts` and `npm run e2e -- e2e/widths.spec.ts`. Under D1 B, also run `npm run design:check`.
5. Run the checks in `AGENTS.md` › Commands.
6. Push, and mark the PR ready.

## Risks

- **Fractional pixels.** A box edge can be a fraction of a pixel. The test compares edges with a 0.5px tolerance, so a rounding error does not fail it.
- **Order with #924.** If #924 merges first, the comment on line 193 names `Stage.module.css`, which is then gone. Under D1 A the comment goes, so the order does not matter. Under D1 B, the build edits the stylesheet at its new path.

## Proof

| Acceptance check                                 | Proven by                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| No ancestor cuts the focus ring of a zoom button | `e2e/map-zoom.spec.ts` "no ancestor of a zoom button clips its focus ring" |
| The test has no `test.fail`                      | `git grep -n "test.fail" e2e/map-zoom.spec.ts` gives nothing               |
| The test can fail                                | The failing line from step 3 in the PR Evidence                            |
| MAP-01: the zoom card still works and lines up   | The other tests in `e2e/map-zoom.spec.ts`                                  |
| No map route scrolls sideways                    | `e2e/widths.spec.ts`                                                       |

## Out of scope

- The other `overflow` rules in the app.
- The move of `Stage` to `MapLayout` (#924).
