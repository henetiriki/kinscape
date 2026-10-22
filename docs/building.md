# Building and shipping

How an approved Spec, a Bug or a chore becomes code in `main`. Roles, labels and decisions: [How we work](how-we-work.md).

## Specs and Bugs

A Bug takes the same path; below, "Spec" means both. The branch is `spec/<id>-<slug>` (a Bug's: `bug/B<n>-<slug>`).

1. The tech lead sets `status: ready-for-agent`. Claude plans in GitHub Actions and opens a draft pull request with the plan ([plan rules](../plans/README.md)). Comment `@claude` there to change it.
2. The tech lead's approving review starts the build. Answer the plan's open [decisions](how-we-work.md#decisions) in that review.
3. Claude records them (and rewords the Spec if one changes its text), builds, rewrites the PR description and marks it ready. A draft runs only the format and words checks; marking it ready runs them all.
4. Claude reviews each ready pull request, except Dependabot's and those that change only `docs/` or `plans/`. Ask `@claude` on any issue or pull request to act on a comment.

### If a run stalls

A plan run that ends without a comment gets a safety-net comment linking the run, and the Spec becomes `status: blocked`. Check the run and branch, then remove `blocked` and set `ready-for-agent` again. A stalled build: re-run it from the Actions tab.

## Styles

A component's CSS goes in a `*.module.css` beside it, with camelCase class names; a rule several components share goes in its own module and is taken with `composes`.

## Chores

Tooling, CI, docs, process and settings need no issue. Claude plans in plan mode and the tech lead accepts the plan; it isn't committed, so the PR body says what changed and why. Open a `chore:` pull request from a branch off `origin/main`.

## Merging

Squash only. A pull request needs one approval, from the PO or the tech lead, resolved review conversations and green required checks ([list](repo-settings.md)). A new push dismisses earlier approvals. The tech lead merges; a pull request the tech lead wrote is merged by admin bypass.

When a user-visible pull request is ready to try, Claude sets `status: ready-for-po` on it and writes what to try under _For the PO_. Previews need a Vercel sign-in ([Vercel settings](repo-settings.md#vercel)).

## Live

Merging to `main` deploys production on Vercel; there is no separate release. To undo a bad one, the tech lead uses Instant Rollback in the Vercel dashboard, then merges a revert pull request so `main` matches production. Claude never deploys.
