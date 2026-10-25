# Plan: C266: Inherit milestones from Intent to Spec to PR

- **Spec:** #266
- **Status:** approved

## Approach

`backlog-milestone.yml` triggers on `issues: [opened]` (Specs only), `pull_request: [opened, edited, reopened]` and `workflow_dispatch`. One `github-script` step reads `context.payload`, so no event text is interpolated:

- **Spec source:** the parent Intent's milestone; with no parent, the form answer: `#N` names an Intent, `M<n>` the milestone titled `M<n> …`.
- **PR source:** the first `Closes #N` naming a Spec with a milestone.

It sets a milestone only when the target has none. The backfill does every Spec, then every PR, in all states. Permissions: `issues: write`, `pull-requests: write`.

## Decisions

**D1 · Race with `backlog-spec-link.yml`** · Decides: Tech lead

Both start on `opened`; the parent link may not exist yet.

- **A.** Don't wait: parent, else the form answer, as above.
- **B.** Trigger on `workflow_run` of the link workflow; its payload lacks the issue number, so find the Spec by title.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · PRs from forks** · Decides: Tech lead

- **A.** `pull_request`, with the job skipped for forks (their token can't write).
- **B.** `pull_request_target`, which also fills fork PRs without checking out their code.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | New / changed | What               |
| ----------------------------------------- | ------------- | ------------------ |
| `.github/workflows/backlog-milestone.yml` | New           | The workflow above |

## Order of work

1. Commit this plan: `plan(C266): approved by @henetiriki`.
2. Write the workflow, run the checks, open the PR.

## Proof

| Acceptance check                        | Proven by                                    |
| --------------------------------------- | -------------------------------------------- |
| New Spec, PR open or edit, no overwrite | The tech lead's test Spec and PR after merge |
| Chore PR unchanged                      | This PR, after merge, on its next edit       |
| Backfill, then a second run is a no-op  | Two manual runs; the second run's log        |
| Lint, format                            | Their output                                 |
