# Plan: C306: Agent permission denials

- **Spec:** #306
- **Status:** approved

## Approach

The audit found 89 denials in 68 runs. Most came before C277's rules (#286), so only the gaps are fixed: deleting a tracked file (`rm`), WebSearch, and a third found in a run transcript. Claude Code 2.1.304 in CI has no Grep or Glob tool, so `rules.md` named tools that don't exist and the `grep` fallback was denied (10 times).

## Decisions

**D1 · Deleting files** · Decides: Tech lead

- **A.** `rules.md`: delete or rename with `git rm` and `git mv` (allowed by `Bash(git:*)`).
- ~~**B.** Allow `Bash(rm:*)`.~~

**Answer: A** (@henetiriki)

**D2 · WebSearch (2 denials)** · Decides: Tech lead

- **A.** Leave it denied. `rules.md`: with no web access, ask in your comment.
- ~~**B.** Allow `WebSearch`.~~

**Answer: A** (@henetiriki)

**D3 · Searching contents** · Decides: Tech lead

- **A.** Allow `Bash(grep:*)`; `rules.md` says to use it.

**Answer: A** (@henetiriki)

**D4 · Finding files** · Decides: Tech lead

- **A.** Use `git ls-files '<glob>'` and `ls`, both allowed. No `find`.
- ~~**B.** Allow `find`, deny `-exec`, `-delete`, `-fprint*`.~~

**Answer: A** (@henetiriki)

## Files that change

| File                                 | New / changed | What                                |
| ------------------------------------ | ------------- | ----------------------------------- |
| `.github/agent/rules.md`             | Changed       | D1, D2; D3 and D4 replace Grep line |
| `.github/agent/settings.json`        | Changed       | `Bash(grep:*)`                      |
| `plans/chores/C306-agent-denials.md` | New           | This plan                           |

## Order of work

1. Commit this plan first: `plan(C306): approved by @henetiriki`.
2. Edit both files; run lint, format check, `npm run words`, tests, boundary validator, e2e.
3. Open the PR `C.306: Agent permission denials` with `Closes #306`.

## Proof

| Acceptance check                     | Proven by                        |
| ------------------------------------ | -------------------------------- |
| Rules and allowlist match CI's tools | The diff                         |
| No `rm`, `WebSearch`, `grep` denials | Next audit, for runs after merge |
| Lint, format, words, tests, e2e      | Their output in the PR           |

**Hand back:** `.github/agent/**` is in CODEOWNERS, so the tech lead builds this locally.

## Deviations

- D3 and D4 were added after approval, at the tech lead's request: `settings.json` now changes.
