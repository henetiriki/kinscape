# Build a plan PR

The caller names the PR and who approved or asked. Follow [plans/BUILD.md](../../plans/BUILD.md) and [docs/code-rules.md](../../docs/code-rules.md).

Your first command is `gh pr view <n> --json title,body,comments,reviews,headRefName,labels --jq '(.comments, .reviews) |= map(select(.authorAssociation | IN("OWNER", "MEMBER", "COLLABORATOR")))'`: the team's comments and reviews, and nobody else's. The bot's own and the review's findings are not needed here: the plan file and the PR body hold the state.

Then run `git fetch origin main`. The checkout holds only the PR branch.

The plan is approved and its decisions are recorded: `scripts/agent-approve.mts` committed that before you started. Don't run `plan:approve`.

## Rules

- Never edit a hand-back path. Follow [Hand-back](#hand-back).
- Add no package: `npm install` is off. If a plan needs one, build the rest and write a "Big:" line ([big-departures rule](../../plans/BUILD.md#big-departures)).
- Write an unlikely case in your final PR comment, not in code ([AGENTS.md](../../AGENTS.md#workflow-rules)).
- Write each unit test for logic first (the [test-first rule](../../plans/BUILD.md#test-first)).
- As you iterate, run only the affected test file.
- If a test fails, read the error. Then follow the [failing-tests rule](../../plans/BUILD.md#failing-tests).
- Don't add temporary debug output.
- Record a small departure from the plan as the [small-departures rule](../../plans/BUILD.md#small-departures) says.

## Steps

1. <a id="reword"></a>**Reword.** Before you write code, do this for each answered decision in the plan:
   - Reword the Summary, Behaviour and Acceptance checks that the answer changes. Do this in the Spec and in each issue that the chosen option names.
   - Change no other text and no Decisions box. End each changed line with a cite, as "(#537 plan D5)".
   - Skip a closed related issue, and a body that already holds the new text and its cite.
   - Run the [Spec checks](spec-checks.md) on each new body. Use `origin/main` for `main`. Fix your new text.
   - If a reworded issue has an open plan PR (`gh pr list --state open --search "Closes #<n> in:body"`), comment there with the new value and a link.
   - If a reword fails, leave that issue and continue.
   - In the PR body and your final comment, name each reworded, closed and failed issue, and each problem.
2. **Stale facts.** Check the issue against `origin/main` (the [stale-facts rule](../../plans/README.md#stale-facts)). Check only what the issue cites as existing: a file that the build makes is no mismatch. On a mismatch, stop before you write code. Comment each mismatch on the PR.
3. Run the full `npm test` and `npm run e2e` once.
4. Push.
5. If you built the work, run the checks in [Verifying your work](../../AGENTS.md#verifying-your-work).
6. If every check passes, run the [ready check](../../plans/BUILD.md#ready-check).
7. Set the PR title and body to describe the work as it would merge now (the [plan-pr-flow rule](../../plans/README.md#plan-pr-flow)). Keep the reword line.
8. If one of these is true, leave the PR a draft. If none is true, run `gh pr ready <n>`.
   - A check failed.
   - The ready check stops you.
   - The plan changes a design system input (the [design-system rule](../../plans/README.md#design-system)).
   - The PR has the `hand-back` label.
   - This run wrote a "Big:" line.
9. Whether the checks pass or fail, comment on the PR last. List each "Big:" line first. Say what you did. If a check failed, say what blocked you. List each hand-back row that you did not build.

## Hand-back

<a id="hand-back"></a>If the plan's Files that change table names a [hand-back path](../../plans/README.md#hand-back), do these steps:

1. Build and push the other rows. Edit no hand-back path.
2. If the build needs a hand-back path that the table does not name, add its row to the table. Write a "Big:" line under `## Deviations`. Edit no hand-back path.
3. Keep the PR a draft. The push makes `claude-hand-back.yml` add the `hand-back` label.
