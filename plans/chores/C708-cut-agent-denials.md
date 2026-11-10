# Plan: C708: Cut agent permission denials

- **Spec:** #708
- **Status:** approved

## Approach

The shared hook skips one `-f query=` directly after `gh api graphql` when the command has no `mutation`. It denies a `git grep` option cluster with `O`. It rewrites a leading `npx vitest` before the table. The review allows `Bash(git fetch origin:*)`. The audit drops a leading `cd <cwd>` part, splits at `;`, `&&` and `||`, and names the first part the hook denies.

## Decisions

**D2 · The `npx vitest` rewrite** · Decides: Tech lead

`npm test` runs coverage, so a one-file run fails on the threshold.

- **A.** `npm test -- <args>`.
- **B.** `npm test -- --coverage.enabled=false <args>`.
- **Other:** your own.

**Answer: B** (@henetiriki)

**D3 · The refresh `-O` rule** · Decides: Tech lead

- **A.** `Bash(git grep* -O*)` and the `-O` row in the refresh hook.
- **B.** The rule only: `-nOsh` runs a command.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · `gh api` denies in the review** · Decides: Tech lead

- **A.** Copy the six `gh api` denies to `review-settings.json`.
- **B.** Only the hook guards them.
- **Other:** your own.

**Answer: A** (@henetiriki)

**Reverses [C592 D2](C592-agent-tools-and-approval.md):** the hook guards `gh api -f`.

**Reverses [C357 D1](C357-review-settings.md):** the review allows `git` reads and `gh api`.

## Files that change

| File                                        | New / changed | What                   |
| ------------------------------------------- | ------------- | ---------------------- |
| `.github/agent/*settings.json`, `review.md` | Changed       | As #708 says; D3, D4   |
| `scripts/agent-transcript.mts`              | Changed       | Export the `cd` regex  |
| `scripts/denial-audit.mts`                  | Changed       | `cwd`; the denied part |
| `scripts/__tests__/*.test.ts`               | Changed       | Hook, rules, parts     |

## Order of work

1. Failing tests, then the code.

## Risks

- The split ignores quotes, so it can name the wrong part.
- In the review, the `npx vitest` rewrite gives `npm test`, which the review denies.
- `git grep -eFOO` is denied.

## Proof

| Acceptance check                | Proven by                |
| ------------------------------- | ------------------------ |
| Rules; hook                     | `agent-settings.test.ts` |
| Audit names `cat`               | `denial-audit.test.ts`   |
| No review row for `cd` or `git` | Next audit, #542         |
| Checks                          | PR output                |

## Deviations

- No newline split: `detailOf` removes newlines.
