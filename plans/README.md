# Plans

How plans are drafted, approved and committed. Start each one from [TEMPLATE.md](TEMPLATE.md).

1. <a id="draft-before-code"></a>**Draft before code.** Plan read-only.
2. <a id="plans-committed-first"></a>**Spec plans are committed first.** Save the plan as `plans/<spec-id>-<slug>.md`. [`agent-approve.mts`](../scripts/agent-approve.mts) commits its approval as `plan(<spec-id>): approved by @<tech-lead>`; a plan committed by hand has `Status: approved` and that commit text. Spec ids look like `M0.1`; a Bug's is `B<issue number>`, and its plan is `plans/bugs/B<n>-<slug>.md`.
3. <a id="plan-pr-flow"></a>**In GitHub Actions**, do these steps:
   - Refresh the issue ([stale-facts rule](#stale-facts)).
   - Commit the plan as `plan(<spec-id>): draft` with `Status: draft`.
   - Use branch `spec/<spec-id>-<slug>` (a Bug: `bug/<spec-id>-<slug>`).
   - Open a draft PR titled `<spec-id>: <Spec title> (plan)` (a Bug: `B.<n>: <title without "Bug: "> (plan)`).
   - Put `Closes #<issue>` in its body.
   - Stop.

   Only the tech lead's approving review approves the plan. `@claude` comments are feedback: revise the plan only. If an answer changes the Spec's text, update its issue body as [how we work](../docs/how-we-work.md#decisions) says. Note it in one line in the PR body. On approval, the build agent drops `(plan)` from the title, rewrites the PR body and marks the PR ready. The title and body describe the PR as it would merge now (except Evidence, [test-first rule](#test-first)).

4. <a id="chores"></a>**Chores.** Every chore is a Chore issue and commits `plans/chores/C<n>-<slug>.md`. These rules apply: [plans-committed-first](#plans-committed-first), [plan-pr-flow](#plan-pr-flow), [small-departures](#small-departures), [big-departures](#big-departures), [too-big](#too-big) and [approval](#approval). Use id `C<n>` and branch `chore/C<n>-<slug>`. The plan PR is titled `C.<n>: <title without "Chore: "> (plan)`. The build drops `(plan)`. The tech lead plans and builds a hand-back ([hand-back rule](#hand-back)). Only Dependabot's PRs, `actions-pin-update.yml`'s and reverts need no issue or plan.
5. <a id="small-departures"></a>**Small departures** that don't change the plan's intent (file names, step order, an extra helper): update the plan in the same commit as the code, with one line under `## Deviations`.
6. <a id="big-departures"></a>**Big departures:** stop and return to planning if a change would alter scope, the data model, a public API, an acceptance check, or would add a dependency. The tech lead re-approves before work continues.
7. <a id="too-big"></a>**Too big:** if the plan won't fit its word budget, or the diff will pass the line cap in `/refine spec` › Step 1, stop, commit what works and ask the tech lead to split the Spec.
8. <a id="approval"></a>Tech lead's PR approval signs off code and final plan together.
9. <a id="missing-components"></a>**Missing components.** A screen plan has a `## Components` table. Build a missing component in the same Spec, in its own commit with its test, if the diff fits the size cap in the [too-big rule](#too-big). Otherwise stop: file a Spec for the component, set the screen Spec to `status: blocked` with "blocked by #<n>", and build no stand-in. A Spec that builds a shared component adds it to `CONTROLS`. Run steps 2 to 5 of [Changing the design system](../design/CANVAS.md#changing-the-design-system) on the same branch ([`COMPONENTS.md`](../design/COMPONENTS.md)).
10. <a id="failing-tests"></a>**Failing tests.** Fix the code, not the test. Change, skip or delete a test, or loosen an assertion, only where the plan changes the behaviour it checks, listing that test under Files that change. Otherwise a wrong-looking test is a big departure ([big-departures rule](#big-departures)).
11. <a id="stale-facts"></a>**Stale facts.** Before drafting, refresh the issue as [`refresh.md`](../.github/agent/refresh.md) says. Before building, check it against `origin/main`: the files, names, counts and linked issues it cites. Before either, check that a Bug still reproduces. If a check fails, stop. Comment each mismatch and name who fixes it. If the PO fixes it, swap the issue's status label for `status: ready-for-po`. Don't edit the issue, except as the refresh does.
12. <a id="test-first"></a>**Test first.** For logic a unit test covers, see the test fail on the behaviour (not an import error) before writing the code; paste that failing line in the PR's Evidence.
13. <a id="hand-back"></a>**Hand back, don't build.** A hand-back path matches a `.github/CODEOWNERS` line after the catch-all and isn't in `EXEMPT` ([`scripts/hand-back.mts`](../scripts/hand-back.mts)). If a plan edits one, [`claude-hand-back.yml`](../.github/workflows/claude-hand-back.yml) labels its PR `hand-back`. A chore needing a secret or too big ([too-big rule](#too-big)) gets no plan PR. With no plan PR, comment why on the issue.
14. <a id="design-system"></a>**Design system.** If a plan changes a [design system input](../design/CANVAS.md#changing-the-design-system), the tech lead, or a local Claude Code session that they start, runs steps 3 to 5. The CI build agent cannot sign in, so it asks in the PR and leaves the PR a draft.
15. <a id="canvas-follow-up"></a>**Canvas follow-up.** A canvas-only follow-up has its own plan: [`C689-canvas-refresh.md`](chores/C689-canvas-refresh.md).
16. <a id="ready-check"></a>**Ready check.** Before the PR leaves draft, compare the plan and the diff with these parts of the issue:
    - A Chore: "What to change", "How we'll know it's done" and Constraints.
    - A Spec: "Behaviour and UX" and "Acceptance checks".
    - A Bug: "What did you expect?", "Acceptance checks" and "Must not break".

    List each difference under `## Deviations`. If a difference changes a done check, stop for the tech lead ([big-departures rule](#big-departures)).

17. <a id="build-ownership"></a>**Build ownership.** The CI agent builds an approved plan, except a hand-back ([building](../docs/building.md#specs-bugs-and-chores)). Before a person builds by hand, the person does these steps:
    - Run `git fetch`. Then read the PR comments.
    - If the PR has a "Building…" comment, wait. The workflow deletes it when the run ends.
    - If the PR has no "Building…" comment, continue from the last pushed commit.
