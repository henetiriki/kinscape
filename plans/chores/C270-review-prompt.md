# Plan: C270: Give the cloud Code Review the plan and the rules

- **Spec:** #270
- **Status:** approved

## Approach

The review runs the stock command with no project context, and says "No issues" on most PRs. A new `.github/agent/review.md` joins the run as `--append-system-prompt-file`. It tells the reviewer to:

- check the diff against the PR's plan, citing requirement IDs;
- check `docs/security.md` and the AGENTS.md data rules, including workflow pinning, permissions and API error handling;
- label probable issues PLAUSIBLE, post at most five, and list what it checked before saying "No issues".

`claude-code-review.yml` downloads the file from `main`. The pinned command has no `--max-findings`, so `review.md` states the cap and overrides the command's "certain only" filters and its stop after one review.

## Decisions

**D1 · Where the file loads from** · Decides: Tech lead

- **A.** `main`: a PR can't change its own reviewer.
- **B.** The checkout.

**Answer: A** (@henetiriki)

**D2 · Findings posted** · Decides: Tech lead

- **A.** Confirmed and PLAUSIBLE, at most five.
- **B.** Confirmed only.

**Answer: A** (@henetiriki)

**D3 · The command's filters and one-review stop** · Decides: Tech lead

- **A.** `review.md` overrides both; if that fails, our own prompt.
- **B.** Our own prompt now.

**Answer: A** (@henetiriki)

## Files that change

| File                                       | New / changed | What              |
| ------------------------------------------ | ------------- | ----------------- |
| `.github/agent/review.md`                  | New           | Rules, ≤300 words |
| `.github/workflows/claude-code-review.yml` | Changed       | Load the file     |

## Order of work

1. Write both files.
2. Run the checks; open the PR.

## Proof

| Acceptance check                    | Proven by                  |
| ----------------------------------- | -------------------------- |
| Baseline: 12 of 20 "No issues"      | The PR body                |
| Plan gap and unpinned action found  | A synthetic PR after merge |
| Pushed again: reviewed, cap of five | The same PR                |
| Lint, format, words                 | Their output               |

**Hand back:** both files are in `.github/CODEOWNERS`, so the tech lead builds this locally.

## Deviations

- The load step falls back to a one-line file on a 404, so this PR's own review runs; other failures fail the job.
