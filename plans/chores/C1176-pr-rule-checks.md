# Plan: C1176: Check each PR for Closes, edited tests, new dependencies and size

- **Spec:** #1176
- **Requirement IDs:** none: a process Chore.
- **Status:** approved

## Approach

`scripts/pr-checks.mts` follows the shape of `scripts/hand-back.mts`: a `run(args, env, deps)` that gets a `gh` call and an `append` call for the job summary, and an `import.meta.main` block. It reads the PR with `gh pr view <n> --json body,labels,headRefName,baseRefOid,headRefOid`, the files with `ghList` on `pulls/<n>/files`, and the plans and `package.json` from the contents API. Each check is its own function that returns its failure lines, so each stays under the `max-lines-per-function` cap. `run` writes each line to the summary and to the log, and returns 1 if a line is a failure.

Check details that the Chore leaves open:

- **Edited tests.** An edited test has the status `modified`, `removed`, `renamed` or `changed`. For a rename, a row for the old path or the new path passes.
- **Plan rows.** `hand-back.mts` gets an exported `tableRows`: the cells of each row of _Files that change_. `tablePaths` then reads its first column from `tableRows`. Check 3 looks for the package name as a whole token in the cells of a row whose first cell names `package.json`.
- **Big: lines.** A line under `## Deviations` counts if, after an optional `- ` or `* `, it starts with `Big:` and holds the package name as a whole token.
- **Failed API call.** The check that needs the call fails with the line "`<check>`: `<call>` failed: `<reason>`". The other checks still run.

## Decisions

**D1 · What counts as `Closes #n`** · Decides: Tech lead

Check 1 needs a rule for what text closes an issue.

- **A.** Match `Closes #<number>` in the body, case-insensitive, after HTML comments are removed. Two matches of the same number count as one. Same cost as B.
- **B.** Use `closingIssuesReferences`. It also counts `Fixes`, `Resolves` and a link set in the sidebar. The summary then cannot point to the text to fix.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · A PR that changes more than one plan** · Decides: Tech lead

Checks 2 and 3 read "the `plans/` file that the PR changes". A PR can change two plans, for example a build that also fixes an old plan.

- **A.** Read the tables and `## Deviations` of each changed `plans/**.md` that the PR does not remove, at the head commit. A row in any of them passes. About 5 lines.
- **B.** Fail checks 2 and 3 with the line "The PR changes `<n>` plans; checks 2 and 3 need one." About 5 lines.
- **Other:** your own.

**Answer: A** (@henetiriki)

With no changed plan, each edited test and each new dependency fails, as the Chore says.

## Alternatives considered

- Read the PR from the event payload: the Chore asks for the API, and an `edited` or `labeled` event can carry an old body.
- Run the checks inside `ci.yml`: that workflow does not run on `edited`, `labeled` or `unlabeled`, and its jobs check out the head.

## Files that change

| File                                  | New / changed | What                                                                                                                                              |
| ------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/pr-checks.mts`               | New           | The four checks, the skips and the summary lines                                                                                                  |
| `scripts/__tests__/pr-checks.test.ts` | New           | Each check with a pass and a failure, each skip, a failed API call                                                                                |
| `scripts/hand-back.mts`               | Changed       | Export `tableRows`; `tablePaths` uses it. The tests in `hand-back.test.ts` do not change                                                          |
| `scripts/issue-status.mts`            | Changed       | Export `withoutComments`; `pr-checks.mts` imports it and `TYPES`                                                                                  |
| `scripts/types.ts`                    | Changed       | `PrChecksDeps`: `append` and `gh`                                                                                                                 |
| `scripts/github/ruleset-main.json`    | Changed       | Required check `pr-checks`, integration id 15368                                                                                                  |
| `scripts/github/labels.sh`            | Changed       | `size: accepted`, "The tech lead accepts a PR over the line cap"                                                                                  |
| `plans/README.md`                     | Changed       | _Plan PR_: remove "Put `Closes #<issue>` in its body."                                                                                            |
| `plans/BUILD.md`                      | Changed       | _Too big_: "the line cap of `scripts/pr-checks.mts`"                                                                                              |
| `.github/workflows/ci-pr-checks.yml`  | New           | Tech lead. "CI: PR checks", job `pr-checks`, the six `pull_request` types, base checkout, three read permissions, a concurrency group for each PR |
| `.github/workflows/README.md`         | Changed       | Tech lead. Run `npm run workflows:diagram`; `workflows-diagram.test.ts` fails without it                                                          |

## Order of work

1. Add `tableRows` to `hand-back.mts`. Run `hand-back.test.ts` with no change to it.
2. Write `pr-checks.test.ts`. See it fail on the behaviour.
3. Write `pr-checks.mts` and `PrChecksDeps`.
4. Edit `ruleset-main.json`, `labels.sh`, `plans/README.md` and `plans/BUILD.md`.
5. Run the checks in `AGENTS.md` › _Commands_.
6. The tech lead adds `ci-pr-checks.yml` with `/build-local`, and runs `npm run workflows:diagram`. Pin the actions to the SHAs in `claude-hand-back.yml`. Pass the PR number through `env:`.
7. After the merge, the tech lead runs `scripts/setup-github.sh` as admin.

## Risks

- **A branch name skips all checks.** A collaborator can name a head branch `revert-x` or `dependabot/x`, and the four checks pass. Likelihood: low, because only collaborators push branches here, and a fork PR needs approval to run. Fix: also check the PR author and `isCrossRepository`, about 15 lines. I build no fix; the tech lead decides.
- **Open PRs at setup.** After `setup-github.sh`, an open PR with an edited test and no plan row goes red. The summary line names the fix.
- **More than 3000 files.** The files API lists 3000 files at most, so check 4 counts too few lines. Likelihood: low; such a PR fails review for size.
- **Line counts of binary files.** The API gives 0 lines for a binary file, so a font counts nothing. The Chore's list does not exclude fonts, and this gives the same result.

## Proof

| Acceptance check                                                                            | Proven by                                                   |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Check 1: no `Closes #n`, two of them, a closed issue, an Intent, and a pass                 | `pr-checks.test.ts`                                         |
| Check 2: an edited test with and without its row, an added test                             | `pr-checks.test.ts`                                         |
| Check 3: a `package.json` row, a "Big:" line, neither, a version change                     | `pr-checks.test.ts`                                         |
| Check 4: 661 lines, 661 with `size: accepted`, 700 in excluded paths                        | `pr-checks.test.ts`                                         |
| The skips: the three head branches, a diff of only `plans/` files                           | `pr-checks.test.ts`                                         |
| `pr-checks` fails on this Chore's PR, and runs the checks on the first PR after the merge   | The job's log on this PR and on the next PR                 |
| `ruleset-main.json` lists `pr-checks` with 15368; `labels.sh` lists `size: accepted`        | The diff; `scripts/check-github.sh` after `setup-github.sh` |
| `plans/README.md` drops the Closes line; `plans/BUILD.md` › _Too big_ names `pr-checks.mts` | The diff                                                    |
| `npm run lint`, `typecheck`, `words` and `test` pass at 100% coverage                       | The Evidence in the PR                                      |

## Out of scope

- `.claude/skills/refine/spec.md` › _Estimate_ keeps its cap of "about 600 changed lines" for a Spec draft.
- No skip when the base commit has no script (the Chore's Constraints).

## Deviations

- `pr-checks.mts` exports `CAP`, and has the helpers `context` and `report`, to stay under `max-lines-per-function`.
- Check 1 reads the issue with `gh issue view --json state,issueType`, as `agent-gate.mts` does.
- The build wrote `pr-checks.mts` before its test, so no failing-test line exists.
- Check 1 uses `withoutComments` and `TYPES` from `issue-status.mts`: that helper also drops an unterminated comment and closes CodeQL alerts 11 and 12.
- Check 3 reads the base `package.json` at the merge base. A `compare` call finds it, because the files call is a diff from the merge base.
- Checks 2 to 4 read the files in their own call. If it fails, check 1 still runs.
