# Plan: C712: Add the design system steps to the Spec flow, and a ready check

- **Spec:** #712
- **Status:** approved

## Approach

Edit the five rule files as the Chore lists. Each new line links to [`CANVAS.md`](../../design/CANVAS.md#changing-the-design-system) or [`COMPONENTS.md`](../../design/COMPONENTS.md) for step detail. In `word-count.mts`, apply D1 to every plan path.

## Decisions

**D1 · How `## Deviations` gets room** · Decides: Tech lead

- **A.** `countWords` skips a plan's `## Deviations` section, to the next `## ` heading.
- **B.** Plans get a fixed 100-word allowance.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · How full files make room** · Decides: Tech lead

`plans/README.md` (800), `build.md` (300) and `spec.md` (650) are near their budgets.

- **A.** Cut text that another file holds.
- **B.** Raise each budget by 100.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Which two checks `spec.md` adds** · Decides: Tech lead

`chore.md` adds the CANVAS done check and the export output.

- **A.** "Steps 2 to 5 ran on this branch", and the sha256 check.
- **B.** The two checks that `chore.md` adds.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                            | What                              |
| ----------------------------------------------- | --------------------------------- |
| `plans/README.md`                               | Two rules changed, one added      |
| `.github/agent/build.md`                        | Ready check                       |
| `.claude/skills/refine/spec.md`                 | Design system question            |
| `.claude/skills/refine/chore.md`                | Follow-up done check              |
| `plans/TEMPLATE.md`                             | Order of work comment             |
| `scripts/word-count.mts`                        | D1                                |
| `scripts/__tests__/word-count.test.ts`          | D1 cases                          |
| `scripts/__tests__/plan-rule-citations.test.ts` | Add `ready-check` to `RULE_NAMES` |

## Order of work

1. Add the D1 test. See it fail.
2. Change `word-count.mts`.
3. Edit the rule files.

## Risks

The listed paths, except the scripts, are hand-back paths: the tech lead builds.

## Proof

| Done check                  | Proven by                      |
| --------------------------- | ------------------------------ |
| Rules, `build.md`, template | Review, `npm run words`        |
| `/refine` drafts            | Tech lead's runs, pasted in PR |
| Five-line Deviations        | `word-count.test.ts`           |

## Out of scope

The guard for a shared component that is not in `CONTROLS`.

## Deviations

- `plans/README.md`: D2 A cut the Draft-before-code list. The template holds it.
- `plans/README.md`: D2 A cut "any Drift means no PR" and "(it decides whether to stop)". `refresh.md` holds both.
- `plans/README.md`: D2 A cut "update both whenever the work changes". `respond.md` holds it.
- `plans/README.md`: D2 A cut "not how it got there". The same sentence says "as it would merge now".
- `plans/README.md`: D2 A cut the `claude-build.yml` and `agent-approve.mts` sentence. Rule 2 and `how-we-work.md` hold it.
- `plans/README.md`: D2 A cut the `gh issue edit` and "count, name or value" detail. `how-we-work.md` holds it.
- `plans/README.md`: D2 A cut the `bot/update-action-pins` and `revert-*` branch names. `review.md` holds them.
- `plans/README.md`: D2 A cut "(what the issue says, what the repo has)". `refresh.md` names the same pair for Drift.
- `plans/README.md`: D2 A cut the Chore branch name from the plan-pr-flow rule. The chores rule holds it.
- `plans/README.md`: the review asked for STE, so the plan-pr-flow, chores, missing-components and stale-facts rules have shorter sentences and a list.
- `plans/README.md`: the Ready check names the parts of a Chore, a Spec and a Bug. The Chore text names only the Chore parts.
- `.github/agent/build.md`: the ready check runs before the design system branch, so a design system PR gets it too.
- `.github/agent/build.md`: D2 A cut "Keep its failing line for Evidence". The test-first rule holds it.
- `scripts/__tests__/plan-rule-citations.test.ts`: added to Files that change. It lists each anchor in `plans/README.md`, so the new rule needs an entry.
