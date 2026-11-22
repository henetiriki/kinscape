# Plan: C1132: Tell the owner that an unblock refresh is running and what it checks

- **Spec:** #1132
- **Status:** approved

## Approach

In `scripts/agent-unblock.mts`, a new helper `trusted(issue, bot)` holds the author check that the loop has now. The loop calls it once for each freed issue. The result selects the comment lines and the entry in the refresh list, so the two cannot disagree. One helper, `waitLines(owner)`, holds the two shared lines: "A refresh against `main` is running." and "@owner: wait for its comment." For a trusted author, `readyLines` and `draftLines` put these lines in place of the "@owner:" line. They then add the "Then …" line that the Chore gives. For another author, the lines stay as they are.

In `.github/agent/refresh.md`, the "Unblock run" section gets two rules for the comment of step 5:

- If there is no drift, write "No drift from the blockers." before the closing line.
- End the comment with "The plan run checks all of `main` and can find more.", after the Spec-check lines.

A run with no drift runs no Spec checks (step 4), so the no-drift line comes after `## Refreshed` and its lines.

## Alternatives considered

- Keep the inline author check and add a second check for the comment. Rejected: the Constraints ask for one check.
- Prove the `refresh.md` lines by review only. Rejected: a text test fails if a later edit drops a line.

## Files that change

| File                                         | New / changed | What                                                                                                                            |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/agent-unblock.mts`                  | Changed       | `trusted`, `waitLines`, `nextLines`; `readyLines`, `draftLines` and `swapLabel` take the result; header comment                 |
| `scripts/__tests__/agent-unblock.test.ts`    | Changed       | Four new tests; the test "swaps the label for draft, names the blocker and gives the refine command" expects the new draft line |
| `.github/agent/refresh.md`                   | Changed       | "Unblock run": the no-drift line and the closing line                                                                           |
| `scripts/__tests__/load-agent-files.test.ts` | Changed       | One test: the "Unblock run" section holds both lines, in order                                                                  |
| `scripts/word-count.mts`                     | Changed       | The `refresh.md` budget goes from 330 to the new count, rounded up to the next 10 (about 370), only if the count passes 330     |

## Order of work

1. Write the four tests in `agent-unblock.test.ts`. See them fail on the comment text.
2. Add `trusted` and `waitLines`, and pass the result to the comment lines and the list.
3. Change the expected draft line of the OWNER design test.
4. Write the `refresh.md` test. See it fail. Edit the "Unblock run" section.
5. Run `npm run words`. If `refresh.md` passes 330, raise its budget.
6. Run the checks in `AGENTS.md` › Commands.

## Risks

- The script posts the comment before the label edit. If the edit fails, the comment says that a refresh runs, but the issue stays out of the list. Likelihood: low, because it needs one failed API call between two calls. The run fails, and the `[Run]` link shows it (D2). Fix cost: one reorder and one test. The plan builds no fix.

## Proof

| Acceptance check                                                        | Proven by                                                                              |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `ready-for-dev` comment, trusted author: wait lines before the set line | New test, for OWNER, MEMBER, COLLABORATOR and the bot App                              |
| `draft` comment, trusted author: wait lines before the `/refine` line   | New test                                                                               |
| Another author: the comment is the same as today                        | New test: the exact text of the `ready-for-dev` and `draft` comments for a CONTRIBUTOR |
| Two issues in one run, one trusted and one not                          | New test: each comment and the list follow their own issue                             |
| "Unblock run" holds the closing line last and the no-drift rule         | New test in `load-agent-files.test.ts`                                                 |
| `lint`, `typecheck`, `format:check`, `words`, `test`                    | CI                                                                                     |
| The next freed issue shows both comments                                | Tech lead, after the merge                                                             |

## Out of scope

- `.github/workflows/claude-unblock.yml`, the model, the drift rules, the labels and the plan run.
- A line for a failed refresh (D2).

## Deviations
