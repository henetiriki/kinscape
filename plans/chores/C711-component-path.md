# Plan: C711: Document the path for a new or updated design system component

- **Spec:** #711
- **Status:** approved

## Approach

1. Add `design/COMPONENTS.md`: the two cases, the shared steps, the board swap procedure and the design agent prompt. Each step names who runs it and links to `design/CANVAS.md`.
2. Make the seven fixes in `design/CANVAS.md`, and link `COMPONENTS.md` from it.
3. Give `design/COMPONENTS.md` a 600-word budget.

## Decisions

**D1 · How `CANVAS.md` makes room** · Decides: Tech lead

`CANVAS.md` is near its 900-word budget on `main`. The fixes add about 150 words.

- **A.** Cut text that another file holds, such as the `AGENTS.md` rule in "Making the snapshots and JPGs". Shorten the steps that the fixes rewrite.
- **B.** Move the two "Fallback" paragraphs to `COMPONENTS.md`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · What fix 4 lists** · Decides: Tech lead

"Updating the install" lists no boards on `main`.

- **A.** Step 1 lists only the canvas files under `project/ds/kinscape/`.
- **B.** Step 6 also lists the `project/` boards, for the board swap.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | What              |
| ----------------------------------------- | ----------------- |
| `design/COMPONENTS.md`                    | New               |
| `design/CANVAS.md`                        | Seven fixes, link |
| `scripts/word-count.mts`                  | 600-word budget   |
| `scripts/__tests__/word-count.test.ts`    | A budget case     |
| `scripts/vercel-ignore.mts`               | Ignore the file   |
| `scripts/__tests__/vercel-ignore.test.ts` | An ignored case   |
| `docs/README.md`                          | Owner table row   |
| `scripts/doc-links.mts`                   | Allow link cycle  |

## Order of work

1. Add the test case.
2. See it fail.
3. Add the budget.
4. Edit `CANVAS.md`, then write `COMPONENTS.md`.

## Proof

| Acceptance check                   | Proven by                                             |
| ---------------------------------- | ----------------------------------------------------- |
| File, budgets                      | `npm run words`, `word-count.test.ts`                 |
| Who and link for each step         | Review                                                |
| Design agent prompt                | Review                                                |
| Seven fixes                        | One line each in the PR body                          |
| The PR of Chore #690 walks through | A PR table: the seven lines and their commits in #710 |

## Deviations

- The PR table lists only stages with a #710 commit.

## Out of scope

`plans/README.md`, `plans/TEMPLATE.md`, design system inputs.
