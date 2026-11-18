# Plan: C1023: Keep the denial audit's issue body under GitHub's size limit

- **Spec:** #1023
- **Status:** draft

## Approach

In `scripts/denial-audit.mts`:

1. `summarise` sorts each group's `runs` by its denials per run, then by run id (a higher id is newer).
2. A new `rowOf(group, capped)` writes a row. A capped row keeps 5 links and 200 characters of the example.
3. `issueBody(report, repo, since, runPage?)` uses capped rows and drops rows from the bottom over 60,000 characters. A new `pageBody` writes the full table.
4. `run` makes the run-page URL only from a `GITHUB_RUN_ID` of digits.
5. `run` writes `pageBody` before `issue list`. A `try` holds the issue calls. On a throw, `run` writes the error line and returns 1.

This chore is a hand-back. The tech lead builds it.

## Decisions

**D1 · Where the issue body links to the run page** · Decides: Tech lead

The drop line shows only after a drop. Where does the link go?

- **A.** One line under the table, every time: the drop line, else "The [run page](url) shows every run and the full examples." Two line texts.
- **B.** The first line ends with "Full table: [run page](url)." One line text.
- **Other:** your own.

Recommended: A, because the reader finds the link where the table cuts.

## Files that change

| File                                     | New / changed | What                                      |
| ---------------------------------------- | ------------- | ----------------------------------------- |
| `scripts/denial-audit.mts`               | Changed       | Approach steps 1 to 5; the header comment |
| `scripts/__tests__/denial-audit.test.ts` | Changed       | New tests for checks 1 to 6; tests below  |

These tests change with the behaviour:

- "counts each run once per group…": the `Bash: x` tie expects `runs: [2, 1]`.
- The three run-page tests read the issue line from the second `summary` call.

## Order of work

1. Write the tests for checks 1 to 6. See each fail.
2. Do Approach steps 1 to 5.
3. After the merge, the tech lead runs the workflow on `main` and links the run.

## Risks

- GitHub drops a run page over 1 MiB, about 16 times the issue limit. A cap is about 15 lines; the plan does not build it.
- The guard counts UTF-16 units, so it can drop one row too many, never too few.
- The `execFileSync` error holds the `gh` arguments and error output, not the body or `GH_TOKEN`.

## Proof

| Acceptance check                  | Proven by                                      |
| --------------------------------- | ---------------------------------------------- |
| 1. Body 60,000 characters or less | New `issueBody` test                           |
| 2. 5 links in order, "+3 more"    | New test: `summarise`, then `issueBody`        |
| 3. 200 characters and "…"         | New `issueBody` test                           |
| 4. Guard drops the lowest rows    | New `issueBody` test                           |
| 5. Run-page link, or "left out"   | New `run` tests, with and without the variable |
| 6. Failed call: page, error, 1    | New `run` test; `gh` throws on `issue create`  |
| 7. Manual run on `main`           | The run from Order of work step 3              |
