# Plan: C985: Skip a wrong-Type issue at the if: with its title prefix, and remove log-type

- **Spec:** #985
- **Status:** draft

## Approach

Each of the four workflows tests the title prefix with `startsWith` where it now tests `github.event.issue.type`. The `run-name` and the job `if:` get the same clause. The scripts and `scripts/agent-gate.mts` keep their API reads of the Type, so the title only filters.

The new test parses each workflow with `yaml`, as `app-token.test.ts` does. It takes the `startsWith` clause from the `run-name` and the job `if:`. It fails if a clause is missing, if the two clauses differ, or if the prefixes differ from `Spec: `, `Bug: `, `Chore: ` (plan) and `Spec: ` (backlog). It also fails if a `run-name` or a job `if:` in any workflow names `github.event.issue.type`.

Every file under `.github/workflows/` is a hand-back path, so the tech lead builds this Chore.

## Files that change

| File                                                                                       | New / changed | What                                       |
| ------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------ |
| `.github/workflows/claude-plan.yml`                                                        | changed       | Title clause, comments; remove `log-type`  |
| `backlog-spec-link.yml`, `backlog-milestone.yml`, `backlog-intent-ready.yml` (same folder) | changed       | Title clause, comments                     |
| `.github/workflows/README.md`                                                              | changed       | `npm run workflows:diagram`                |
| `scripts/__tests__/issue-type-gates.test.ts` → `issue-title-filters.test.ts`               | renamed       | Test the title filters (`git mv`, rewrite) |

## Order of work

1. Rename and rewrite the test. See it fail on the four workflows.
2. Change the conditions and comments. Remove `log-type`.
3. Run `npm run workflows:diagram`.
4. Remove the title test from one `run-name` and one `if:`. See the test fail each time. Restore it.
5. Run the checks in `AGENTS.md`.
6. After merge, the tech lead runs the manual checks.

## Risks

- `startsWith` ignores case, so a `spec: ` title passes the filter. The API gate still stops it.
- A Chore from `claude-denial-audit.yml` has no prefix. If the owner labels it `status: ready-for-agent`, the run skips. The Chore accepts this.

## Proof

| Acceptance check                             | Proven by                   |
| -------------------------------------------- | --------------------------- |
| No `run-name` or `if:` reads `issue.type`    | New test                    |
| `log-type` gone; the diagram leaves no diff  | `workflows-diagram.test.ts` |
| The test fails with one title test removed   | Step 4 output in Evidence   |
| `npm test`, lint, format, words              | Their output in Evidence    |
| Intent, Spec, Bug, Chore and no-prefix runs  | Tech lead, after merge      |
| Close and open runs of the backlog workflows | Tech lead, after merge      |
