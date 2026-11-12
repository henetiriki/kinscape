---
name: fix-review-local
description: Fix the reviewer's findings on a KinScape PR in this checkout, as the tech lead. Use `/fix-review-local <PR number>` for a PR that CI cannot fix, such as a hand-back PR.
disable-model-invocation: true
argument-hint: <PR number>
---

# Fix review local

Fix the review of PR `<n>` in this checkout. The caller is the tech lead. Follow [`fix-review.md`](../../../.github/agent/fix-review.md) with the overrides below.

Run the [shared steps](../build-local/SKILL.md#shared-steps) of `build-local`, with the stop checks below as step 5.

## Stop checks

1. If the PR has the `fix-review` label and no `hand-back` label, stop. Change nothing. CI fixes that review.

## Overrides

- Edit the file that a finding names, including the plan. Record a small departure under `## Deviations`. If a departure is big, ask the tech lead.
- Prefix each `npm run review:threads` command with `GH_REPO=<owner>/<repo>`. Get the value from `gh repo view --json nameWithOwner`.
- After the push, reply on every thread in one line: what changed, or why not. Use `gh api graphql` with the `addPullRequestReviewThreadReply` mutation and the thread `id` that `list` prints.
- If a thread is fixed, resolve it. Leave a judged-wrong thread and a thread for a person open.
- Do not merge or push to `main`.
