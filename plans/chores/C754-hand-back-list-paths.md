# Plan: C754: Label a hand-back plan PR when its Files that change is a list

- **Spec:** #754
- **Status:** draft

## Approach

Rename `tablePaths` to `planPaths`. It keeps the table rule and also takes the first path of each list item: ``/^(?:[-*]|\d+\.)\s+`([^`]+)`/`` on the trimmed line. A path after other words does not match. The header comment of `hand-back.mts` says "section", not "table".

## Decisions

**D1 · Several paths at the start of one item** · Decides: Tech lead

An item such as ``- `a.mts`, `b.mts`: what`` names two paths.

- **A.** Count only the first path, as the issue says. The new rule tells a plan to list each path.
- **B.** Count each backticked path before the first other word, as the table does.
- **Other:** your own.

Recommended: A, because the issue names one path per item.

**D2 · The last Constraint** · Decides: Tech lead

The last Constraint ends after "Do not read the Chore issue".

- **A.** The script reads paths from the plan only, never from the issue. This plan does that.
- **B.** The sentence means more. You finish it.
- **Other:** your own.

Recommended: A, because the script reads no issue now.

## Files that change

| File                                  | What                                      |
| ------------------------------------- | ----------------------------------------- |
| `scripts/hand-back.mts`               | `planPaths`, comments                     |
| `scripts/__tests__/hand-back.test.ts` | Rename; `-`, `*`, `1.` and sentence cases |
| `plans/README.md`                     | One sentence in the hand-back rule        |
| `plans/TEMPLATE.md`                   | A comment under _Files that change_       |

## Risks

- `scripts/hand-back.mts` and `plans/README.md` are hand-back paths. The tech lead builds.

## Proof

| Done check                         | Proven by                       |
| ---------------------------------- | ------------------------------- |
| `npm test`, 100% coverage          | `npm test`                      |
| `npm run words` passes             | `npm run words`                 |
| A list item gets the label         | New `run` and `planPaths` cases |
| A path in a sentence does not      | New `planPaths` case            |
| The rule asks for backticked paths | The diff                        |

## Out of scope

- The header comment of `claude-hand-back.yml` still says "table". The Constraints forbid a workflow change.

## Deviations
