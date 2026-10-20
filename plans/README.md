# Plans

How plans are drafted, approved and committed. Start each one from [TEMPLATE.md](TEMPLATE.md).

1. **Draft before code.** Plan in a read-only step: the files that change, the order of work, the risks, and how each acceptance check will be proven.
2. **Spec plans are committed first.** Save the approved plan as `plans/<spec-id>-<slug>.md` with `Status: approved`, as the first commit on the branch: `plan(<spec-id>): approved by @<tech-lead>`. Spec ids look like `M0.1`.
3. **In GitHub Actions**, commit the plan as `plan(<spec-id>): draft` with `Status: draft` on `spec/<spec-id>-<slug>`, open a draft PR and stop. Only the tech lead's approving review approves it (it may answer open decisions: record them, or comment and stop); `@claude` comments are feedback: revise the plan only. On approval, commit as rule 2 says, build, rewrite the PR body, and mark the PR ready.
4. **Chore plans are not committed.** The PR body says what changed and why.
5. **Small departures** that don't change the plan's intent (file names, step order, an extra helper): update the plan in the same commit as the code, with one line under `## Deviations`.
6. **Big departures:** stop and return to planning if a change would alter scope, the data model, a public API, an acceptance check, or would add a dependency. The tech lead re-approves before work continues.
7. **Too big:** if the plan won't fit its word budget, or the diff will pass the line cap in `/refine spec` › Step 1, stop, commit what works and ask the tech lead to split the Spec.
8. The tech lead's PR approval signs off the code and the final plan together.
