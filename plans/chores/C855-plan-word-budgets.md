# Plan: C855: Raise the word budgets of plans by 50%

- **Spec:** #855
- **Status:** approved

## Approach

In `BUDGETS` in `scripts/word-count.mts`, the three plan entries change: Spec plans 600 to 900, Bug plans 600 to 900, chore plans 300 to 450. `plans/TEMPLATE.md` line 4 says "Budget: 900 words". No other entry, comment or rule changes.

In `scripts/__tests__/word-count.test.ts`, each number that comes from a plan budget changes with it:

- The `budgetFor` cases for `plans/M0.1-hello-vercel.md`, `plans/TEMPLATE.md`, `plans/bugs/B1-x.md` and `plans/chores/C1-x.md`.
- The two boundary tests become one `it.each` over a Spec, Bug and chore plan. Each case checks that a file at the budget passes and one word over fails. `main` has no boundary test for a Spec plan.
- The Deviations cases.
- "counts the sections around a Deviations section": 200 and 251 words, so the error says 451 words, budget 450.
- "checks every tracked file" and "checks only the paths given": 901 and 451 words, so each file is still one word over.

## Files that change

| File                                   | New / changed | What                    |
| -------------------------------------- | ------------- | ----------------------- |
| `scripts/word-count.mts`               | Changed       | Three plan budgets      |
| `scripts/__tests__/word-count.test.ts` | Changed       | The plan-budget numbers |
| `plans/TEMPLATE.md`                    | Changed       | "Budget: 900 words"     |

## Risks

- A test that keeps an old number passes or fails for the wrong reason. Each changed number stays at the budget or one word over it.

## Proof

| Acceptance check                             | Proven by                       |
| -------------------------------------------- | ------------------------------- |
| `BUDGETS` gives 900, 900 and 450             | `budgetFor` cases               |
| At the budget passes, one word over fails    | The new `it.each` boundary test |
| `plans/TEMPLATE.md` says "Budget: 900 words" | Review of the diff              |
| The Commands checks pass, 100% coverage      | Evidence; CI                    |

## Out of scope

- Other budgets, the `## Deviations` exclusion, the too-big rule, merged plans, `plans/README.md` and `docs/writing.md`.
