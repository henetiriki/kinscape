# Plans

These rules apply to each plan, from its draft to its commit. Start each plan from [TEMPLATE.md](TEMPLATE.md).

## Item types

<a id="item-types"></a>Each Spec, Bug and Chore has a plan, a branch and a plan PR. `<id>` is the id in the table. `<n>` is the issue number.

| Item  | Id                          | Plan path                     | Branch                  | Plan PR title                             |
| ----- | --------------------------- | ----------------------------- | ----------------------- | ----------------------------------------- |
| Spec  | `<spec-id>`, such as `M0.1` | `plans/<spec-id>-<slug>.md`   | `spec/<spec-id>-<slug>` | `<spec-id>: <Spec title> (plan)`          |
| Bug   | `B<n>`                      | `plans/bugs/B<n>-<slug>.md`   | `bug/B<n>-<slug>`       | `B.<n>: <title without "Bug: "> (plan)`   |
| Chore | `C<n>`                      | `plans/chores/C<n>-<slug>.md` | `chore/C<n>-<slug>`     | `C.<n>: <title without "Chore: "> (plan)` |

Only a PR from Dependabot, a PR from `actions-pin-update.yml` or a revert needs no issue and no plan.

## Before you draft

<a id="stale-facts"></a>**Stale facts.** Before you draft a plan, refresh the issue as [`refresh.md`](../.github/agent/refresh.md) says. Before you build, check these parts of the issue against `origin/main`:

- the files that it cites;
- the names;
- the counts;
- the linked issues.

Before you draft or build, check that a Bug still reproduces.

If a check fails, stop. Comment each mismatch. Name who fixes each one. If the PO fixes it, swap the status label of the issue for `status: ready-for-po`. Do not edit the issue, except as the refresh does.

<a id="related-issues"></a>**Related issues.** Before you draft or revise a plan, read each related issue:

- Each `dependencies/blocking` issue.
- The parent Intent. These have none:
  - a Bug;
  - a Chore;
  - a milestone Spec.
- Each open sub-issue of the parent that shares a requirement ID.

In a [decision's](../docs/how-we-work.md#decisions) question, name each related issue that holds a value for the same thing, with its value. Name the issues that each differing option changes. If the plan sets a value that differs from a related issue, write a decision for it. A clash never stops a run. Only the build edits a related issue.

## Plan PR

<a id="plan-pr-flow"></a>**In GitHub Actions**, do these steps:

- Refresh the issue ([stale-facts rule](#stale-facts)).
- Commit the plan as `plan(<id>): draft` with `Status: draft`.
- Use the plan path and the branch from the [table](#item-types).
- Open a draft PR with the plan PR title from the table.
- Put `Closes #<issue>` in its body.
- Stop.

Only the tech lead's approving review approves the plan. [`agent-approve.mts`](../scripts/agent-approve.mts) commits the approval as `plan(<id>): approved by @<tech-lead>`. A `@claude` comment is feedback: revise the plan only. A respond run records a plan answer in the plan only. The build rewords the issues ([reword step](../.github/agent/build.md#reword)).

After the tech lead approves the plan, the build agent does these steps:

- It drops `(plan)` from the title.
- It rewrites the PR body.
- It marks the PR ready.

The title and the body describe the work that the PR merges now. Evidence is the exception ([test-first rule](#test-first)).

**In a local session**, a plan that `agent-approve.mts` does not commit has `Status: approved` and the same commit text.

## Who builds

<a id="build-ownership"></a>**Build ownership.** The CI agent builds an approved plan, except a hand-back ([building](../docs/building.md#specs-bugs-and-chores)). Before a person builds by hand, the person does these steps:

- Run `git fetch`. Then read the PR comments.
- If the PR has a "Building…" comment, wait. The workflow deletes it when the run ends.
- If the PR has no "Building…" comment, continue from the last pushed commit.

<a id="hand-back"></a>**Hand-back.** The CI build agent does not build a hand-back. A hand-back path matches a `.github/CODEOWNERS` line after the catch-all and is not in `EXEMPT` ([`scripts/hand-back.mts`](../scripts/hand-back.mts)). If a plan edits a hand-back path, [`claude-hand-back.yml`](../.github/workflows/claude-hand-back.yml) labels its PR `hand-back`. A chore gets no plan PR if it needs a secret or is too big ([too-big rule](#too-big)). The tech lead plans and builds a hand-back. If there is no plan PR, comment the reason on the issue.

<a id="design-system"></a>**Design system.** This rule applies if a plan changes a [design system input](../design/CANVAS.md#changing-the-design-system). The tech lead runs steps 3 to 5, or a local Claude Code session that the tech lead starts runs them. If a board changed, the same person or session also runs step 7. The CI build agent cannot get access to claude.ai, so it asks in the PR. It keeps the PR as a draft. A canvas-only follow-up has its own plan: [`C689-canvas-refresh.md`](chores/C689-canvas-refresh.md).

## While you build

<a id="test-first"></a>**Test first.** This rule applies to logic that a unit test covers. Before you write the code, see the test fail on the behaviour, not on an import error. Paste that failing line in the Evidence of the PR.

<a id="missing-components"></a>**Missing components.** A screen plan has a `## Components` table. If the diff fits the size cap in the [too-big rule](#too-big), build a missing component in the same Spec. Give the component its own commit, with its test.

If the diff does not fit, do these steps:

- Stop.
- File a Spec for the component.
- Set the screen Spec to `status: blocked`.
- Set its "blocked by" link to that Spec ([linking issues](../docs/how-we-work.md#linking-issues)).

Build no stand-in. A style that you copy from another component is a stand-in.

A Spec that builds a shared component adds it to `CONTROLS`. Run steps 2 to 7 of [Changing the design system](../design/CANVAS.md#changing-the-design-system) on the same branch ([`COMPONENTS.md`](../design/COMPONENTS.md)).

<a id="failing-tests"></a>**Failing tests.** Fix the code, not the test. If the plan changes the behaviour that a test checks, you can do one of these to the test:

- Change the test.
- Skip the test.
- Delete the test.
- Loosen an assertion.

The plan must list that test under Files that change. In each other case, a test that looks wrong is a big departure ([big-departures rule](#big-departures)).

## When the plan changes

<a id="small-departures"></a>**Small departures.** A small departure does not change the intent of the plan. These are examples:

- a file name;
- the step order;
- an extra helper.

Update the plan in the same commit as the code. Write one line under `## Deviations`. The tech lead's PR approval approves the code and the final plan together.

<a id="big-departures"></a>**Big departures.** A big departure is a change that does one of these:

- It alters the scope.
- It alters the data model.
- It alters a public API.
- It alters an acceptance check.
- It adds a dependency.

If a change is a big departure, stop. Revise the plan. The tech lead approves the plan again before the work continues.

<a id="too-big"></a>**Too big.** A plan is too big if it does not fit its word budget. It is also too big if the diff will pass the line cap in `/refine spec` › Step 1. If the plan is too big, do these steps:

- Stop.
- Commit what works.
- Ask the tech lead to split the Spec.

If a Chore gets no plan PR, follow the [hand-back rule](#hand-back).

## Before ready

<a id="ready-check"></a>**Ready check.** Before the PR leaves the draft state, compare the plan and the diff with these parts of the issue:

- A Chore:
  - "What to change";
  - "How we'll know it's done";
  - Constraints.
- A Spec: "Behaviour and UX" and "Acceptance checks".
- A Bug:
  - "What did you expect?";
  - "Acceptance checks";
  - "Must not break".

Do not list an edit that a step of [Changing the design system](../design/CANVAS.md#changing-the-design-system) makes. List each other difference under `## Deviations`. If a difference changes a done check, stop for the tech lead ([big-departures rule](#big-departures)).
