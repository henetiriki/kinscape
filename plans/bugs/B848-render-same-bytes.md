# Plan: B848: The Render workflow changes the map-desktop-filters JPG on a branch that does not touch it

- **Spec:** #848 (Bug; found on PR #847)
- **Status:** approved

## Approach

The data point to the render, not to the runner. Each flip changed one JPG, but 24 map snapshots draw the same filters. A change of CPU between runners changes all 24. So one page can raster its filter tiles in a different order on each run. `scripts/design-shots.mts` launches Chromium with `--num-raster-threads=1` (D1), from a new constant `LAUNCH_ARGS`. `render` and its byte compare do not change.

## Decisions

**D1 · How to remove the cause** · Decides: Tech lead

- **A.** One raster thread. The other JPGs keep their bytes.
- **B.** Find the cause first (Bug step 5). This needs a temporary edit to `design-agent-shots.yml`, a hand-back path.
- **C.** A, and `--disable-skia-runtime-opts` to pin the CPU path. Most JPGs then get new bytes once, with the 11 relationship JPGs.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · If proof run 1 rewrites JPGs** · Decides: Tech lead

Run 1, the first with the flag, can rewrite JPGs whose board did not change.

- **A.** Keep the Render commit. One line under Deviations names the JPGs. Later runs must commit nothing.
- **B.** Stop, and return to D1.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · How many proof runs** · Decides: Tech lead

Two of 10 Render commits flipped a JPG. At that rate, the unfixed render passes 3 runs about 64% of the time.

- **A.** 3 runs, as the acceptance check says.
- **B.** 10 runs. A false pass falls to about 13%.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Alternatives considered

- Compare pixels with a tolerance. The Tech lead line in "Expected per" forbids it.
- Change the board filters. The render is at fault.

## Files that change

| File                                     | New / changed | What                                       |
| ---------------------------------------- | ------------- | ------------------------------------------ |
| `plans/bugs/B848-render-same-bytes.md`   | New           | This plan                                  |
| `scripts/design-shots.mts`               | Changed       | `LAUNCH_ARGS`, passed to `chromium.launch` |
| `scripts/__tests__/design-shots.test.ts` | Changed       | A test that `LAUNCH_ARGS` has the flag     |
| `design/*.jpg`                           | Changed       | Workflow output, only under D2 A           |

## Order of work

1. Commit this plan: `plan(B848): approved by @<tech lead>`.
2. Write the `LAUNCH_ARGS` test and see it fail. Then add the constant.
3. Run the last acceptance check's commands. Push.
4. The CI agent cannot start a workflow. So the tech lead runs **Design: Render snapshots** on the branch, as D3 says. Start each run after the commit of the last run.
5. Paste each run's "Check which files changed" summary in the PR's Evidence. If run 1 lists a JPG, follow D2.
6. Check that only `chore: export and render design snapshots` commits change `design/*.jpg` or `design/source/*.html`.

## Risks

- If a later run lists a JPG, the flag is not the cause. The build stops ([big-departures rule](../README.md#big-departures)) and returns to D1.

## Proof

| Acceptance check                               | Proven by                                                    |
| ---------------------------------------------- | ------------------------------------------------------------ |
| Same bytes in separate runs; runs 2 to 10      | The run summaries list no JPG                                |
| Only the edited board's JPG changes            | `design-shots.test.ts` › `rewrites a changed JPG`            |
| `render` still writes a changed JPG            | `design-shots.test.ts` › `rewrites a changed JPG`            |
| No hand commit of a JPG or HTML snapshot       | Step 6                                                       |
| Tests, lint, typecheck, format check, words    | Their output in the PR                                       |
| Workflow rules; `guard`, `check`, moved branch | The diff edits no workflow; `design-shots-ci.test.ts`        |
| The pinned image and #793                      | The diff edits no Dockerfile; `playwright-image.test.ts`     |
| `design:check`, 51 screens                     | The CI `design` job, which does not use `LAUNCH_ARGS`        |
| JPG heights, snapshot counts, coverage         | `screens.test.ts`, `design.test.ts`, `design-export.test.ts` |
| The 11 relationship JPGs                       | Run 1's summary lists none, or D2                            |

## Out of scope

- `design-agent-shots.yml` and `design-shots-ci.mts` (hand-back paths).
