# Plan: C1078: Cut avoidable agent permission denials from audit #1026

- **Spec:** #1078 (also closes #1026)
- **Status:** approved

## Approach

The shared Bash hook in `settings.json` and `review-settings.json` changes in three places, and the two files keep the same text:

- It loses the `ls` row.
- It gets a pipe row as the last row of the table. The row matches a `|` in `$api` that has no `|` before or after it. `$api` has quoted text and heredoc bodies blanked, so a `|` in `--jq '.a | .b'`, `"a|b"` or a body passes. As the last row, it keeps the reason of each row above it. For example, `gh pr view 1 | gh pr comment 1 --body-file x` still gets the heredoc reason.
- The quote-blanking step reads a double-quoted string as `"`, then any run of a character that is not `"` or `\`, or of `\` and the next character, then `"`. A string with `\"` is then one string, and `-f query="…"` blanks to `-f query=""`, which the GraphQL read step already passes.

The allow lists get the forms in "What to change". `review.md` gets one Commands line. The tests in "How we'll know it's done" go in `agent-settings.test.ts`.

## Decisions

**D1 · Scope of the `git fetch <url>` check** · Decides: Tech lead

- **A.** Check `git fetch <url>` against `review-settings.json` only. `settings.json` keeps `Bash(git:*)`.
- ~~**B.** Add deny rules for `git fetch` URLs to `settings.json`.~~
- ~~**C.** Replace `Bash(git:*)` with one rule for each git command.~~

**Answer: A** (@henetiriki)

**D2 · `wc` in the review** · Decides: Tech lead

"What to change" adds `Bash(wc:*)` to `review-settings.json`. GNU `wc --files0-from=/proc/self/environ` reads each environment variable as a file name. It prints each name that it cannot open, so the output shows the run's variables. `--f` is a valid short form of the option. A hostile PR can steer the review, and the review posts what it reads. Which change keeps the variables unread?

- **A.** Allow `Bash(wc:*)`. Add a hook row that denies `wc` with an option that starts with `--f`, and the deny rule `Bash(wc *--f*)`. The Constraints do not name the row or the rule. Each done check stays.
- **B.** Do not allow `wc`. The review counts lines with Read. Two done checks change: the `review-settings.json` allow check and the audit check for no `wc` row. The build rewords them in the issue.
- **Other:** your own.

**Answer: B** (@henetiriki)

**Reverses [C480](C480-bash-hook-audit.md).** C480 denied `ls`, and let `cat`, `grep`, `head` and `sed` filter output after a single `|`. #1078 asks to allow `ls` and to deny each unquoted `|`. This plan does both.

## Alternatives considered

- Deny only a pipe into `head`, `grep`, `cat` or `sed`. The Chore asks for each unquoted `|`, and a pipe into another program hides the same output from the allow list.
- Put the pipe row first. Then each piped call gets the pipe reason, and the `heredoc` test at line 493 changes.

## Files that change

| File                                       | New / changed | What                                                                                                                                                                                                                                       |
| ------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.github/agent/settings.json`              | changed       | The hook: no `ls` row, the pipe row last, `\"` inside a double-quoted string. Allow `Bash(ls:*)`, `Bash(gh run view:*)`, `Bash(gh run list:*)`, `Bash(gh label list:*)` and `Bash(gh search:*)`.                                           |
| `.github/agent/review-settings.json`       | changed       | The same hook text. Allow `Bash(ls:*)` and `Bash(git fetch -q origin:*)`. Allow `Bash(wc:*)` and add the D2 guard only if D2 is A.                                                                                                         |
| `.github/agent/review.md`                  | changed       | A Commands line: post each comment as `gh pr comment <n> --body-file - <<'EOF'`.                                                                                                                                                           |
| `scripts/__tests__/agent-settings.test.ts` | changed       | The done checks as tests. `ls docs` moves from the denied list to the allowed list. The three pipe filters (`gh pr diff 1 \| head -50`, `gh pr view 1 \| grep x`, `gh pr view 1 \| cat -n`) move to the denied list, with the pipe reason. |
| `scripts/__tests__/denial-audit.test.ts`   | changed       | Line 343 runs the real hook and expects it to deny `ls docs`. Use `sed x` there, and expect `Bash: sed`. The test still shows that the denied part names the group.                                                                        |
| `plans/chores/C1078-avoidable-denials.md`  | new           | This plan.                                                                                                                                                                                                                                 |

## Order of work

The tech lead builds this hand-back in a local session (`/build-local <n>`).

1. Write the new hook tests and allow-list tests. See each fail on the behaviour, and paste a failing line in the Evidence.
2. Change the hook in `settings.json`. Copy the same text to `review-settings.json`.
3. Add the allow rules.
4. Add the `review.md` line.
5. Change line 343 of `denial-audit.test.ts`.
6. Run the checks in [Commands](../../AGENTS.md#commands).
7. In the PR body, write `Closes #1078` and `Closes #1026` on separate lines.

## Risks

- The pipe row denies filters that agents use now, such as `gh pr diff 1 | head -50`. The reason names `--jq` and the git grep options. Claude Code saves long output to a file that Read can open.
- With the new quote step, a `\"` outside a string no longer opens a string. A `|` or command after it is then visible to the table, which gives more denials, not fewer. A test covers `"a\\"` (a `\` before the closing quote).
- The hook text is a jq program in a JSON string in a shell command. The tests run the real hook through bash, as CI does, so an escape error fails a test.
- `ls` reads no file content. It can list names under `/proc`, and names hold no secrets.

## Proof

| Acceptance check                                                                              | Proven by                                                                            |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `ls plans/chores` is allowed                                                                  | `agent-settings.test.ts`: the hook test and the allow test, both files               |
| `cat x`, `head x`, `grep x` and `sed x` are still denied                                      | `agent-settings.test.ts`: hook test, both files                                      |
| `git grep x \| head -5` is denied with the pipe reason                                        | `agent-settings.test.ts`: hook test, both files                                      |
| `git grep -E "a\|b" -- x`, `--jq '.a \| .b'` and a heredoc body with `\|` stay allowed        | `agent-settings.test.ts`: hook test, both files                                      |
| The denied `gh api graphql -f query="{ … \"x\" … }"` example is allowed                       | `agent-settings.test.ts`: hook test with the audit's example, both files             |
| The same query with `mutation` is denied                                                      | `agent-settings.test.ts`: hook test                                                  |
| `gh api -X POST …` is still denied                                                            | `agent-settings.test.ts`: existing deny tests                                        |
| `settings.json` allows the five listed forms                                                  | `agent-settings.test.ts`: `allowedBy` test                                           |
| `review-settings.json` allows `ls` and `git fetch -q origin`, and not `wc` (D2)               | `agent-settings.test.ts`: `allowedBy` test                                           |
| Neither file allows `gh run rerun`, `gh label create`, `jq`, `awk`, `cat`, `head` or `grep`   | `agent-settings.test.ts`: `allowedBy` test, both files                               |
| Neither file allows `git fetch <url>` (D1: `review-settings.json` only)                       | `agent-settings.test.ts`: existing review test                                       |
| The same hook text in both files                                                              | `agent-settings.test.ts`: existing test                                              |
| The first audit after the merge has no row for the listed commands and no GraphQL hook denial | The next `claude-denial-audit.yml` run; the tech lead reads the issue that it writes |
| The checks pass                                                                               | CI                                                                                   |

## Out of scope

- `refresh-settings.json` and `refresh.md`.
- `Bash(git:*)` in `settings.json` (D1).
- The audit's split of a call into parts (`scripts/denial-audit.mts`). It splits at `;`, `&&` and `||`, so a piped call stays one part.

## Deviations

- The pipe row also skips a `|` after a `\`, so an unquoted `git grep -E a\|b` stays allowed.
- `review.md` had 3 words of room, and the new line has 8. The build cut 5 words from other lines and changed no rule: `in each` to `per`, `that is`, `file under` to `file`, and `ones`.
- Per D2 B, the build did not allow `wc`. It added tests that the review does not allow `wc` or `wc --files0-from=…`.
- `review.md` keeps its own copy of the heredoc rule that `rules.md` line 6 gives. The review loads `review.md` and `review-code.md`, not `rules.md`, and no file that every workflow loads can hold a shell rule: `AGENTS.md` also governs local sessions, which must not use heredocs in `gh` calls. The tech lead chose this in the fix review of #1079.
- The pipe row is skipped for a call that holds `$(cat <<`, Claude Code's commit form. The review of #1079 found that a `"` in a commit message makes the quote step pair the wrong quotes, so a `|` in the message shows and the pipe row denied the commit. The tech lead asked for this fix. Only the pipe row skips, because the allowlist still judges each part. Another row would turn a `'` in the message into a way past the hook. Two tests cover the form.
- `denial-audit.test.ts` also changes line 345 (`ls` to `sed x`), because the hook no longer denies `ls`.
