# Plan: C588: Review workflow reads its configuration from main

- **Chore:** #588
- **Status:** approved

## Approach

`load-agent-files` gets `main_files`: repo-root paths downloaded from `main` to `$RUNNER_TEMP/agent/main/` (default empty). The review loads `AGENTS.md`, `docs/security.md` and the marketplace so: a step copies the rule files over the checkout's, which the restored `CLAUDE.md` imports, and `plugin_marketplaces` names the download. The action gets `github_token: ${{ github.token }}` and the job drops `id-token: write`; a step runs the action only when this file equals `main`'s, as the token exchange checked.

## Decisions

**D1 · Review identity** · Decides: Tech lead

- **A.** `github.token`, no `id-token`: the review posts as `github-actions[bot]`, which can't approve. `fix-review.md` names that Bot. The Claude GitHub App is then unused: the tech lead uninstalls it, its doc row goes.
- ~~**B.** An App token minted with `pull-requests: write` and `contents: read` only.~~

**Answer: A** (@henetiriki). `review.md` asks comments only; settings allow no `gh pr review`.

**D2 · Rule files** · Decides: Tech lead

- **A.** As in Approach.
- ~~**B.** Inline the review rules in `review.md`; CI stops importing them from `CLAUDE.md`.~~

**Answer: A** (@henetiriki)

## Files that change

| File                                          | New / changed | What               |
| --------------------------------------------- | ------------- | ------------------ |
| `.github/actions/load-agent-files/action.yml` | changed       | `main_files`       |
| `.github/workflows/claude-code-review.yml`    | changed       | Token, check, copy |
| `.github/agent/fix-review.md`                 | changed       | Reviewer login     |
| `docs/repo-settings.md`                       | changed       | Apps table         |
| `scripts/__tests__/load-agent-files.test.ts`  | changed       | Tests              |

## Order of work

1. Tests first (rule 12), then action, workflow, docs.
2. Until the pin PR after merge lands, the load step fails and the job reports a missing review.
3. Tech lead: Settings › Integrations › GitHub Apps › Claude › Uninstall.
4. A throwaway PR editing `marketplace.json` and `AGENTS.md`; its log shows the copy step's `git status` and the marketplace path under `agent/main`; close it.

## Risks

- `plugin marketplace add` on a folder outside the checkout is unproven until step 4; a failure gives no review.

## Proof

| Acceptance check                                   | Proven by     |
| -------------------------------------------------- | ------------- |
| Files from `main`; check kept; workflow token only | Tests; step 4 |
