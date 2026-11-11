# Plan: C728: Design system step labels

- **Spec:** #728
- **Status:** approved

## Approach

Markdown cannot number 4.1, so each sub-step is a bullet with a bold label (`- **4.1**`). Step 6 keeps "Push the branch"; its render clause moves to step 9. Step 7 takes the **Boards** bullet and links the board swap prompt. "Updating the install" moves above "Refreshing the copy"; no heading changes.

## Decisions

**D1 · Lines the done grep finds outside the steps** · Decides: Tech lead

- **A.** Add `':!design/source'`. Accept another skill's own steps.
- **B.** Also relabel those skills' steps.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Where 3.1 to 3.11 show** · Decides: Tech lead

The publish skill steps are in `SKILL.md`.

- **A.** Label them in `SKILL.md`. Step 3 says "steps 3.1 to 3.11 of the skill".
- **B.** Also copy their names into `CANVAS.md`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · What step 4.4 says about the read** · Decides: Tech lead

- **A.** Link the `tools.md` publish rules.
- **B.** Say nothing.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                            | What                                                    |
| ----------------------------------------------- | ------------------------------------------------------- |
| `design/CANVAS.md`                              | Steps 1 to 9, sub-labels                                |
| `design/COMPONENTS.md`                          | Cut                                                     |
| `.claude/skills/publish-design-system/SKILL.md` | 3.1 to 3.11                                             |
| `.claude/skills/publish-design-system/tools.md` | Labels, read rule                                       |
| `.claude/skills/refine/chore.md`                | 5.4                                                     |
| `plans/README.md`                               | Missing-components: steps 2 to 9; design-system: step 8 |
| `plans/TEMPLATE.md`                             | Steps 7 to 9 if a board shows it                        |

## Risks

- `CANVAS.md` is near its 900 words. The **Boards** bullet and the step 6 clause pay for steps 7 to 9.
- Step 3 does not link `SKILL.md`: the link cycle fails `doc-links.test.ts`.
- Hand-back paths: the tech lead builds.

## Proof

| Done check             | Proven by                   |
| ---------------------- | --------------------------- |
| Labels, grep           | The done `git grep`         |
| Links, budgets, checks | `npm test`, `npm run words` |

## Deviations

- `.claude/skills/refine/spec.md` line 20 says "2 to 9" if a board shows the change. Rule 9 of `plans/README.md` runs steps 2 to 9 for a shared component, so the Spec done check must cover steps 7 to 9 too.
- `CANVAS.md` step 5.5 and step 8 lose their push and render clauses. Step 9 owns them, so the render runs once.
