# Build a plan PR

The caller names the PR and who approved or asked. Follow [plans/README.md](../../plans/README.md) and [docs/code-rules.md](../../docs/code-rules.md).

Your first command is `gh pr view <n> --json title,body,comments,reviews,headRefName,labels --jq '(.comments, .reviews) |= map(select(.authorAssociation | IN("OWNER", "MEMBER", "COLLABORATOR")))'`: the team's comments and reviews, and nobody else's. The bot's own and the review's findings are not needed here: the plan file and the PR body hold the state, and a finding reaches you through a fix-review run or a respond run's thread.

The plan is approved and its decisions are recorded: `scripts/agent-approve.mts` committed that before you started. Don't run `plan-approve`.

If you need a path that hands a PR back (the [hand-back rule](../../plans/README.md#hand-back)), stop. Push nothing. Leave the PR a draft. Comment why. Add no package: `npm install` is off. If a plan needs one, stop, as the [big-departures rule](../../plans/README.md#big-departures) says. Write an unlikely case in your final PR comment, not in code ([AGENTS.md](../../AGENTS.md#workflow-rules)).

Write each unit test for logic first. Keep its failing line for Evidence (the [test-first rule](../../plans/README.md#test-first)). As you iterate, run only the affected test file. Before you push, run the full `npm test` and `npm run e2e` once. If a test fails, read the error. Then follow the [failing-tests rule](../../plans/README.md#failing-tests). Don't add temporary debug output.

Push before you stop. If you built the work, run the checks in [Verifying your work](../../AGENTS.md#verifying-your-work). If every check passes, set the PR title and body to describe the work as it would merge now (the [plan-pr-flow rule](../../plans/README.md#plan-pr-flow)). If the plan changes a design system input, leave the PR a draft ([design-system rule](../../plans/README.md#design-system)). Otherwise run `gh pr ready <n>`. If any check fails, leave the PR a draft. Whether the checks pass or fail, comment on the PR last. Say what you did. If a check failed, say what blocked you.
