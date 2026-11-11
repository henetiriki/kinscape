# Build a plan PR

The caller names the PR and who approved or asked. Follow [plans/README.md](../../plans/README.md) and [docs/code-rules.md](../../docs/code-rules.md).

Your first command is `gh pr view <n> --json title,body,comments,reviews,headRefName,labels --jq '(.comments, .reviews) |= map(select(.authorAssociation | IN("OWNER", "MEMBER", "COLLABORATOR")))'`: the team's comments and reviews, and nobody else's. The bot's own and the review's findings are not needed here: the plan file and the PR body hold the state, and a finding reaches you through a fix-review run or a respond run's thread.

The plan is approved and its decisions are recorded: `scripts/agent-approve.mts` committed that before you started. Don't run `plan-approve`.

These rules apply:

- If you need a path that hands a PR back (the [hand-back rule](../../plans/README.md#hand-back)), stop. Push nothing. Comment why.
- Add no package: `npm install` is off. If a plan needs one, stop (the [big-departures rule](../../plans/README.md#big-departures)).
- Write an unlikely case in your final PR comment, not in code ([AGENTS.md](../../AGENTS.md#workflow-rules)).
- Write each unit test for logic first (the [test-first rule](../../plans/README.md#test-first)).
- As you iterate, run only the affected test file.
- If a test fails, read the error. Then follow the [failing-tests rule](../../plans/README.md#failing-tests).
- Don't add temporary debug output.

Do these in order:

1. Run the full `npm test` and `npm run e2e` once.
2. Push.
3. If you built the work, run the checks in [Verifying your work](../../AGENTS.md#verifying-your-work).
4. If every check passes, run the [ready check](../../plans/README.md#ready-check).
5. Set the PR title and body to describe the work as it would merge now (the [plan-pr-flow rule](../../plans/README.md#plan-pr-flow)).
6. Leave the PR a draft if any is true. Otherwise run `gh pr ready <n>`.
   - A check failed.
   - The ready check stops you.
   - The plan changes a design system input (the [design-system rule](../../plans/README.md#design-system)).
7. Whether the checks pass or fail, comment on the PR last. Say what you did. If a check failed, say what blocked you.
