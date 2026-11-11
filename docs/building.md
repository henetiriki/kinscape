# Building and shipping

How an approved Spec, Bug or Chore becomes code in `main`. Roles, labels and decisions: [How we work](how-we-work.md).

## Specs, Bugs and Chores

A Bug or Chore takes the same path; below, "Spec" means all three. The branch is `spec/<id>-<slug>` (a Bug's: `bug/B<n>-<slug>`; a Chore's: `chore/C<n>-<slug>`). Who builds a hand-back, and which PRs need no issue: the [chores rule](../plans/README.md#chores) and the [hand-back rule](../plans/README.md#hand-back).

1. The tech lead sets `status: ready-for-agent`. Claude plans in GitHub Actions and opens a draft pull request with the plan ([plan rules](../plans/README.md)). Comment `@claude` there to change it.
2. The tech lead's approving review starts the build. Answer the plan's open [decisions](how-we-work.md#decisions) in that review.
3. Claude records them (and rewords the Spec if one changes its text), builds, rewrites the PR description and marks it ready. A draft runs only the format and words checks.
4. Claude reviews each ready pull request. It skips Dependabot's PRs, the bot's action-pin PR (a person's push gets a review) and `plans/`-only PRs. A change to `claude-code-review.yml` gets a comment. The tech lead adds the `fix-review` label to have Claude fix the findings and push. The run removes the label, and the push starts a new review. A fork or `hand-back` PR never runs. A draft, or anyone else's label, does nothing and the label stays. When the PR is ready, remove the label and add it again.
5. The tech lead adds `resolve-conflict` to have Claude merge `main` into the PR and push, or comment why not. As `fix-review`, but a draft runs too.

### If a run stalls

A silent run gets a comment that links the run. A plan run with no plan PR sets `status: blocked`: check the run, then swap the label for `ready-for-agent`. If a build stalls, run it again.

## Merging

The merge rules, and the admin bypass for the tech lead's own PRs, are in [repo settings](repo-settings.md#whats-set-and-why).

When a user-visible pull request is ready to try, [a workflow](../.github/workflows/backlog-issue-status.yml) sets `status: ready-for-po` on its issue; write what to try under _For the PO_. Previews need a Vercel sign-in ([Vercel settings](infrastructure.md#vercel)).

## Live

A merge to `main` deploys production on Vercel unless nothing visible changed ([rule](infrastructure.md#vercel)). There is no separate release. To undo a bad deploy, the tech lead uses Instant Rollback in the Vercel dashboard. Then the tech lead merges a revert pull request, so `main` matches production.
