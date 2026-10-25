# Plan: C266: Inherit milestones from Intent to Spec to PR

- **Spec:** #266
- **Status:** approved

## Approach

`backlog-milestone.yml` triggers on `issues: [opened, edited]` (Specs only), `pull_request: [opened, edited, reopened]` and `workflow_dispatch`. One `github-script` step reads `context.payload`, so no event text is interpolated:

- **Spec source:** the parent Intent's milestone; with no parent, the form answer: `#N` names an Intent, `M<n>` the milestone titled `M<n> …`.
- **PR source:** the first closing reference (`close`, `fix`, `resolve` and their other forms) naming a Spec or Bug with a milestone.

It sets a milestone only when the target has none. A dead `#N` or unmatched form answer logs a warning and is skipped. The backfill does every Spec, then every PR. Permissions: `issues: write`, `pull-requests: write`.

## Decisions

**D1 · Race with `backlog-spec-link.yml`** · Decides: Tech lead

- **A.** Don't wait: parent, else the form answer.
- **B.** Trigger on `workflow_run` of the link workflow.

**Answer: A** (@henetiriki)

**D2 · PRs from forks** · Decides: Tech lead

- **A.** `pull_request`, job skipped for forks.
- **B.** `pull_request_target`.

**Answer: A** (@henetiriki)

**D3 · Closing keywords and Bugs** · Decides: Tech lead

- **A.** Widen the keywords; allow `type: bug`.
- **B.** `Closes` and Specs only.

**Answer: A** (@henetiriki)

**D4 · Spec re-run** · Decides: Tech lead

- **A.** Also run on `issues: [edited]`.
- **B.** The backfill is the repair path.

**Answer: A** (@henetiriki)

**D5 · Cleared PR milestone** · Decides: Tech lead

- **A.** The next edit refills it.
- **B.** Act only when `changes.body` is present.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | New / changed | What               |
| ----------------------------------------- | ------------- | ------------------ |
| `.github/workflows/backlog-milestone.yml` | New           | The workflow above |

## Proof

| Acceptance check                        | Proven by                             |
| --------------------------------------- | ------------------------------------- |
| New Spec, PR open or edit, no overwrite | The tech lead's test Spec and PR      |
| Chore PR unchanged                      | This PR (a chore: no Spec), next edit |
| Backfill, then a second run is a no-op  | Two manual runs; the second run's log |
| Lint, format                            | Their output                          |
