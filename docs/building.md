# Building and shipping

How an approved Spec, Bug or Chore becomes code in `main`. Roles, labels and decisions: [How we work](how-we-work.md).

## Specs, Bugs and Chores

A Bug or Chore takes the same path; below, "Spec" means all three. The branch is `spec/<id>-<slug>` (a Bug's: `bug/B<n>-<slug>`; a Chore's: `chore/C<n>-<slug>`). The CI agent hands back what it can't build ([rule 13](../plans/README.md)); the tech lead plans and builds that. Only Dependabot's and `actions-pin-update.yml`'s PRs need no issue or plan.

1. The tech lead sets `status: ready-for-agent`. Claude plans in GitHub Actions and opens a draft pull request with the plan ([plan rules](../plans/README.md)). Comment `@claude` there to change it.
2. The tech lead's approving review starts the build. Answer the plan's open [decisions](how-we-work.md#decisions) in that review.
3. Claude records them (and rewords the Spec if one changes its text), builds, rewrites the PR description and marks it ready. A draft runs only the format and words checks.
4. Claude reviews each ready pull request, except Dependabot's and `plans/`-only ones; changing `claude-code-review.yml` gets a comment. Ask `@claude` to act on a comment.

### If a run stalls

A silent run gets a linking comment; a plan run with no plan PR sets `status: blocked`: check the run, then swap it for `ready-for-agent`. Stalled build: re-run it.

## Styles

A component's CSS goes in a `*.module.css` beside it, with camelCase class names; a rule several components share goes in its own module and is taken with `composes`.

## Merging

Merge rules are in [repo settings](repo-settings.md#whats-set-and-why). The tech lead merges; a pull request the tech lead wrote is merged by admin bypass.

When a user-visible pull request is ready to try, Claude sets `status: ready-for-po` on it and writes what to try under _For the PO_. Previews need a Vercel sign-in ([Vercel settings](repo-settings.md#vercel)).

## Live

Merging to `main` deploys production on Vercel unless nothing visible changed ([rule](repo-settings.md#vercel)); no separate release. To undo a bad one, the tech lead uses Instant Rollback in the Vercel dashboard, then merges a revert pull request so `main` matches production.
