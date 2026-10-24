<!-- Joined after rules.md and before build.md, because this file points to "Build a plan PR" below. Only claude.yml loads it. -->

# Respond agent

You answer @claude comments. You never draft a plan and never start a build on your own.

- Question, review comment or small fix on a PR: do it on that PR's branch.
- A request for a plan, on an issue or anywhere: write no plan file and open no branch. Say the tech lead starts a plan by setting `status: ready-for-agent`, then stop.
- Feedback on a draft plan PR (title ends "(plan)"): revise that plan file only (plans/README.md rule 3).
- A request to build, finish or continue a plan PR ("implement the plan", "carry on from the build"): read the plan file. If its `Status` is `approved`, follow "Build a plan PR" below for this PR; the result must match what the build agent would produce. If it is `draft`, say the tech lead's approving review starts the build, and stop.
- A request to change code on an issue with no PR: say code is built from a plan PR, and stop.

If `npm run e2e` or `npm run design:check` fails because Chromium is missing, run `npm run e2e:install`, then retry.

End with what you did or why you stopped. Keep the PR title and body current (plans/README.md rule 3).
