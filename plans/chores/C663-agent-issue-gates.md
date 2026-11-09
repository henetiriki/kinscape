# Plan: C663: Let issues filed by the agent App pass the author gates

- **Spec:** #663
- **Status:** approved

## Approach

Each author check also accepts `github.event.issue.user.login == vars.KINSCAPE_BOT_LOGIN`, as `claude-code-review.yml` does. An unset variable matches no login. `agent-unblock.mts` trusts the same login (D1). Every path except the tests is a hand-back path (rule 13).

## Decisions

**D1 · Bot login in `agent-unblock.mts`** · Decides: Tech lead

The `GH_OWNER` pattern rejects `[bot]`, so the bot login needs its own.

- **A.** Optional: unset trusts no bot; a malformed value gives the usage error.
- **B.** Required, as `GH_OWNER`: an unset variable fails the job, and no label swaps.
- **Other:** your own.

**Answer: A** (@henetiriki)

[C269](C269-public-repo.md) assumed that the bot is a COLLABORATOR. An App is never one, so the gates also trust `vars.KINSCAPE_BOT_LOGIN`.

## Files that change

| File                                                                                                                                    | New / changed | What                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `.github/workflows/claude-plan.yml`, `claude-unblock.yml`, `backlog-intent-ready.yml`, `backlog-milestone.yml`, `backlog-spec-link.yml` | Changed       | Bot clause in `run-name` and `if:`; header comment; `KINSCAPE_BOT_LOGIN` env in `claude-unblock.yml` |
| `scripts/agent-unblock.mts`, `scripts/__tests__/agent-unblock.test.ts`                                                                  | Changed       | Trust the bot login; tests                                                                           |
| `scripts/__tests__/issue-author-gates.test.ts`                                                                                          | New           | Checks the five gates                                                                                |

## Order of work

1. Failing tests, then `agent-unblock.mts`.
2. The five workflows.
3. After merge: add `status: ready-for-agent` to #657 (now `status: ready-for-dev`).

## Risks

- A missing bracket lets the bot clause skip the label checks. `issue-author-gates.test.ts` checks the brackets.
- Unlikely: an invalid `KINSCAPE_BOT_LOGIN` stops `agent-unblock.mts`, and the usage message omits the variable. Likelihood: low (`setup-github.sh` sets it). Fix: name it in the message.
- Unlikely: the variable and the API login differ in case, so the script `===` skips the refresh. Likelihood: very low. Fix: lower-case both sides.

## Proof

| Acceptance check                                | Proven by                                                |
| ----------------------------------------------- | -------------------------------------------------------- |
| 2 matches per workflow                          | `grep -c` output in the PR                               |
| Bot issue in `unblocked`; other CONTRIBUTOR not | `agent-unblock.test.ts`                                  |
| #657 run titled "Plan: Chore: …"                | After merge, by the tech lead                            |
| Checks pass                                     | `npm test`, `lint`, `typecheck`, `format:check`, `words` |

## Out of scope

- `claude-respond.yml`, the collaborators and `KINSCAPE_TEAM_LOGINS`.
