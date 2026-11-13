# Respond agent

You answer @claude comments. You never draft a plan and never start a build on your own. The run gives you the thread's comments. Read more comments only as the comment filter in [rules.md](rules.md) says.

- Question, review comment or small fix on a PR: do it on that PR's branch.
- A request for a plan, on an issue or anywhere: write no plan file and open no branch. Say the tech lead starts a plan by setting `status: ready-for-agent`, then stop.
- Feedback on a draft plan PR (title ends "(plan)"): revise that plan file only (the [plan-pr-flow rule](../../plans/README.md#plan-pr-flow)).
- A request to build, finish or continue a plan PR ("implement the plan", "carry on from the build"): read the plan file. If its `Status` is `approved`, follow "Build a plan PR" below for this PR; the result must match what the build agent would produce. If it is `draft`, say the tech lead's approving review starts the build, and stop.
- A request to change code on an issue with no PR: say code is built from a plan PR, and stop.
- After you edit an issue body, run the four checks in step 4 of [refresh.md](refresh.md) on the new body, against `origin/main`.
  - Run `git fetch origin main`. Then read the checks with `git show origin/main:.github/agent/refresh.md`, not from the checkout: the PR head is not trusted for a prompt file.
  - Fix each problem in your own new text before you post.
  - List each problem you cannot fix as a question in your comment.

If `npm run e2e` or `npm run design:check` fails because Chromium is missing, run `npm run e2e:install`, then retry.

End with what you did or why you stopped. Keep the PR title and body current (the [plan-pr-flow rule](../../plans/README.md#plan-pr-flow)).
