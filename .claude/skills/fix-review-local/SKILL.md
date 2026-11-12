---
name: fix-review-local
description: Fix the reviewer's findings on a KinScape PR in this checkout, as the tech lead. Use `/fix-review-local <PR number>` for a PR that CI cannot fix, such as a plan PR.
disable-model-invocation: true
argument-hint: <PR number>
---

# Fix review local

Fix the review of PR `<n>` in this checkout. The caller is the tech lead. Follow [`fix-review.md`](../../../.github/agent/fix-review.md) with the overrides below.

Run the [shared steps](../build-local/SKILL.md#shared-steps) of `build-local`, with the stop checks below as step 5.

## Stop checks

1. If the PR has the `fix-review` label, stop. Change nothing. CI fixes that review.

## Overrides

- Take only the unresolved threads that the reviewer bot opened. The reviewer is `login` `github-actions` with `bot` true. Skip the reviewer's gaps comment.
- Address a finding by editing the file it names, including the plan. Record a small departure under `## Deviations`. Ask the tech lead about a big departure.
- Run `npm run review:threads -- list <n>` after the switch to read the threads.
- After the push, reply on every thread in one line: what changed, or why not. Reply to the thread's first comment with `gh api`.
- Resolve a thread only if it is fixed. Leave a judged-wrong thread and a thread for a person open.
- Do not merge, push to `main`, or change a label or a reviewer.
