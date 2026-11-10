# Plan: C708: Cut agent permission denials

- **Spec:** #708
- **Status:** approved

## Approach

The shared hook skips one `-f query=` directly after `gh api graphql` when the command has no `mutation`. It denies a `git grep` option cluster with `O`. It rewrites `npx vitest` before the table, so the `npx` row passes it. The review allows `Bash(git fetch origin:*)`. The audit drops a leading `cd <cwd>` part (`process.cwd()`), splits at `;`, `&&`, `||` and newlines, and names the first part the hook denies.

## Decisions

**D2 · The `npx vitest` rewrite** · Decides: Tech lead

**Answer: B** (@henetiriki, on #708): `npm test -- --coverage.enabled=false <args>`. The build rewords that Acceptance check.

**D3 · The refresh `-O` rule** · Decides: Tech lead

A glob has only `*`, so no rule matches `-nO` but not `-A30 "## NOTE"`.

- **A.** `Bash(git grep* -O*)`, and the shared hook's `-O` row in the refresh hook.
- **B.** `Bash(git grep* -O*)` only: `-nOsh` runs a command.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · `gh api` denies in the review** · Decides: Tech lead

- **A.** Copy the `-X`, `--method`, `-F`, `--field`, `--raw-field` and `--input` denies to `review-settings.json`.
- **B.** Only the hook guards them.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                        | What                        |
| ------------------------------------------- | --------------------------- |
| `.github/agent/*settings.json`, `review.md` | As #708 says; D3, D4        |
| `scripts/agent-transcript.mts`              | Export the `cd` regex       |
| `scripts/denial-audit.mts`                  | `cwd`; the denied part      |
| `scripts/__tests__/agent-settings.test.ts`  | The GraphQL read now passes |
| `scripts/__tests__/denial-audit.test.ts`    | Part names                  |

## Order of work

1. Failing tests, then the hook, the rules, `review.md` and the audit.

## Risks

- The split ignores quotes, so it can name the wrong part.
- `git grep -eFOO` is denied.

## Proof

| Acceptance check                     | Proven by                      |
| ------------------------------------ | ------------------------------ |
| Review rules; hook; same hook        | `agent-settings.test.ts`       |
| Audit names `cat`                    | `denial-audit.test.ts`         |
| No review row for `cd` or git reads  | The next weekly audit, on #542 |
| The checks and `validate:boundaries` | Output in the PR               |
