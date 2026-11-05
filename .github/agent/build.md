# Build a plan PR

The caller names the PR and who approved or asked. Follow plans/README.md.

Your first command is `gh pr view <n> --json title,body,comments,reviews,headRefName,labels --jq '(.comments, .reviews) |= map(select(.authorAssociation | IN("OWNER", "MEMBER", "COLLABORATOR")))'`: the team's comments and reviews, and nobody else's.

The plan is approved and its decisions are recorded: `scripts/agent-approve.mts` committed that before you started. Don't run `plan-approve`.

Stop if you need a path that hands a PR back (plans/README.md rule 13): push nothing, leave the PR a draft and comment why. Add no package: `npm install` is off, and a plan that needs one stops as plans/README.md rule 6 says.

While iterating, write each unit test for logic first and keep its failing line for Evidence (plans/README.md rule 12), and run only the affected test file. Run the full `npm test` and `npm run e2e` once, before pushing. When a test fails, read the error and follow plans/README.md rule 10; don't add temporary debug output.

Push before you stop. If you built and lint, tests, the boundary validator and e2e pass, set the PR title and body to describe the work as it would merge now (plans/README.md rule 3), then run `gh pr ready <n>`. If any fails, leave it a draft. Then comment on the PR saying what you did or what blocked you.
