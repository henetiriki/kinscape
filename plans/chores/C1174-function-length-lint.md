# Plan: C1174: Fail lint on a function over 60 lines

- **Spec:** #1174
- **Requirement IDs:** None. This Chore changes tooling only.
- **Status:** approved

## Approach

A new block in `eslint.config.mjs` turns on `max-lines-per-function` for each JavaScript and TypeScript file outside `**/__tests__/**` and `e2e/**`. On `main` at `c1a35703`, a lint run with the rule on reports 47 functions, with the split of step 2. Each one gets the disable line of step 2, directly above the reported line (#1174 D3). ESLint 10 reports an unused disable as a warning, and `npm run lint` has `--max-warnings 0`. Thus a disable on a function of 60 lines or fewer fails lint. A new fitness test, `scripts/__tests__/length-disables.test.ts`, checks the reason of each disable and the cap of 47.

## Decisions

**D4 · Name the new test in _Enforcement_** · Decides: Tech lead

`docs/code-rules/pattern-table.md` says: "When you add a pattern, rule or guard, name the test or lint rule that fails when it breaks." The test of step 3 is a guard. "What to change" names no doc for it. The **Fitness tests** line, `docs/architecture.md:50`, lists `vercel-imports` and `later-tags`.

- **A.** Add `length-disables` (the reason and cap of `max-lines-per-function` disables) to that line. Cost: one line edit outside the four steps.
- **B.** Leave `docs/architecture.md` as it is. Cost: no doc names the test.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D5 · The list of tracked files** · Decides: Tech lead

`scripts/__tests__/later-tags.test.ts` has `tracked()`: each tracked `.ts`, `.tsx` and `.mts` file outside `design/canvas/`. The test of step 3 needs the same list. `docs/code-rules.md:7` says "no copied helper". Constraint 2 says "Refactor no function in this Chore". Option A moves a test helper and changes none of the 47 functions.

- **A.** Move `tracked()` to a new `scripts/__tests__/tracked.ts`. Both tests import it. Cost: one new file and an import change in `later-tags.test.ts`.
- **B.** Copy `tracked()` into the new test. Cost: two copies of one helper.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- **An ESLint suppressions file** (`eslint-suppressions.json`) in place of 47 disable lines. Step 2 and D3 fix the disable line, so the plan does not use it.
- **`linterOptions.reportUnusedDisableDirectives: 'error'`.** The default warning and `--max-warnings 0` already fail lint.

## Files that change

| File                                        | New / changed | What                                                                                                                                                                                                                                                                                      |
| ------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.mjs`                         | Changed       | A block: `files: ['**/*.{js,jsx,mjs,mts,ts,tsx}']`, `ignores: ['**/__tests__/**', 'e2e/**']`, `max-lines-per-function` with `{ max: 60, skipBlankLines: true, skipComments: true }`.                                                                                                      |
| `app/components/`                           | Changed       | One disable each: `actions/PersonRow.tsx`, `auth/SignInForm.tsx`, `auth/SignInHero.tsx`, `feedback/NoticeCard.tsx`, `forms/TextField.tsx`, `forms/TokenField.tsx`, `overlays/Menu.tsx`, `overlays/PinPopup.tsx`, `overlays/Popup.tsx`.                                                    |
| `app/screens/map-frame.tsx`                 | Changed       | One disable.                                                                                                                                                                                                                                                                              |
| `features/map/`                             | Changed       | One disable each: `components/DateDock.tsx`, `DateField.tsx`, `DateSlider.tsx`, `MapShell.tsx`, `MapView.tsx`, `layers/pins.ts`.                                                                                                                                                          |
| `features/people/components/`               | Changed       | One disable each: `FuzzyDateField.tsx`, `PeopleList.tsx`, `PersonForm.tsx`, `PersonRelationships.tsx`, `PinForm.tsx`, `RelationshipDetails.tsx`, `RelationshipPicker.tsx`. Two in `PersonField.tsx`.                                                                                      |
| `lib/design/bundle.mts`                     | Changed       | One disable (`gatherTypes`).                                                                                                                                                                                                                                                              |
| `scripts/`                                  | Changed       | One disable each: `agent-approve.mts`, `agent-gate.mts`, `agent-return.mts`, `agent-unblock.mts`, `denial-audit.mts`, `hand-back.mts`, `issue-status.mts`, `prepare-map-data.mts`, `review-threads.mts`, `workflows-diagram.mts`. Six in `design-export.mts`, two in `design-system.mts`. |
| `server/`                                   | Changed       | One disable each: `env.mts`, `trees/database-store.mts`, `trees/memory-store.mts`.                                                                                                                                                                                                        |
| `scripts/__tests__/tracked.ts`              | New           | `tracked()`, moved from `later-tags.test.ts` (D5 A).                                                                                                                                                                                                                                      |
| `scripts/__tests__/later-tags.test.ts`      | Changed       | Import `tracked()` from `tracked.ts` (D5 A). No case changes.                                                                                                                                                                                                                             |
| `scripts/__tests__/length-disables.test.ts` | New           | The test of step 3.                                                                                                                                                                                                                                                                       |
| `docs/architecture.md`                      | Changed       | Line 50: `length-disables` (D4 A).                                                                                                                                                                                                                                                        |
| `docs/code-rules.md`                        | Changed       | Tech lead: the sentence of step 4.                                                                                                                                                                                                                                                        |

## Order of work

1. Before any code change, run `npm run design-system`. Paste the sha256 of each file under `.design-system/project/` in the PR Evidence.
2. Add the `eslint.config.mjs` block. Run `npm run lint`. Check that it reports the 47 functions of the table. If the set differs, use the new set and its count (Constraint 3).
3. Add the 47 disable lines with Edit, so the format hook runs. Run `npm run lint` until it passes.
4. Write `length-disables.test.ts` test first. Its `lengthDisables(files, cap)` takes a map of path to text and returns each problem:
   - each `path:line` where a disable of `max-lines-per-function` gives another reason, or none;
   - one line when the count of disables is over `cap`.

   The test builds the rule name from parts, so the test file does not match itself. See the case "flags a disable with another reason" fail before you write the check. Other cases: 48 disables fail, 47 pass, and the tracked files with a cap of 47 give no problem.

5. Move `tracked()` (D5 A). Run `npm test`.
6. Run `npm run design-system` again. Compare each sha256 with step 1, except `project/design-system.json`. If another file differs, stop and ask the tech lead in the PR (Constraint 4).
7. Add a scratch function of 61 lines outside a test. Paste the failure of `npm run lint` in the Evidence. Then cut the function at `server/env.mts:72` (62 lines) to 60 lines. Paste the "Unused eslint-disable directive" failure. Revert both scratch changes.
8. Edit `docs/architecture.md` (D4 A).
9. Run the checks of `AGENTS.md` › Commands.
10. The tech lead builds the `docs/code-rules.md` row in a local session.

## Risks

- Prettier can move a `//` line. `PersonRow.tsx:49` reports `PersonDates) => {`, inside an intersection type. If the format hook moves a disable away from its reported line, lint still fails. Constraint 2 bans a refactor, so stop and ask the tech lead in the PR.
- `tsc` can keep a disable line in `components/index.d.ts`, or a control README can show it. Step 6 finds this.
- `docs/architecture.md` has a budget of 600 words. If `npm run words` fails on it after step 8, write a Deviation and ask the tech lead.
- Until the tech lead builds the `docs/code-rules.md` row, the doc still says "about 60 lines". Merge the PR only with all rows built.

## Proof

| Acceptance check                                                                          | Proven by                                                         |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `npm run lint` passes on the branch.                                                      | The pasted output and CI.                                         |
| A scratch function of 61 lines outside a test fails `npm run lint`.                       | The pasted failure in the Evidence (step 7).                      |
| The step-3 test fails for another reason and for 48 disables, and passes on the branch.   | `length-disables.test.ts`, with the failing line in the Evidence. |
| A disable on a function of 60 lines or fewer fails `npm run lint`.                        | The pasted "Unused eslint-disable directive" failure (step 7).    |
| `docs/code-rules.md` says "Keep a function to one phase." and has no line limit.          | The diff of the tech lead's row.                                  |
| Typecheck, words and tests pass, with 100% coverage.                                      | The pasted output.                                                |
| Each file under `.design-system/project/`, except `design-system.json`, keeps its sha256. | The two pasted lists (steps 1 and 6).                             |

## Out of scope

- A refactor of any of the 47 functions.
- A disable in a `.js` or `.mjs` file. Step 3 reads only `.ts`, `.tsx` and `.mts` files, and no such disable exists on `main`.

## Deviations

- Big: The reason of each disable ends in `(C1174)`, not `(#1174)`. `design.test.ts` rejects `#1174` as a hex colour literal, and the failing-tests rule bars a change to that test. The test of step 3 checks the new text. The tech lead accepted this in the local build.
- Big: `PersonRelationships.tsx` moves its props union to `type PersonRelationshipsProps`, against Constraint 2. Prettier moves a one-line disable out of the union, and a block pair also covers the nested callbacks. The tech lead chose this in the review fix.
- Big: `length-disables.test.ts` accepts only the exact line of step 2. It flags a block, same-line or rule-list disable. It also fails when the count is not equal to `CAP`, so each removal lowers `CAP`. The tech lead chose the equal cap in the review fix.
