# Plan: C1239: CI agents post a body from one fixed file

- **Spec:** #1239
- **Status:** draft

## Approach

A CI agent writes each PR or issue body to `/tmp/agent-body.md` with Write. Then it posts the body with `--body-file /tmp/agent-body.md`. The body no longer goes in the Bash command, so the length of the body does not touch the command parser.

- **Build hook** (`settings.json`): change the last row of the deny table. It denies a `gh` call with `-F` in any form, or with `--body-file` whose value is not `/tmp/agent-body.md` with a space before it. This denies `--body-file -`, `--body-file=…`, `.git/config` and `notes.md`. The reason is "Write the whole body to /tmp/agent-body.md with Write, then give it as --body-file /tmp/agent-body.md." The heredoc step of the hook stays, so the heredoc of a commit message and of `npm run review:threads -- reply` stays allowed.
- **Refresh hook** (`refresh-settings.json`): a call that says `gh issue edit` or `gh issue comment` outside quotes goes through only if the whole call is one of these two lines. The reason names both lines.
  - `gh issue edit $ISSUE --body-file /tmp/agent-body.md`
  - `gh issue comment $ISSUE --body-file /tmp/agent-body.md`
- **Refresh Write**: as D2 says.
- **Text**:
  - `rules.md` line 6: "Post PR and issue text from `/tmp/agent-body.md`. Right before each `gh` call that posts it, write the whole body to that file with Write. Then give `--body-file /tmp/agent-body.md`. The settings deny `--body` and every other body file."
  - `rules.md` line 8: after "Write no scratch files.", add "The one file outside the repo that you write is `/tmp/agent-body.md`."
  - `refresh.md` step 3: "Change only those words. Write the whole body to `/tmp/agent-body.md` with Write. Then run `gh issue edit <n> --body-file /tmp/agent-body.md`, and nothing else in the call."
  - `docs/how-we-work.md:79`: "It writes the whole issue body to `/tmp/agent-body.md`. Then it runs one command: `gh issue edit <n> --body-file /tmp/agent-body.md` (no pipes or `&&`)." The words "or temp files" go, because the line now names a file.

Every CI run loads its rules and settings from `main` (`load-agent-files`). Thus all runs change to the file form at the merge, at the same time.

## Decisions

**D1 · The test that keeps the build hook and the review hook the same** · Decides: Tech lead

`agent-settings.test.ts` checks that the Bash hook of `review-settings.json` equals the hook of `settings.json`. The Chore changes the build hook and keeps `review-settings.json`, so the two hooks now differ in the body row.

- **A.** Keep the test. Compare the two hooks with the body row taken out of each. Add one test that the review hook still allows `gh pr comment 5 --body-file - <<'EOF'`. Cost: a helper of some lines in the test.
- **B.** Delete the test. Cost: no new code. A later change to one hook can make the other rows differ, and no test fails.
- **Other:** your own.

Recommended: A, because a change to a shared row still fails the test when it touches one file only.

**D2 · How the refresh settings deny Write on another path** · Decides: Tech lead

The Chore allows Write to `/tmp/agent-body.md` only, and an acceptance check says the settings deny Write on any other path.

- **A.** Take `Write` out of the deny list, and add `Write` to the allow list. Add a second hook, matcher `Write`, that denies each `file_path` except `/tmp/agent-body.md` exactly. The reason names the file. Cost: one short hook and its tests.
- **B.** Take `Write` out of the deny list, and add `Write(//tmp/agent-body.md)` to the allow list. Add no hook. Cost: two lines. The test can only check the rule lists. The deny then depends on how Claude Code matches a path rule for Write, and on how a CI run handles a call that no rule allows.
- **Other:** your own.

Recommended: A, because a test runs the hook and proves the deny of each other path.

## Alternatives considered

- A random file name per run: the hook could not check the path.
- Allow `--body-file <path>` for any path inside the workspace: `.git/config` is inside the workspace.

## Files that change

| File                                       | New / changed | What                                                                                                                      |
| ------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `.github/agent/settings.json`              | changed       | The body row of the Bash hook, as _Approach_ says                                                                         |
| `.github/agent/refresh-settings.json`      | changed       | The Bash hook takes `gh issue comment` too, and takes the file form only. Write as D2 says. `Edit` stays in the deny list |
| `.github/agent/rules.md`                   | changed       | Lines 6 and 8                                                                                                             |
| `.github/agent/refresh.md`                 | changed       | Step 3                                                                                                                    |
| `docs/how-we-work.md`                      | changed       | Line 79                                                                                                                   |
| `scripts/word-count.mts`                   | changed       | The budgets of `refresh.md` and `docs/how-we-work.md`, each by no more than the words that it gains                       |
| `scripts/__tests__/word-count.test.ts`     | changed       | The `docs/how-we-work.md` row takes the new budget                                                                        |
| `scripts/__tests__/agent-settings.test.ts` | changed       | The tests below                                                                                                           |

Tests whose behaviour changes, in `agent-settings.test.ts`:

- `settings.json` › "does not deny" and `refresh-settings.json` › "does not deny": the heredoc rows take the file form.
- `refresh-settings.json` › the allow and deny lists: as D2 says.
- The Bash hook › "is the same in settings.json and review-settings.json": as D1 says. The comment above the `describe` changes with it.
- "cuts the leading cd": the heredoc row uses `npm run review:threads -- reply`, so the test still proves that a heredoc's text is not cut.
- "denies …, naming the alternative": the rows for `.git/config`, `-F`, `notes.md` and the pipe keep their paths, and expect `/tmp/agent-body.md`. New rows deny `--body-file -` with a heredoc, `--body-file=-`, `-F -`, `-F-` and `--body-file "-"`. The two rows with a command after a heredoc use `npm run review:threads -- reply`.
- "leaves … to the allowlist": the heredoc rows of `gh` become `--body-file /tmp/agent-body.md` rows, or move to `npm run review:threads -- reply` where the row proves a heredoc's text. The commit-message rows stay.
- The refresh hook: `edit()` gives the file form, and a new `comment()` does the same. The rows for another issue, two issues, another path and a compound command stay, for edit and comment. The rows that test the EOF line go, and a row denies the heredoc form. "is the one hook of the file" expects two hooks if D2 is A.
- New, if D2 is A: the refresh Write hook allows `/tmp/agent-body.md`, and denies `/tmp/x.md`, `notes.md`, `/tmp/agent-body.md.bak` and `/tmp/../tmp/agent-body.md`.
- New: the build Edit|Write hook allows a Write of `/tmp/agent-body.md` with 20,000 characters.

## Order of work

1. Change the tests in `agent-settings.test.ts`. Run them, and see the new rows fail.
2. Change the hook in `settings.json`.
3. Change `refresh-settings.json`.
4. Change `rules.md`, `refresh.md` and `docs/how-we-work.md`.
5. Run `git grep "body-file - <<" -- .github/agent/rules.md .github/agent/refresh.md docs/how-we-work.md`.
6. Run `npm run words`. Raise the two budgets by the words that each file gained, and change `word-count.test.ts` to match.
7. Run the checks in AGENTS.md › Commands.

## Risks

- **A Bash redirect into the file.** An agent could run `<command> > /tmp/agent-body.md`, and then post the output without a Write. This adds no new reach: the agent sees the output of each command today, and can put it in a heredoc. The settings and hooks already deny the commands that print the checkout credentials. A fix is one more hook row that denies `/tmp/agent-body.md` in any other place of a Bash call. Likelihood: low. The tech lead decides whether to build it.
- **The bare `Edit` deny can also cover Write.** If Claude Code reads the `Edit` deny rule as a rule for all tools that edit a file, the unblock run cannot write the body. Then it posts no comment. The tests cannot show this. The tech lead checks the transcript of the first unblock run after the merge. If Write is denied, a follow-up Chore moves the `Edit` deny into the hook of D2.
- **An old file.** If the agent skips the Write, a second call posts the old body. `rules.md` says to write the body right before each call.
- **The review.** It keeps the heredoc form. It loads `review.md`, not `rules.md`.

## Proof

| Acceptance check                                                                  | Proven by                                                                                                                                          |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| A body of 20,000 characters is allowed                                            | The new Edit\|Write row for a 20,000-character Write, and the "leaves … to the allowlist" row for `gh issue edit 5 --body-file /tmp/agent-body.md` |
| Another path is denied and the reason names the file                              | The `.git/config`, `-F` and `notes.md` rows of "denies …, naming the alternative"                                                                  |
| `--body-file -` with a heredoc is denied and the reason names the file            | The new heredoc rows of "denies …, naming the alternative"                                                                                         |
| A commit message heredoc stays allowed                                            | The commit-message rows of "leaves … to the allowlist"                                                                                             |
| The refresh hook allows edit and comment on its own issue only, and the file only | The refresh hook tests for `edit()` and `comment()`                                                                                                |
| The refresh settings deny Write on any other path                                 | The new refresh Write hook rows (D2)                                                                                                               |
| `review-settings.json` and `review.md` do not change                              | `git diff --stat origin/main...HEAD` in the PR body; the D1 test of the review hook                                                                |
| `git grep "body-file - <<"` finds nothing in the three files                      | Order of work step 5, its output in the PR body                                                                                                    |
| `npm run words` passes, each budget grows by no more than the words added         | `npm run words` and the word counts before and after, in the PR body                                                                               |
| The checks in AGENTS.md › Commands pass                                           | Their output in the PR body                                                                                                                        |

## Out of scope

- `.github/workflows/`, `review-settings.json` and `review.md` (Constraints).
- The local skills that use `--body-file <file>`: local sessions do not load these settings.

## Deviations

<!-- Add these during the build. One line each: what changed, why, the commit. -->
