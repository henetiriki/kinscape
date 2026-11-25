# Plan: C1239: CI agents post a body from one fixed file

- **Spec:** #1239
- **Status:** approved

## Approach

Every CI agent run (build, refresh and code review) writes each body to `/tmp/agent-body.md` with Write. Then it posts the body with `--body-file /tmp/agent-body.md`. The body no longer goes in the Bash command, so its length does not touch the command parser.

- **Build and review hook** (`settings.json`, `review-settings.json`): change the last row of the deny table in both. It denies a `gh` call with `-F` in any form, or with `--body-file` whose value is not `/tmp/agent-body.md` after a space. This denies `--body-file -`, `--body-file=…`, `.git/config` and `notes.md`. The reason is "Write the whole body to /tmp/agent-body.md with Write, then give it as --body-file /tmp/agent-body.md." The heredoc step stays, so a commit message and `npm run review:threads -- reply` keep their heredoc.
- **Refresh hook** (`refresh-settings.json`): a call that says `gh issue edit` or `gh issue comment` outside quotes goes through only if the whole call is one of these two lines. The reason names both lines.
  - `gh issue edit $ISSUE --body-file /tmp/agent-body.md`
  - `gh issue comment $ISSUE --body-file /tmp/agent-body.md`
- **Write in the read-only files** (`refresh-settings.json` and `review-settings.json`): as D2 says. In each file, `Edit` stays denied, and each `Read(…)` deny rule stays.
- **Text**:
  - `rules.md` line 6: "Post PR and issue text from `/tmp/agent-body.md`. Right before each `gh` call that posts it, write the whole body to that file with Write. Then give `--body-file /tmp/agent-body.md`. The settings deny `--body` and every other body file."
  - `rules.md` line 8: after "Write no scratch files.", add "The one file outside the repo that you write is `/tmp/agent-body.md`."
  - `refresh.md` step 3: "Change only those words. Write the whole body to `/tmp/agent-body.md` with Write. Then run `gh issue edit <n> --body-file /tmp/agent-body.md`, and nothing else in the call."
  - `review.md:9`: "Write the whole body to `/tmp/agent-body.md` with Write. Then post it with `gh pr comment <n> --body-file /tmp/agent-body.md`."
  - `docs/how-we-work.md:79`: "It writes the whole issue body to `/tmp/agent-body.md`. Then it runs one command: `gh issue edit <n> --body-file /tmp/agent-body.md` (no pipes or `&&`)." The words "or temp files" go, because the line now names a file.

Every CI run loads its rules and settings from `main` (`load-agent-files`). Thus all runs change to the file form at the merge, at the same time.

## Decisions

**D2 · How the refresh and review settings deny Write on another path** · Decides: Tech lead

`refresh-settings.json` and `review-settings.json` deny Write today. The Chore allows Write to `/tmp/agent-body.md` only, with the same rule in both.

- **A.** In each file, take `Write` out of the deny list, and add `Write` to the allow list. Add a second hook, matcher `Write`, that denies each `file_path` except `/tmp/agent-body.md` exactly. The hook is the same in both files. The reason names the file. Test: "the Write hook › is the same in refresh-settings.json and review-settings.json". Cost: one short hook in two files, and its tests.
- **B.** In each file, take `Write` out of the deny list, and add `Write(//tmp/agent-body.md)` to the allow list. Add no hook. Test: "the Write rule › is the same in refresh-settings.json and review-settings.json". Cost: four lines. The deny then depends on how Claude Code matches a path rule for Write, and on how a CI run handles a call that no rule allows.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- A random file name per run: the hook could not check the path.
- Allow `--body-file <path>` for any path inside the workspace: `.git/config` is inside the workspace.

## Files that change

| File                                       | New / changed | What                                                                                                                                             |
| ------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.github/agent/settings.json`              | changed       | The body row of the Bash hook, as _Approach_ says                                                                                                |
| `.github/agent/review-settings.json`       | changed       | The same body row of the Bash hook. Write as D2 says. `Edit` and the `Read(…)` rules stay in the deny list                                       |
| `.github/agent/refresh-settings.json`      | changed       | The Bash hook takes `gh issue comment` too, and takes the file form only. Write as D2 says. `Edit` and the `Read(…)` rules stay in the deny list |
| `.github/agent/rules.md`                   | changed       | Lines 6 and 8                                                                                                                                    |
| `.github/agent/refresh.md`                 | changed       | Step 3                                                                                                                                           |
| `.github/agent/review.md`                  | changed       | Line 9                                                                                                                                           |
| `docs/how-we-work.md`                      | changed       | Line 79                                                                                                                                          |
| `scripts/word-count.mts`                   | changed       | The budgets of `refresh.md`, `review.md` and `docs/how-we-work.md`, each by no more than the words that it gains                                 |
| `scripts/__tests__/word-count.test.ts`     | changed       | The `review.md` and `docs/how-we-work.md` rows take the new budgets                                                                              |
| `scripts/__tests__/agent-settings.test.ts` | changed       | The tests below                                                                                                                                  |

Tests whose behaviour changes, in `agent-settings.test.ts`:

- `settings.json` and `refresh-settings.json` › "does not deny": the heredoc rows take the file form.
- `refresh-settings.json` › the allow and deny lists: as D2 says.
- `review-settings.json` › "denies Edit and Write": it checks `Edit` only. A new "allows" row: `gh pr comment 5 --body-file /tmp/agent-body.md`.
- "is the same in settings.json and review-settings.json" and the "denies Read(…)" rows of the three files: no change.
- "gives the review the same answers": new rows for `gh pr comment 5 --body-file /tmp/agent-body.md` and for `--body-file -` with a heredoc.
- "cuts the leading cd": the heredoc row uses `npm run review:threads -- reply`.
- "denies …, naming the alternative": the `.git/config`, `-F`, `notes.md` and pipe rows expect `/tmp/agent-body.md`. New rows deny `--body-file -` with a heredoc, `--body-file=-`, `-F -`, `-F-` and `--body-file "-"`. The rows with a command after a heredoc use `npm run review:threads -- reply`.
- "leaves … to the allowlist": the `gh` heredoc rows take the file form, or move to `npm run review:threads -- reply`. The commit-message rows stay.
- The refresh hook: `edit()` and a new `comment()` give the file form. The rows for another issue, two issues, another path and a compound command stay. The EOF rows go, and a row denies the heredoc form. "is the one hook of the file" expects two hooks if D2 is A.
- "has one entry in settings.json and none in review-settings.json": the review matchers are `Bash` and `Write` if D2 is A.
- New, as D2 names: the test that the two Write hooks or rules are the same. If D2 is A, the hook allows `/tmp/agent-body.md`, and denies `/tmp/x.md`, `notes.md`, `/tmp/agent-body.md.bak` and `/tmp/../tmp/agent-body.md`.
- New: the build Edit|Write hook allows a 20,000-character Write of `/tmp/agent-body.md`.

## Order of work

1. Change the tests in `agent-settings.test.ts`. Run them, and see the new rows fail.
2. Change the hook in `settings.json` and `review-settings.json`.
3. Change Write in `refresh-settings.json` and `review-settings.json`, as D2 says.
4. Change the hook in `refresh-settings.json`.
5. Change `rules.md`, `refresh.md`, `review.md` and `docs/how-we-work.md`.
6. Run `git grep "body-file - <<" -- .github/agent/rules.md .github/agent/refresh.md .github/agent/review.md docs/how-we-work.md`.
7. Run `npm run words`. Raise the three budgets by the words that each file gained, and change `word-count.test.ts` to match.
8. Run the checks in AGENTS.md › Commands.

## Risks

- **A Bash redirect into the file.** An agent could run `<command> > /tmp/agent-body.md` and post the output. This adds no new reach: the agent can put any output in a heredoc today. A fix is one more hook row that denies `/tmp/agent-body.md` elsewhere in a Bash call. Likelihood: low. The tech lead decides whether to build it.
- **The bare `Edit` deny can also cover Write.** If Claude Code reads the `Edit` deny rule as a rule for all tools that edit a file, the refresh and the review post nothing. The tests cannot show this. The tech lead checks the transcripts of the first refresh and the first review after the merge. If Write is denied, a follow-up Chore moves the `Edit` deny into the hook of D2.
- **An old file.** If the agent skips the Write, a second call posts the old body. The three rule files say to write the body right before each call.

## Proof

| Acceptance check                                                                      | Proven by                                                                                                              |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| A body of 20,000 characters is allowed                                                | The new 20,000-character Edit\|Write row, and the "leaves … to the allowlist" row of the file form                     |
| Another path is denied and the reason names the file                                  | The `.git/config`, `-F` and `notes.md` rows of "denies …, naming the alternative"                                      |
| `--body-file -` with a heredoc is denied and the reason names the file                | The new heredoc rows of "denies …, naming the alternative"                                                             |
| A commit message heredoc stays allowed                                                | The commit-message rows of "leaves … to the allowlist"                                                                 |
| The refresh hook allows edit and comment on its own issue only, and the file only     | The refresh hook tests for `edit()` and `comment()`                                                                    |
| The refresh settings deny Write on any other path                                     | The Write rows of D2                                                                                                   |
| The review hook allows `gh pr comment` with the file, and denies Write on other paths | The new rows of "gives the review the same answers" and of `review-settings.json` › "allows", and the Write rows of D2 |
| The Bash hooks of `settings.json` and `review-settings.json` are the same             | The Bash hook › "is the same in settings.json and review-settings.json"                                                |
| `git grep "body-file - <<"` finds nothing in the four files                           | Order of work step 6, its output in the PR body                                                                        |
| `npm run words` passes, each budget grows by no more than the words added             | `npm run words` and the word counts before and after, in the PR body                                                   |
| The checks in AGENTS.md › Commands pass                                               | Their output in the PR body                                                                                            |

## Out of scope

- `.github/workflows/` (Constraints).
- The inline-comment MCP tool of the review: it does not take a body through Bash.
- The local skills that use `--body-file <file>`: local sessions do not load these settings.

## Deviations

- Only the `review.md` budget rises (550 to 560). `refresh.md` and `docs/how-we-work.md` stay within their budgets.
