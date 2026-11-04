# Plan: C588: Review workflow reads its configuration from main

- **Chore:** #588
- **Status:** approved

## Approach

`load-agent-files` gets `main_files`: repo-root paths downloaded from `main` to `$RUNNER_TEMP/agent/main/`. The review loads `AGENTS.md`, `docs/security.md`, the marketplace and this workflow so: a step copies the rule files over the checkout's, which the restored `CLAUDE.md` imports, and `plugin_marketplaces` names the download. The action gets `github_token: ${{ github.token }}`, the job drops `id-token: write`, and Claude runs only when this file equals the loaded copy.

## Decisions

**D1 · Review identity** · Decides: Tech lead

- **A.** `github.token`, no `id-token`: the review posts as `github-actions[bot]`, which can't approve; `fix-review.md` names it. The Claude GitHub App goes unused: uninstall it, drop its doc row.
- ~~**B.** An App token minted with `pull-requests: write` and `contents: read` only.~~

**Answer: A** (@henetiriki). `review.md` asks comments only; settings allow no `gh pr review`.

**D2 · Rule files** · Decides: Tech lead

- **A.** As in Approach.
- ~~**B.** Inline the review rules in `review.md`.~~

**Answer: A** (@henetiriki)

## Files that change

| File                                          | New / changed | What               |
| --------------------------------------------- | ------------- | ------------------ |
| `.github/actions/load-agent-files/action.yml` | changed       | `main_files`       |
| `.github/workflows/claude-code-review.yml`    | changed       | Token, check, copy |
| `.github/agent/fix-review.md`                 | changed       | Reviewer login     |
| `.github/agent/review.md`                     | changed       | Checkout note      |
| `docs/repo-settings.md`                       | changed       | Apps table         |
| `scripts/__tests__/load-agent-files.test.ts`  | changed       | Tests              |

## Order of work

1. Tests first (rule 12), then the code.
2. Until the pin PR after merge lands, reviews report a missing review.
3. Tech lead: Settings › Integrations › GitHub Apps › Claude › Uninstall.
4. A throwaway PR editing `marketplace.json` and `AGENTS.md`: its log shows the copy step's `git status` and the marketplace path; close it.

## Risks

- `plugin marketplace add` outside the checkout is unproven until step 4; a failure gives no review.
- A PR editing `AGENTS.md` or `docs/security.md` is reviewed with `main`'s copy on disk; its change is in the diff only.

## Deviations

- The check reads the loader's copy of this file; the posting steps skip when it fails (review of #590).
