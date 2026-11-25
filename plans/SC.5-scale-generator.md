# Plan: SC.5: A generator builds each scale from its settings

- **Spec:** #1197
- **Requirement IDs:** none (tooling only)
- **Status:** approved

## Approach

A new module, `lib/design/scales.mts`, builds the steps of a step group from its `$extensions.kinscape` settings. `npm run tokens` writes the steps into `design/kinscape.tokens.json`, formats the file with Prettier, and then builds the outputs from the new tree. A new check, `scaleProblems`, compares each step with its settings, and `design.test.ts` runs it on the real file, as it runs `dtcgProblems`. A new helper, `stepText` in `lib/design/dtcg.mts`, gives the resolved text of a `{scale.…}` reference and the `tokenText` of any other token. `system.mts` and `groups.mts` use it (D8). `style-dictionary.mts` leaves out each `scale` token and writes the resolved value for a reference to a step (D5, D10).

The `scale` group comes first in the token file, because the other groups refer to it. Each step group holds these explicit lists of today's values:

| Step group       | Unit | Values                                                 | Step 400 |
| ---------------- | ---- | ------------------------------------------------------ | -------- |
| `scale.text`     | px   | 11, 12, 12.5, 13, 13.5, 14, 15, 16, 22, 24, 28, 32, 52 | 13       |
| `scale.line`     | px   | 12, 16, 18, 20, 22, 24, 28, 32, 40, 56                 | 20       |
| `scale.space`    | px   | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64                   | 16       |
| `scale.radius`   | px   | 2, 4, 7, 8, 9, 12, 18                                  | 8        |
| `scale.duration` | ms   | 120, 160, 240, 600, 4000                               | 600      |

These tokens become references to a step:

- each `type.<style>.size` and `type.<style>.line`;
- each `space` token;
- each `radius` token except `radius.full`;
- `motion.toast`, to `{scale.duration.500}`.

The generator rounds each product to 9 decimals before it rounds to the unit, so a halfway value that floating point puts just below the half still goes up.

## Decisions

**D13 · The names of the settings** · Decides: Tech lead

SC.7 (#1199) changes the unit of `scale.text`, `scale.line` and `scale.space` to rem. SC.12 to SC.14 (#1206 to #1208) change the mode and the inputs. The Spec names the inputs but not their keys.

- **A.** Each group has `mode` and `unit` (the DTCG unit: `px`, `ms`). The inputs are these:
  - grid: `grid`, `steps`;
  - ratio: `base`, `ratio`, `below`, `above`, `round`;
  - hybrid: `grid`, `limit`, `ratio`, `above`;
  - explicit: `values`.

  SC.7 then changes `unit` only. #1199 does not change.

- **B.** No `unit` key. The unit comes from `$type`: `dimension` gives px, `duration` gives ms. SC.7 adds the key. Cost: #1199 gets a line that adds `unit`.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- `npm run tokens` writes the token file with `JSON.stringify` only. It writes each `timingFunction` and colour list on many lines, so `npm run format:check` fails. `JSON.stringify` with two-space indent, then Prettier, keeps each line that the steps do not touch.
- `scaleProblems` in `generate`, not in a test. `generate` writes the steps first, so the check finds nothing there. The Spec puts the check in the tests.

## Files that change

| File                                            | New / changed | What                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `design/kinscape.tokens.json`                   | changed       | The `scale` group: five step groups with their settings and steps. The tokens in the list above refer to a step.                                                                                                                                                                                             |
| `lib/design/scales.mts`                         | new           | `roundTo` (halfway goes up), `stepsOf` (the steps of one group, or an error that names it), `withSteps` (the tree with each group's steps written) and `scaleProblems` (a step that differs, a missing or extra step, two equal steps). Each step gets `$type` and a `$description` that names its settings. |
| `lib/design/types.ts`                           | changed       | `ScaleSettings`, a union of the four modes.                                                                                                                                                                                                                                                                  |
| `lib/design/dtcg.mts`                           | changed       | `stepText`.                                                                                                                                                                                                                                                                                                  |
| `lib/design/system.mts`                         | changed       | `list` and `groupFor` read with `stepText`.                                                                                                                                                                                                                                                                  |
| `lib/design/groups.mts`                         | changed       | `texts` reads with `stepText`.                                                                                                                                                                                                                                                                               |
| `lib/design/notes.mts`                          | changed       | A `scale.` path needs no note, and its note is not a problem (D7).                                                                                                                                                                                                                                           |
| `lib/design/style-dictionary.mts`               | changed       | `css` and `resolvedTree` skip a `scale` token. `cssValue` writes the resolved value for a reference to a step.                                                                                                                                                                                               |
| `scripts/tokens.mts`                            | changed       | `generate` builds from `withSteps(tree)`. `run` writes the token file, formatted with Prettier, then the outputs.                                                                                                                                                                                            |
| `lib/design/__tests__/scales.test.ts`           | new           | The generator checks and the `scaleProblems` checks of the Proof table.                                                                                                                                                                                                                                      |
| `lib/design/__tests__/dtcg.test.ts`             | changed       | `stepText` resolves a step reference and keeps any other reference.                                                                                                                                                                                                                                          |
| `lib/design/__tests__/system.test.ts`           | changed       | A `space` or `type` token that refers to a step gives the step's value, not an alias.                                                                                                                                                                                                                        |
| `lib/design/__tests__/literals.test.ts`         | changed       | A `radius` literal equals a token that refers to a step.                                                                                                                                                                                                                                                     |
| `lib/design/__tests__/notes.test.ts`            | changed       | A step with a note, and a step with none, give no problem.                                                                                                                                                                                                                                                   |
| `lib/design/__tests__/style-dictionary.test.ts` | changed       | No `scale` line or `var(--scale-…)` in the CSS, no `scale` export, and settings in `$extensions` make no token.                                                                                                                                                                                              |
| `lib/design/__tests__/design.test.ts`           | changed       | `scaleProblems` on the real file is empty. "holds the resolved value of each … token" skips `scale` (D10).                                                                                                                                                                                                   |
| `scripts/__tests__/tokens.test.ts`              | changed       | `run` writes the steps into the token file. `generate` fails on settings that give a name below 100, and names the group.                                                                                                                                                                                    |
| `lib/design/__tests__/tokens-page.test.ts`      | changed       | The page has the part "Scales".                                                                                                                                                                                                                                                                              |
| `design/topics/tokens.md`                       | changed       | `scale` in the group list. The generated module has no `scale` export. A new part "Scales": the modes, the step names, the rounding rule, and how to change a scale.                                                                                                                                         |
| `scripts/word-count.mts`                        | changed       | The `tokens.md` budget goes up by the words that the part adds, to 650 at most (D11).                                                                                                                                                                                                                        |
| `docs/architecture.md`                          | changed       | The "Tokens are the one source" row adds `lib/design/scales.mts`, and says that `design.test.ts` fails on a step that differs from its settings.                                                                                                                                                             |

## Order of work

1. Write `scales.test.ts` and watch it fail. Add `scales.mts` and the `ScaleSettings` type.
2. Add `stepText`, and the changes to `system.mts`, `groups.mts`, `notes.mts` and `style-dictionary.mts`, each with its test.
3. Change `scripts/tokens.mts` and its test.
4. Add the `scale` settings to `design/kinscape.tokens.json`. Run `npm run tokens`. Change the tokens in the list above to references. Run `npm run tokens` again.
5. Run `npm run sizes`. Compare `app/tokens.css`, `design/tokens.generated.ts` and `lib/design/off-token-sizes.json` with `origin/main`.
6. Write the docs, the budget and the architecture row.
7. Run the design system steps of `design/CANVAS.md` (D12):
   1. Step 2: run `npm run design-system` on `origin/main` and on the branch. Compare `.design-system/project/`. Put the diff in Evidence.
   2. Steps 3 to 5: the tech lead runs them in a local Claude Code session with a signed-in account. The publish sends only `design-system.json`. The CI build asks in the PR and keeps it as a draft.
   3. Step 6: push the branch. No board shows the change, so step 7 does not run.
8. Run each check of AGENTS.md › Commands.

## Risks

- Prettier can write a line of the token file in a new form. Step 5 and `npm run format:check` show it. The PR diff of the token file holds only the `scale` group and the references.
- Style Dictionary walks into `$extensions` as a group. It makes a token only of an object with `$value`, so the settings hold no `$value` key. `style-dictionary.test.ts` proves it.
- A step value of the text list is not an integer (12.5, 13.5). The explicit mode copies each value, and `roundTo` does not run on it.

## Proof

| Acceptance check                                                    | Proven by                                                                                                              |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1. `app/tokens.css` and `design/tokens.generated.ts` byte-identical | `git diff origin/main --exit-code` on both after `npm run tokens`, in Evidence; `design.test.ts` keeps them up to date |
| 2. `off-token-sizes.json` byte-identical                            | `git diff origin/main --exit-code` after `npm run sizes`, in Evidence                                                  |
| 3. A changed step fails a test and names it                         | `scales.test.ts`: `scaleProblems` on a tree with one step changed; `design.test.ts` on the real file                   |
| 4. Grid, unit 4, four steps                                         | `scales.test.ts`                                                                                                       |
| 5. Ratio, base 16, 1.25, one below, two above, round 1              | `scales.test.ts`                                                                                                       |
| 6. Hybrid, grid 4 up to 16, ratio 1.5 for two steps                 | `scales.test.ts`                                                                                                       |
| 7. Four steps below the base fails and names the scale              | `scales.test.ts`; `scripts/__tests__/tokens.test.ts`                                                                   |
| 8. Halfway rounds up                                                | `scales.test.ts`: `roundTo(2.5, 1)`, `roundTo(6, 4)` and a ratio product at a half                                     |
| 9. Two equal steps fail and name the scale                          | `scales.test.ts`: ratio 1.1, round 4                                                                                   |
| 10. `.design-system/project/` byte-identical except the stamps      | The step 7.1 diff, in Evidence                                                                                         |
| 11. "Scales" part, `npm run words` passes                           | `tokens-page.test.ts`; `npm run words`                                                                                 |
| 12. The checks pass                                                 | The outputs of AGENTS.md › Commands, in Evidence                                                                       |
| 13. Steps 2 to 6 done                                               | The step 7 commits and the canvas copy commit                                                                          |
| 14. Canvas copy sha256                                              | Step 5.5 of `design/CANVAS.md`, in Evidence                                                                            |

## Out of scope

- The `map` label sizes (`map.*-label.size`). They are map drawing values, and #1188 gives these no scale.
- The Motion part of `design/topics/foundations.md`. It is a design system input, and check 10 keeps the README byte-identical. SC.8 (#1200) changes the motion tokens.

## Deviations

- Big: `scripts/__tests__/word-count.test.ts` ("design/topics/tokens.md has a budget of 500") fails, because D11 raises the budget to 640. The plan does not list this test, so I left it as it is. The tech lead changes its expected value to 640.

- The `tokens.md` budget is 640 words, inside the 650 limit.
- `scripts/tokens.mts` runs `dtcgProblems` after `withSteps`, because a reference to a step names no token before the steps exist.
- A hand edit of a step is tested through `scaleProblems`; `generate` and `run` rewrite the step.
- Step 2 of Changing the design system (the `npm run design-system` comparison) and steps 3 to 6 are not run in this build. See the PR comment.
