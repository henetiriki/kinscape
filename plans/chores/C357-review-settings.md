# Plan: C357: The code review reads its own settings file

- **Spec:** #357
- **Status:** approved

## Approach

Add `.github/agent/review-settings.json`, loaded from `main` like `review.md`, so a PR can't change its own reviewer (C270 D1). The `--allowedTools` and `--disallowedTools` flags come out. `Agent` stays allowed.

## Decisions

**D1 · Allow list or deny only** · Decides: Tech lead

- **A.** Both. Allow the pinned plugin's `allowed-tools`: `gh issue view/list`, `gh search`, `gh pr view/diff/list/comment`, the inline-comment tool. Deny `Write`, `Edit`, `WebFetch`, `WebSearch`, `Monitor`.
- ~~**B.** Deny only.~~

**Answer: A**

**D2 · Loading** · Decides: Tech lead

- **A.** One retry loop downloads both files and fails on any error. This drops `review.md`'s 404 fallback, dead since that file reached `main`.
- ~~**B.** Keep the fallback; add a second download.~~

**Answer: A**

## Files that change

| File                                       | New / changed | What                                       |
| ------------------------------------------ | ------------- | ------------------------------------------ |
| `.github/agent/review-settings.json`       | New           | D1                                         |
| `.github/workflows/claude-code-review.yml` | Changed       | D2; `settings:` input; flags removed       |
| `scripts/denial-audit.mts`                 | Changed       | Line 222 names `review-settings.json`      |
| `scripts/__tests__/denial-audit.test.ts`   | Changed       | Line 225 expects the new wording (rule 10) |
| `plans/chores/C357-review-settings.md`     | New           | This plan                                  |

## Order of work

1. Commit this plan first: `plan(C357): approved by @<tech-lead>`.
2. Change the test, see it fail, then change `denial-audit.mts`.
3. Add the settings file, edit the workflow, run the checks in `AGENTS.md`.
4. Open the PR `C.357: The code review reads its own settings file` with `Closes #357`.

## Proof

| Acceptance check                                       | Proven by                     |
| ------------------------------------------------------ | ----------------------------- |
| Review comments; no Write/Edit/WebFetch/WebSearch call | First PR reviewed after merge |
| No new `gh pr` denials                                 | Next weekly denial audit      |
| Lint, format, words, tests                             | Their output in the PR        |

## Risks

The action runs only the workflow as on `main`, so this PR gets no Claude review and a draft PR can't test it. The first PR after merge proves it and may need a follow-up.

**Hand back:** both paths are in CODEOWNERS, so the tech lead builds this locally.
