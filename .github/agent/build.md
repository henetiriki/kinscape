# Build a plan PR

The caller names the PR and who approved or asked. Follow [plans/README.md](../../plans/README.md) and [docs/code-rules.md](../../docs/code-rules.md).

Your first command is `gh pr view <n> --json title,body,comments,reviews,headRefName,labels --jq '(.comments, .reviews) |= map(select(.authorAssociation | IN("OWNER", "MEMBER", "COLLABORATOR")))'`: the team's comments and reviews, and nobody else's. The bot's own and the review's findings are not needed here: the plan file and the PR body hold the state, and a finding reaches you through a fix-review run or a respond run's thread.

The plan is approved and its decisions are recorded: `scripts/agent-approve.mts` committed that before you started. Don't run `plan-approve`.

Stop if you need a path that hands a PR back (the [hand-back rule](../../plans/README.md#hand-back)): push nothing, leave the PR a draft and comment why. Add no package: `npm install` is off, and a plan that needs one stops as the [big-departures rule](../../plans/README.md#big-departures) says. Write an unlikely case in your final PR comment, not in code ([AGENTS.md](../../AGENTS.md#workflow-rules)).

While iterating, write each unit test for logic first and keep its failing line for Evidence (the [test-first rule](../../plans/README.md#test-first)), and run only the affected test file. Run the full `npm test` and `npm run e2e` once, before pushing. When a test fails, read the error and follow the [failing-tests rule](../../plans/README.md#failing-tests); don't add temporary debug output.

Push before you stop. If you built and every check in [Verifying your work](../../AGENTS.md#verifying-your-work) passes, set the PR title and body to describe the work as it would merge now (the [plan-pr-flow rule](../../plans/README.md#plan-pr-flow)), then run `gh pr ready <n>`. If any fails, leave it a draft. Then comment on the PR saying what you did or what blocked you.
