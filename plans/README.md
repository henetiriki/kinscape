# Plans

How plans are drafted, approved and committed. Start each one from [TEMPLATE.md](TEMPLATE.md).

1. **Draft before code.** Plan in a read-only step: the files that change, the order of work, the risks, and how each acceptance check will be proven.
2. **Spec plans are committed first.** Save the approved plan as `plans/<spec-id>-<slug>.md` with `Status: approved`, as the first commit on the branch: `plan(<spec-id>): approved by @<tech-lead>`. Spec ids look like `M0.1`; a Bug's is `B<issue number>`.
3. **In GitHub Actions**, commit the plan as `plan(<spec-id>): draft` with `Status: draft` on `spec/<spec-id>-<slug>` (a Bug: `bug/<spec-id>-<slug>`; a Chore: `chore/<spec-id>-<slug>`), open a draft PR titled `<spec-id>: <Spec title> (plan)` and stop. Only the tech lead's approving review approves it (it may answer the plan's `## Decisions` as `D1: B`: record each answer under its decision, or comment and stop if one is open); `@claude` comments are feedback: revise the plan only. If an answer changes a count, name or value in the Spec's Behaviour or Acceptance checks, reword only those lines in the Spec's issue body with `gh issue edit` (as [how we work](../docs/how-we-work.md#decisions) says) and note it in one line in the PR body; change nothing the decision didn't. On approval, commit as rule 2 says, build, drop `(plan)` from the title, rewrite the PR body, and mark the PR ready. The title and body always describe the PR as it would merge now, not how it got there; update both whenever the work changes.
4. **Chores.** A quick `chore:` PR with no issue keeps its plan in the PR body. A chore filed as an issue commits `plans/chores/C<n>-<slug>.md` (300 words); rules 2, 3 and 5-8 apply, with id `C<n>`.
5. **Small departures** that don't change the plan's intent (file names, step order, an extra helper): update the plan in the same commit as the code, with one line under `## Deviations`.
6. **Big departures:** stop and return to planning if a change would alter scope, the data model, a public API, an acceptance check, or would add a dependency. The tech lead re-approves before work continues.
7. **Too big:** if the plan won't fit its word budget, or the diff will pass the line cap in `/refine spec` › Step 1, stop, commit what works and ask the tech lead to split the Spec.
8. The tech lead's PR approval signs off the code and the final plan together.
