---
name: build-local
description: Build an approved KinScape plan PR in this checkout, as the tech lead. Use `/build-local <PR number>` for a plan PR that CI cannot build, such as a hand-back.
disable-model-invocation: true
argument-hint: <PR number>
---

# Build local

Build plan PR `<n>` in this checkout. The caller is the tech lead. Follow [`build.md`](../../../.github/agent/build.md) with the overrides below.

## Shared steps

`fix-review-local` runs these steps too.

1. Run `gh pr view <n> --json title,body,headRefName,labels,isDraft,state,files`. If the PR is not open, stop.
2. Run `git status --porcelain`. If it prints a line, stop. Change nothing.
3. Run `git worktree list`. If another worktree holds the branch, stop. Change nothing.
4. Run `git fetch origin <branch>`. Then run `git fetch origin main`.
5. Run the skill's stop checks.
6. Run `git switch <branch>`, then `git pull --ff-only`.

Rules for every step:

- Run each `git push`, `git pull`, `git fetch` and `gh` command alone. Write a PR body to a file and pass `--body-file`.
- A stop that needs no decision: report it in the session. Post no PR comment. Examples: a dirty tree, a plan that is not approved, the `fix-review` label.
- A decision for the tech lead: ask in the session. Post no decision to the PR as a comment or an open question. This replaces each "comment why", "ask in the PR" and "reply that it is for a person" line in the agent file.
- Record each answer in the plan ([Decisions](../../../docs/how-we-work.md#decisions)).
- An unlikely case ([AGENTS.md](../../../AGENTS.md#workflow-rules)): ask the tech lead. Give its failure, likelihood and cost. Write no code. After the answer, write the outcome in one line in the final PR comment.

## Stop checks

1. Read the plan from `origin/<branch>` (`git show origin/<branch>:<plan path>`). The path is the `plans/` file in the PR files.
2. If the plan does not say `Status: approved`, stop. Change nothing. Ask the tech lead to approve the plan in the PR on GitHub. Do not edit the plan. When the tech lead says it is approved, run shared steps 1 to 4 again. Continue only when the plan says `Status: approved`.
3. Run the [build-ownership](../../../plans/README.md#build-ownership) steps. If the PR has a "Building…" comment, wait.
4. Run the [stale-facts](../../../plans/README.md#stale-facts) check. If it fails, report each mismatch in the session and stop. Comment nothing. Change no label.

## Overrides

- Use the local `gh` token.
- Edit a hand-back path only if the plan's "Files that change" table names it. Any other hand-back path is a big departure: ask the tech lead.
- Run `npm run e2e`. If the browser cannot start, write that under Evidence and name the CI e2e job as the check.
- If the plan changes a design system input, run the steps that the [design-system rule](../../../plans/README.md#design-system) gives a local session. If a step needs a claude.ai sign-in that the session lacks, leave the PR a draft and ask the tech lead.
- Push. Drop "(plan)" from the title. Rewrite the body. Run `gh pr ready <n>` unless `build.md` step 6 says to leave the draft. Ignore its design-system bullet if the session ran every design-system step.
- Do not merge, push to `main`, or change a label or a reviewer.
