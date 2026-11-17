# Plan: DL.15: Map style in the design system README; the type sample test moves

- **Spec:** #916
- **Requirement IDs:** [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

`README_SECTIONS` gets "Map style" after "Event glyphs". `readme` then copies the section of `design/DESIGN.md`, and `plainLinks` makes `[map-style.jpg](map-style.jpg)` plain text. The unit test of `readme` expects the section and no longer rejects it.

The test "each type sample has its style tokens" moves to the `at 1440px` group of `e2e/gallery-looks.spec.ts` (D1 A). It opens the `Text` gallery file. It takes each state of the `Text` card in `CARDS` whose props set `variant`. For each state, it finds the text "Sample" in the figure that the state label names. It compares the five computed values with a probe that the five `--type-<variant>-*` variables style, as the old test does. The gallery file loads `bundle.css`, which holds `app/tokens.css`, so these variables exist there. The old camelCase-to-token conversion moves with the test, so the repo keeps one copy.

The route `/design-kit/type`, its board and `app/design-kit/mapLabels.ts` do not change.

## Files that change

| File                                  | New / changed | What                                                                                                                                                                                                                                                                                      |
| ------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/design/system.mts`               | changed       | `README_SECTIONS` gains "Map style" after "Event glyphs".                                                                                                                                                                                                                                 |
| `lib/design/__tests__/system.test.ts` | changed       | "holds the listed sections" loses `not.toContain('## Map style')` and expects the heading once, after "## Event glyphs" and before "## Copy". "has no link into the repo" also expects the plain text "map-style.jpg shows the full layer stack". The failing-tests rule lists this test. |
| `e2e/gallery-looks.spec.ts`           | changed       | New test "each Text sample has the type tokens of its variant", tagged `// NFR-06`, in the `at 1440px` group.                                                                                                                                                                             |
| `e2e/design-kit.spec.ts`              | changed       | The test "each type sample has its style tokens" goes. The map label test keeps the `tokens` and `resolveTokens` imports.                                                                                                                                                                 |
| `plans/DL.15-map-style-readme.md`     | new           | This plan.                                                                                                                                                                                                                                                                                |

## Order of work

1. Change `system.test.ts`. See it fail on the missing "## Map style" heading ([test-first rule](README.md#test-first)).
2. Add "Map style" to `README_SECTIONS`. Run `npm test`.
3. Add the new test to `gallery-looks.spec.ts`:
   - It gets the states from `CARDS`, so the count comes from `CARDS` (Behaviour 3).
   - `page.getByText('Sample', { exact: true })` must have that count.
   - In each figure, the locator for "Sample" is strict. Thus a figure with no sample or with two samples fails.
4. Run `npm run design:gallery` with no app server on port 3000.
5. Prove Acceptance check 3:
   1. In `Text.module.css`, change `.h2` to `font-size: var(--type-h3-size)`.
   2. Run `npm run design:gallery` and copy the failing line for the PR.
   3. Restore the value, and run the command again.
6. Delete the old test from `design-kit.spec.ts`.
7. Run the checks in `AGENTS.md` › Commands, and `npm run design:check`.
8. Run the steps of [Changing the design system](../design/CANVAS.md#changing-the-design-system):
   1. Run `npm run design-system`.
   2. Run `/publish-design-system` (steps 3.1 to 3.11).
   3. Run "Updating the install" (4.1 to 4.7).
   4. Run "Refreshing the canvas copy" (5.1 to 5.5).

   No board changes, so steps 6 and 7 do not apply. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 8.2 to 8.4. The session needs a signed-in account. The CI build agent asks for them in the PR and keeps the PR as a draft ([design-system rule](README.md#design-system)).

## Risks

- The Spec flags that a `Text` variant in a gallery file may not resolve the same font family as its probe. The sample and the probe read the same `--type-*-font` variable, so the risk is low. If a variant fails, the build keeps the old test, names the variant in the PR and comments on #893 (Spec concern).
- The new test checks 25 samples: the 22 variants and the three body tones. The old test checked 22. A tone changes only the colour, so the five type values stay the same.
- DL.17 (#918) also adds an entry to `README_SECTIONS`, and DL.16 (#917) changes `system.mts`. The second Spec to merge gets a merge conflict and no clash of values.
- The "Map style" section names `/design-kit/map-style`. The README then shows that route until DL.21 (#929) changes the sentence (Spec concern).

## Proof

| Acceptance check | Proven by                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| 1                | `system.test.ts` › `readme`: the headings in `README_SECTIONS` order, and no link into the repo.    |
| 2                | Order of work step 4. The PR pastes the output of `npm run design:gallery`.                         |
| 3                | Order of work step 5. The PR pastes the failing line and the run after the restore.                 |
| 4                | The PR pastes `git grep -n "each type sample has its style tokens" -- e2e` with no result.          |
| 5                | `npm run design:check` passes for `style-1-type`, `style-1-type-phone` and `design-kit-menu-phone`. |
| 6                | Order of work step 8. The PR lists each step and who ran it.                                        |
| 7                | Step 4.6 of "Updating the install" and step 5.2: the PR pastes the sha256 report.                   |
| 8                | The PR pastes the output of `npm test`, `npm run typecheck`, `npm run lint` and `npm run e2e`.      |

## Out of scope

- The route `/design-kit/type`, its three screen entries, `app/design-kit/mapLabels.ts` and the map label test: DL.21 (#929).
- The sentence that names `/design-kit/map-style` in `design/DESIGN.md`: DL.21 (#929).
