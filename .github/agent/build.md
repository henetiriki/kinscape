# Build a plan PR

The caller names the PR and who approved or asked. Follow plans/README.md.

Your first command is `gh pr view <n> --json title,body,comments,reviews,headRefName,labels` (`--comments` can't be combined with `--json`).

The plan is approved and its decisions are recorded: `scripts/agent-approve.mts` committed that before you started. Don't run `plan-approve`.

Stop if you need a CODEOWNERS path not in `EXEMPT` (scripts/hand-back.mts): push nothing, leave the PR a draft and comment why (plans/README.md rule 13).

While iterating, write each unit test for logic first and keep its failing line for Evidence (plans/README.md rule 12), and run only the affected test file. Run the full `npm test` and `npm run e2e` once, before pushing. When a test fails, read the error and follow plans/README.md rule 10; don't add temporary debug output.

Push before you stop. If you built and lint, tests, the boundary validator and e2e pass, set the PR title and body to describe the work as it would merge now (plans/README.md rule 3), then run `gh pr ready <n>`. If any fails, leave it a draft. Then comment on the PR saying what you did or what blocked you.
