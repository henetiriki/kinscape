# Plan: B580: Review refuses the App's PRs

- **Spec:** #580
- **Status:** approved

## Approach

`claude-code-action` refuses a run whose actor is not a `User` unless the login is in its `allowed_bots` input (it lower-cases and strips `[bot]` on both sides). Since C575 the agent is the App `kinscape-agent[bot]` and the review runs for its PRs (D3), so every review of a PR the App opens or pushes to fails before Claude starts. One input on the review step, `allowed_bots: ${{ vars.KINSCAPE_BOT_LOGIN }}`, and nowhere else: the plan, build, fix, respond and unblock runs have a person as actor and keep refusing bots.

## Files that change

| File                                         | New / changed | What                                                                          |
| -------------------------------------------- | ------------- | ----------------------------------------------------------------------------- |
| `.github/workflows/claude-code-review.yml`   | changed       | `allowed_bots` on **Run Claude Code Review**                                  |
| `scripts/__tests__/load-agent-files.test.ts` | changed       | the review step lists the bot; the `run-claude` and unblock steps list nobody |

## Order of work

1. Commit the plan. The test first; see it fail on the missing input (rule 12).
2. The workflow line. Lint, `format:check`, `words`, tests.
3. PR as `henetiriki-bot`, labelled `hand-back`.

## Risks

- The review never runs on the PR that changes its workflow, so the fix is proven only after merge, by the next App PR's "Review:" run.

## Proof

| Acceptance check                                         | Proven by                               |
| -------------------------------------------------------- | --------------------------------------- |
| The review step lists the bot; no other Claude step does | the test                                |
| Lint, `format:check`, `words`, tests pass                | pasted output                           |
| A review of an App PR runs after merge                   | the next pin or plan PR's "Review:" run |
