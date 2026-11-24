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

- Edit the file that a finding names, including the plan. Record a small departure under `## Deviations`.
- Run `npm run review:threads:local` in place of `npm run review:threads` for `list`, `reply` and `resolve`. It needs `GH_TOKEN`.
- Reply on a thread in one line. For a fixed thread, say what changed.
- List the findings before you change a file.
- Ask the tech lead about each finding of these kinds:
  - a finding that you would judge wrong;
  - a finding that you would leave for a person;
  - a fix that is a design decision.
- Make a fix that is a big departure from the plan. Write a "Big:" line under `## Deviations` ([big-departures rule](../../../plans/BUILD.md#big-departures)).
- Ask every question before the first fix.
- Fix a clear finding without a question.
- The tech lead's answer decides each asked finding. Leave a thread open only if the tech lead says so.
- If the merge fails or the second push fails, also tell the tech lead in the session.
- Do not merge or push to `main`.
