# Plan: C729: Canvas constraint for design system Chores

- **Spec:** #729
- **Status:** draft

## Approach

`design/CANVAS.md` gets an **Issue text** bullet in "Changing the design system". It holds the Constraint sentence and the done check bullet. `/refine chore`, `/refine spec`, rule 16, `TEMPLATE.md` and `rules.md` link to it. No file copies the sentence.

## Decisions

**D1 · Where the `CANVAS.md` words come from** · Decides: Tech lead

The file has 893 of 900 words. The sentence adds about 25.

- **A.** Merge it with the **Done check** bullet. Cut the "With no Chromium" line, which step 5.4 repeats, and the `DESIGN.md` pointer.
- **B.** Cut other text that you name.
- **Other:** your own.

Recommended: A, because each cut text is in another place.

**D2 · Where a Spec uses the sentence** · Decides: Tech lead

The Spec form has no Constraints box.

- **A.** Line 20 says to put it in "Out of scope / carried forward".
- **B.** Line 20 links the sentence and names no box.
- **Other:** your own.

Recommended: A, because a reader then finds it.

## Files that change

| File                             | What                                       |
| -------------------------------- | ------------------------------------------ |
| `design/CANVAS.md`               | **Issue text** bullet, D1 cuts             |
| `.claude/skills/refine/chore.md` | Link replaces "Omit"                       |
| `.claude/skills/refine/spec.md`  | Link replaces "Omit" (D2)                  |
| `plans/README.md`                | Rule 16: the steps' edits are no deviation |
| `plans/TEMPLATE.md`              | Decisions: an option names its Constraint  |
| `.github/agent/rules.md`         | Chore filing rule                          |

## Risks

- `plans/README.md` is near its 900 words. Rule 16 gets one sentence.
- Hand-back paths: the tech lead builds.

## Proof

| Done check                     | Proven by                                                |
| ------------------------------ | -------------------------------------------------------- |
| Sentence once, links           | `git grep`, `doc-links` test                             |
| Rule 16, template, filing rule | The diff                                                 |
| Budgets, checks                | `words`, `format:check`, `lint`, `typecheck`, `npm test` |

## Deviations
