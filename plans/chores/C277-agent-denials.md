# Plan: C277: Agent permission denials

- **Spec:** #277
- **Status:** approved

## Approach

The audit found 51 denials in 30 runs. Each command was already allowed or denied on purpose; it failed as a compound command (`&&`, `;`, `|`, a `VAR=` prefix), with `--body`, `cd`, `grep`, `cat >>` or `rm`. `rules.md` forbids these only in general terms. `settings.json` stays as it is. `rules.md` names each form and its replacement:

- One command per Bash call: no `&&`, `;`, `|`, `cd` or `VAR=` prefix. Give paths instead of `cd`.
- Search with Grep and Glob; read with Read, not `cat`, `sed` or `for` loops; write with Write and Edit.
- Post PR and issue text with `gh … --body-file - <<'EOF'`, the only heredoc.
- No scratch files: read values from `design/source/` and compare with `npm run design:check`.

## Decisions

**D1 · Scratch specs (`rm`, 5 denials)** · Decides: Tech lead

Agents wrote `e2e/tmp-*.spec.ts` to measure the design, then couldn't delete it.

- **A.** Forbid scratch files.
- ~~**B.** Allow `Bash(rm e2e/tmp-*)`; name scratch specs `e2e/tmp-*.spec.ts` and delete them before committing.~~

**Answer: A** (@henetiriki)

## Files that change

| File                                 | New / changed | What                        |
| ------------------------------------ | ------------- | --------------------------- |
| `.github/agent/rules.md`             | Changed       | The rules above, ≤300 words |
| `plans/chores/C277-agent-denials.md` | New           | This plan                   |

## Order of work

1. Commit this plan first: `plan(C277): approved by @henetiriki`.
2. Edit `rules.md`; run lint, format check and `npm run words`.
3. Open the PR `C.277: Agent permission denials` with `Closes #277`.

## Proof

| Acceptance check            | Proven by                                  |
| --------------------------- | ------------------------------------------ |
| Rules name each denied form | The diff                                   |
| Fewer of these denials      | The next audit issue, for runs after merge |
| Lint, format, words         | Their output in the PR                     |

**Hand back:** `.github/agent/**` is in CODEOWNERS, so the tech lead builds this locally.
