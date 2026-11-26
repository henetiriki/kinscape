# Plan: SC.7: Text, line heights and spacing use rem, and each screen holds at 200% text

- **Spec:** #1199
- **Requirement IDs:** [NFR-05](../docs/requirements.md#nfr-05), [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

`scale.text`, `scale.line` and `scale.space` get `unit: "rem"`. Their inputs stay in px. `stepsOf` in `lib/design/scales.mts` builds each step in px, as on `main`. Then `tokenOf` writes the step as px ÷ 16 in rem (D2). Each value of today ÷ 16 is an exact binary fraction, so each screen renders the same pixels at the default text size. Style Dictionary needs no change. A reference to a step gets the step's text. `numbersIn` takes only `px` text. Thus `spacePx` and `typePx` go, and `layoutPx` loses its three spacing references (D3, D10).

`keyOf` in `lib/design/groups.mts` turns a `rem` number into its px key (× 16). The literals check and the size check both read keys through `keyOf`. Thus a `16px` literal still equals a `1rem` token, and `lib/design/off-token-sizes.json` stays byte-identical.

A new spec, `e2e/large-text.spec.ts`, runs one test for each screen of `design/screens.json` at each of the two sizes (D4). Before each page loads, an init script adds a `<style>` with `html { font-size: 200% }`. The init script also runs again after the `reload` of a state step. The test opens the screen with a helper that it shares with `design-check.spec.ts`. Then it runs the `state` step and catches its error (D8). It collects these problems:

- the error of the `state` step;
- each problem that `wideNow` in `e2e/sideways.ts` gives (D11);
- each element that cuts off its own text (D9).

A pure function, `verdictFor` in `lib/design/large-text.mts`, compares the problems with the list in `lib/design/large-text.json` (D7):

- problems and no entry: it fails and names the screen, the width and each problem;
- no problems and an entry: it fails and names the entry;
- otherwise: it passes.

The spec runs in the `design` Playwright project. That project has the fixture Accounts, and the CI `design` job runs it with `npm run design:check`.

**Cut-off text.** `cutOffNow` in `e2e/large-text.ts` walks each element that has a direct text node with a letter or a digit. It keeps an element that is visible (`checkVisibility()`) and larger than 1 × 1px. The element must also have `overflow-x` or `overflow-y` of `hidden` or `clip`. On each such axis, it measures the element's text against its padding box. A problem names the element (tag and first class), the axis and the amount in px. A problem holds no text from the page.

## Alternatives considered

- Chromium's `Page.setFontSizes` (CDP) to set the browser's own text size. It is experimental and works in Chromium only. The Spec's Flagged concern accepts the root text size.
- A new Playwright project for the 200% check. `design:check` would then have to name two projects. The `design` project already has the fixture Accounts and a CI job.
- A write mode that makes the list from a run. The tests run in parallel workers, so the writes would race. The build writes the list from the failures of the CI `design` job.

## Files that change

| File                                            | New / changed | What                                                                                                                                                                                               |
| ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `design/kinscape.tokens.json`                   | changed       | `unit: "rem"` in the settings of `scale.text`, `scale.line` and `scale.space`. `npm run tokens` writes their steps in rem.                                                                         |
| `lib/design/scales.mts`                         | changed       | `tokenOf` writes a rem step as px ÷ 16. A step note names its px input.                                                                                                                            |
| `lib/design/types.ts`                           | changed       | The `ScaleSettings` comment: a rem group takes px inputs. New `LargeTextEntry` and `LargeTextResult` types.                                                                                        |
| `lib/design/groups.mts`                         | changed       | `keyOf` gives a `rem` number its px key.                                                                                                                                                           |
| `app/tokens.css`, `design/tokens.generated.ts`  | changed       | Written by `npm run tokens`.                                                                                                                                                                       |
| `lib/design/large-text.mts`                     | new           | `verdictFor` (the outcome of one screen and width) and `listProblems` (an entry with an unknown screen or width, or a second copy of an entry).                                                    |
| `lib/design/large-text.json`                    | new           | The list: `screen` and `width` of each failure on the branch.                                                                                                                                      |
| `e2e/design-open.ts`                            | new           | `openScreen`: clears the cookies for `/sign-in`, sets the size, opens the route, checks the status, and waits for the network, the fonts and the map. Moved from `design-check.spec.ts`.           |
| `e2e/design-check.spec.ts`                      | changed       | Uses `openScreen`. Its behaviour does not change.                                                                                                                                                  |
| `e2e/large-text.ts`                             | new           | `LARGE_TEXT` (the init script) and `cutOffNow`.                                                                                                                                                    |
| `e2e/large-text.spec.ts`                        | new           | `large text: <screen> at <width>` for each screen and size, and `large text: the rule` (see Proof).                                                                                                |
| `playwright.config.ts`                          | changed       | The `design` project also matches `large-text.spec.ts`. `chromium` ignores it.                                                                                                                     |
| `lib/design/__tests__/large-text.test.ts`       | new           | `verdictFor` and `listProblems` on fixtures, and `listProblems` on the real list.                                                                                                                  |
| `lib/design/__tests__/scales.test.ts`           | changed       | A rem group in each mode writes px ÷ 16. `scaleProblems` names a rem step that differs.                                                                                                            |
| `lib/design/__tests__/literals.test.ts`         | changed       | A `16px` padding literal equals a `1rem` space token.                                                                                                                                              |
| `lib/design/__tests__/sizes.test.ts`            | changed       | A `16px` padding size equals a `1rem` space token.                                                                                                                                                 |
| `lib/design/__tests__/style-dictionary.test.ts` | changed       | A rem token gets no `*Px` number, and a px token in the same group keeps its number.                                                                                                               |
| `lib/design/__tests__/design.test.ts`           | changed       | In `app/tokens.css`, each `--type-*-size`, `--type-*-line` and `--space-*` is in rem. Each `--size-*`, `--radius-*` and `--focus-*` length is in px. Each `--layout-*` is px or `var(--space-…)`.  |
| `lib/design/__tests__/tokens-page.test.ts`      | changed       | The page has the part "Units".                                                                                                                                                                     |
| `design/topics/tokens.md`                       | changed       | A part "Units": text, line heights and spacing in rem, because rem follows the reader's text size. Other kinds stay in px. A rem token gets no `*Px` number. It names the 200% check and its list. |
| `scripts/word-count.mts`                        | changed       | The `tokens.md` budget increases by the words of "Units", to 760 at most (D6).                                                                                                                     |
| `scripts/__tests__/word-count.test.ts`          | changed       | The expected budget of `tokens.md`.                                                                                                                                                                |
| `lib/design/__tests__/system.test.ts`           | changed       | The expected values of `space`, `layout-menu-offset` and `type` are in rem (see Deviations).                                                                                                       |
| `design/canvas/project/ds/kinscape/`            | changed       | `tokens.css`, `tokens.json`, `components/bundle.css`, `checksums.json` and `design-system.json`. Written by the design system steps.                                                               |
| `design/canvas/project/canvas.json`             | changed       | The `version` and `copiedAt` of the `designSystems` entry. Written by the design system steps.                                                                                                     |
| `design/canvas/VERSION`                         | changed       | Line 2 is the canvas version after the install update. Written by the design system steps.                                                                                                         |

## Order of work

1. Write the `scales`, `literals`, `sizes` and `style-dictionary` tests, and watch them fail. Change `scales.mts`, `groups.mts` and `types.ts`.
2. Set `unit: "rem"` on the three groups. Run `npm run tokens` and `npm run sizes`. Check that `off-token-sizes.json` has no diff to `origin/main`. Add the `design.test.ts` units test.
3. Run `npm run design:check` at the default text size. Each screen passes as on `main`.
4. Write `large-text.test.ts`, then `large-text.mts`. Move `openScreen` into `e2e/design-open.ts`. Add `e2e/large-text.ts`, the spec and the project change. Start with an empty list.
5. Push. Copy each failure of the CI `design` job into the list. Push again, and check that the job passes.
6. Write "Units" and set the budget.
7. Run the design system steps of `design/CANVAS.md`:
   1. Step 2: run `npm run design-system`.
   2. Steps 3 to 5: the tech lead runs them, or a local Claude Code session that the tech lead starts. The session needs a signed-in account. The CI build asks in the PR and keeps it as a draft.
   3. Step 6: push the branch. If the `design` or `gallery` job fails on a snapshot or a card image, run the workflow Design: Render snapshots on it. No board shows the change, so step 7 does not run.
8. Run each check of AGENTS.md › Commands. The tech lead adds `size: accepted` (D12).
9. Reword #1211 so that its first acceptance check also names the inner boxes other than `pre` (D11).

## Risks

- A text node's range can miss the hidden part of an ellipsis or of `overflow: clip`. The rule test proves four cases: `hidden`, `clip`, an ellipsis, and a child element that passes its parent alone. If the range misses a case, `cutOffNow` uses `scrollWidth` and `scrollHeight` for that element.
- A failure close to 1px can differ between a local run and the CI container. Step 5 takes the list from the CI job, which is the judge.
- The `design` job gets about 100 more tests. Each opens one page and takes no screenshot. The PR Evidence gives the job time before and after.
- A `style` attribute on `<html>` can clash with React hydration. The init script adds a `<style>` element instead.
- A state step can fail at the other width, for example a desktop click at 390px. Under D8 it is a failure of that screen and width, and the list holds it.

## Proof

| Acceptance check                               | Proven by                                                                                                                                                                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Default text size passes the design check   | `npm run design:check`, in Evidence                                                                                                                                                                         |
| 2. Units in `app/tokens.css`                   | `design.test.ts` units test                                                                                                                                                                                 |
| 3. A screen off the list holds at 200%         | `large-text.spec.ts` on each screen and size; `large text: the rule` on `/sign-in` with synthetic elements added (sideways page, inner box, `pre`, the four cut-off cases, a 1 × 1px box, a hidden element) |
| 4. A new failure fails and names screen, width | `large-text.test.ts`: `verdictFor` with problems and no entry                                                                                                                                               |
| 5. A passing entry fails and names the entry   | `large-text.test.ts`: `verdictFor` with an entry and no problems; `listProblems` on an unknown screen                                                                                                       |
| 6. `16px` literal equals `1rem` token          | `literals.test.ts`; `sizes.test.ts`                                                                                                                                                                         |
| 7. The checks pass, budget ≤ 760               | The outputs of AGENTS.md › Commands, in Evidence; `word-count.test.ts`                                                                                                                                      |
| 8. Steps 2 to 6 done                           | The step 7 commits and the canvas copy commit                                                                                                                                                               |
| 9. Canvas copy sha256                          | Step 5.5 of `design/CANVAS.md`, in Evidence                                                                                                                                                                 |

## Out of scope

- The `map` label sizes and other map drawing values. #1188 keeps them in px.
- Fixes for the screens on the list: SC.13.1 (#1211).

## Deviations

- Big: `lib/design/__tests__/system.test.ts` checked `space`, `layout-menu-offset` and `type` values in px. The rem change made 7 of its tests fail. The plan did not list the file. The tech lead approved the change in the local build session. The test now expects rem, and the file is in the table.
- The spec sets a 10s default timeout before the `state` step. A step that cannot run at 390px then fails in 10s, not at the 30s test limit.
- The init script adds the 200% rule as a constructed style sheet (`adoptedStyleSheets`), not as a `<style>` element. The `<style>` element did not apply: the root size stayed 16px. `large text: the rule` now checks that the root size is 32px.
- A push by the bot starts no CI run, so the list comes from a local run of `npm run design:check`, not from the CI job. The tech lead must compare it with the first CI run.
- The local build session ran steps 2 to 5 of Changing the design system. Step 3 sent 5 files to the design system and no icon. Step 4 sent the same 5 files to the canvas, and updated the `designSystems` entry. Step 5 refreshed `design/canvas/`. Step 5.4 did not run: the browser cannot start. No board changed.
- The browser cannot start in the local session (a sandbox error). `npm run design:check` and `npm run e2e` did not run there. The CI `design` and `e2e` jobs are the check. Mark the PR ready to start them.
