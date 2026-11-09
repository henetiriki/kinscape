# Plan: C664: Skip the code review on the action-pin PR

- **Spec:** #664
- **Status:** approved

## Approach

The `run-name` and the job `if:` of `claude-code-review.yml` each get this clause after the draft check:

```
!(github.event.pull_request.user.login == vars.KINSCAPE_BOT_LOGIN &&
  github.event.pull_request.head.ref == 'bot/update-action-pins' &&
  github.event.pull_request.head.repo.full_name == github.repository)
```

A collaborator's PR fails the author test, so it is still reviewed. Every path except the test and this plan is a hand-back path (rule 13).

## Decisions

**D1 · `docs/building.md` step 4** · Decides: Tech lead

The step lists the PRs Claude does not review. The Chore does not name this file.

- **A.** Add the pin PR to the list.
- **B.** Leave the file stale.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                         | New / changed | What                                                      |
| -------------------------------------------- | ------------- | --------------------------------------------------------- |
| `.github/workflows/claude-code-review.yml`   | Changed       | The clause in both copies; the header comment             |
| `.github/agent/review.md`                    | Changed       | Line 7 keeps only `revert-*`                              |
| `scripts/__tests__/review-condition.test.ts` | New           | Two equal copies, each with the three tests in one `!( )` |
| `docs/building.md`                           | Changed       | Step 4, if D1 is A                                        |

## Order of work

1. The test, failing on the old file (rule 12).
2. The workflow, `review.md`, then `docs/building.md`.

## Risks

- A missing bracket skips more PRs. The test checks the group.

## Proof

| Acceptance check                        | Proven by                                       |
| --------------------------------------- | ----------------------------------------------- |
| `npm test`, 100%; new test fails on old | `npm test` output; the failing line in Evidence |
| Pin PR skipped; bot build PR reviewed   | After merge, by the tech lead                   |
| Collaborator PR on pin branch reviewed  | `review-condition.test.ts`                      |
| Pin PR merges                           | `ruleset-main.json` has no review check         |
