# Plan: DM.3: Design check

- **Spec:** #114 (Intent #111)
- **Status:** approved

## Approach

A Playwright project, `design`, runs one test per screen in `design/screens.json`. `npm run e2e` runs it with the other tests, so CI builds once; `npm run design:check` runs it alone, and `DESIGN_SCREENS=<name>` narrows it. Each test renders the route, plus the named `state` function from `e2e/design-states.ts`, and the snapshot at the screen's viewport. It writes `built.png`, `design.png`, `diff.png` and `side-by-side.png` (all three, for `/match-design`) to `test-results/design/<screen>/`.

`lib/design/check.mts` holds the pure parts, unit-tested: it validates `screens.json`, compares pixels outside the mask and ignore areas, and formats the summary table. A reporter, `e2e/design-reporter.ts`, writes that table to `$GITHUB_STEP_SUMMARY`. A failing `blocking` screen fails its test, and the existing `github` reporter annotates it with the test name. A missing snapshot, unknown state or a non-200 route fails with its name.

## Decisions

**D1 · How the map is masked** · Decides: Tech lead
Panels sit on top of the map, so a box over it would hide them too.

- **A.** Screenshot each page again with the map hidden (`.maplibregl-canvas`, the snapshot's `svg[role="img"]`). The pixels that change on either page are the mask.
- **B.** A fixed ignore rectangle per screen in `screens.json`.
- **Other:** your own.

Recommended: A, because it follows any layout without editing `screens.json`.

**Answer:** A

**D2 · What compares the pixels** · Decides: Tech lead

- **A.** `pixelmatch` 8 (ISC) and `pngjs` 7 (MIT) as dev dependencies; `pixelmatch` skips anti-aliased pixels.
- **B.** Our own loop over the PNG bytes, decoded in the browser. No dependency, but no anti-aliasing filter.
- **Other:** your own.

Recommended: A, because anti-aliasing noise is the Spec's first concern.

**Answer:** A

**D3 · The blocking threshold** · Decides: Tech lead
A pixel differs at `pixelmatch`'s default colour threshold, 0.1.

- **A.** Over 0.5% of the unmasked pixels fails.
- **B.** Over 0.1% fails.
- **Other:** your own.

Recommended: A, because font versions differ (next/font against Fontsource) and 0.5% still catches a moved panel. Tune it in `screens.json` once screens become `blocking`.

**Answer:** A

## Files that change

| File                                         | New / changed | What                                                        |
| -------------------------------------------- | ------------- | ----------------------------------------------------------- |
| `design/screens.json`                        | New           | `map-desktop`: `/`, 1440 × 900, `report`; the threshold     |
| `lib/design/check.mts` and its test          | New           | Validate, compare, summarise                                |
| `e2e/design-check.spec.ts`                   | New           | Render, mask, write the images                              |
| `e2e/design-states.ts`, `design-reporter.ts` | New           | State functions (none yet); job summary                     |
| `playwright.config.ts`                       | Changed       | `design` project; `github` reporter in CI                   |
| `.github/workflows/ci.yml`                   | Changed       | Upload `test-results/design` with `if: ${{ !cancelled() }}` |
| `.claude/skills/match-design/SKILL.md`       | New           | Run one screen, show `side-by-side.png`, list fixes         |
| `package.json`, `package-lock.json`          | Changed       | `design:check`; D2 packages                                 |
| `design/DESIGN.md`                           | Changed       | Two lines: the check and how a screen becomes `blocking`    |

## Order of work

1. `check.mts`, test first.
2. Spec, states, reporter, config.
3. CI upload, then the skill and `DESIGN.md`.
4. Run the checks; push a throwaway commit listing `map-desktop` as `blocking`, link the failing run, revert.

## Risks

- **A dev server on port 3000** is reused locally and shows the Next.js badge: the skill says to stop it.
- **Translucent panels over the map** fall inside the mask under D1 A; the screen Spec adds an ignore area if that hides a real difference.
- **The upload action** must be pinned to a full commit SHA (`docs/security.md`).

## Proof

| Acceptance check                       | Proven by                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `report` screen differs: passes, lists | Unit test of the summary; this PR's CI run shows the summary row and artifact             |
| `blocking` past threshold: fails       | Unit test; the throwaway commit's run fails with the screen in the summary and annotation |
| Differences only in the map: matches   | Unit test: images differing only inside the mask score 0%                                 |
| `/match-design map-desktop`            | Run locally; paste the side-by-side image in the PR                                       |
| Missing route or snapshot: fails       | Unit tests for both, each error naming it                                                 |

## Out of scope

Making any screen match; listing screens other than `map-desktop`.
