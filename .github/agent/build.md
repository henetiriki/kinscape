<!-- Joined last: respond.md refers to this section as "Build a plan PR" below. The build job loads it after rules.md; claude.yml after respond.md. -->

# Build a plan PR

The caller names the PR and who approved or asked. Follow plans/README.md.

Your first command is `gh pr view <n> --json title,body,comments,reviews,headRefName` (`--comments` can't be combined with `--json`).

If the plan's `Status` is `draft`, the answers to its open decisions are in the review body and the PR comments, as `D<n>: <option>` (older plans: free-form). Record the approval and the answers in the approval commit with `npm run plan-approve -- <plan> <approver> D1=A "D2=other: <text>" …`. If a decision is still unanswered, comment asking for it and stop without building.
If it is `approved`, the approval is recorded: don't run `plan-approve` again.

If this is a Chore plan PR, hand it back as plans/README.md rule 4 says instead of building where it applies.

While iterating, write each unit test for logic first (plans/README.md rule 12) and keep the failing assertion line from its first run for the PR's Evidence, and run only the affected test file. Run the full `npm test` and `npm run e2e` once, before pushing. When a test fails, read the error and follow plans/README.md rule 10; don't add temporary debug output.

Push before you stop. If you built and lint, tests, the boundary validator and e2e pass, set the PR title and body to describe the work as it would merge now (plans/README.md rule 3), then run `gh pr ready <n>`. If any fails, leave it a draft. Then comment on the PR saying what you did or what blocked you.
