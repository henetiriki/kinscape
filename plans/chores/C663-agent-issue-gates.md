# Plan: C663: Let issues filed by the agent App pass the author gates

- **Spec:** #663
- **Status:** approved

## Approach

Each author check becomes `(contains(…OWNER/MEMBER/COLLABORATOR…) || github.event.issue.user.login == vars.KINSCAPE_BOT_LOGIN)`, as `claude-code-review.yml` does for PRs. An unset variable matches no login. `agent-unblock.mts` also trusts an issue whose `user.login` equals `BOT_LOGIN` (D1). Every path except the test is a hand-back path (rule 13).

## Decisions

**D1 · Bot login in `agent-unblock.mts`** · Decides: Tech lead

The `GH_OWNER` pattern rejects `[bot]`, so `BOT_LOGIN` needs its own pattern.

- **A.** Optional: unset trusts no bot; a malformed value gives the usage error.
- **B.** Required, as `GH_OWNER`: an unset variable fails the job, and no label swaps.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                                                                    | New / changed | What                                               |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------- |
| `.github/workflows/claude-plan.yml`, `claude-unblock.yml`, `backlog-intent-ready.yml`, `backlog-milestone.yml`, `backlog-spec-link.yml` | Changed       | Bot clause in `run-name` and `if:`; header comment |
| `.github/workflows/claude-unblock.yml`                                                                                                  | Changed       | `BOT_LOGIN` env                                    |
| `scripts/agent-unblock.mts`, `scripts/__tests__/agent-unblock.test.ts`                                                                  | Changed       | Trust the bot login; tests with `user.login`       |

No doc in `docs/` states the author rule.

## Order of work

1. Failing tests, then `agent-unblock.mts`.
2. The five workflows.
3. After merge: add `status: ready-for-agent` to #657 (it is `status: ready-for-dev` now).

## Risks

- Missing brackets let the bot clause skip the label checks. No test checks this, so the reviewer reads each expression.

## Proof

| Acceptance check                                | Proven by                                                |
| ----------------------------------------------- | -------------------------------------------------------- |
| 2 matches per workflow                          | `grep -c` output in the PR                               |
| Bot issue in `unblocked`; other CONTRIBUTOR not | `agent-unblock.test.ts`                                  |
| #657 run titled "Plan: Chore: …"                | After merge, by the tech lead                            |
| Checks pass                                     | `npm test`, `lint`, `typecheck`, `format:check`, `words` |

## Out of scope

- `claude-respond.yml`, the collaborators and `KINSCAPE_TEAM_LOGINS`.
