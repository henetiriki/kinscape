# Plan: CH.1: CODEOWNERS and code-owner review

- **Spec:** #179
- **Requirement IDs:** none (process change)
- **Status:** draft

## Approach

Add `.github/CODEOWNERS` with one line per path in the Spec, each owned by `@henetiriki`. Patterns are unanchored as the Spec writes them, so a nested `AGENTS.md` or `CLAUDE.md` is covered too. Set `require_code_owner_review` to `true` in `scripts/github/ruleset-main.json`, add one `check` line for it to `scripts/check-github.sh` beside the other pull-request rules, and add a _Code-owner review_ row under _Required approvals_ in `docs/repo-settings.md`. GitHub reads CODEOWNERS from the base branch, so nothing takes effect until the tech lead merges and runs `./scripts/setup-github.sh`.

## Decisions

**D1 · Who opens the throwaway PR for acceptance check 3** · Decides: Tech lead
Its author must be neither the PO (who approves it) nor the tech lead (who must review it), so only the bot can.

- **A.** After applying the settings, the tech lead comments `@claude` on #179 asking for it. Claude opens a PR from `test/CH.1-code-owner` that adds one comment line to `AGENTS.md`. The PO approves; the tech lead runs `gh pr view <n> --json reviewDecision,mergeStateStatus` (expect `REVIEW_REQUIRED`, `BLOCKED`), then closes it unmerged.
- **B.** Skip the live check and rely on GitHub's docs plus `check-github.sh`.
- **Other:** your own.

Recommended: A, because the Spec relies on this PR to prove that code-owner review works on this repo's plan.

## Alternatives considered

- Checking `codeowners/errors` in `check-github.sh`: not in the Spec, and GitHub already flags errors on the file and in any PR that edits it.

## Files that change

| File                               | New / changed | What                                          |
| ---------------------------------- | ------------- | --------------------------------------------- |
| `.github/CODEOWNERS`               | New           | The seven paths, owner `@henetiriki`          |
| `scripts/github/ruleset-main.json` | Changed       | `require_code_owner_review: true`             |
| `scripts/check-github.sh`          | Changed       | `check "Code-owner review required"`          |
| `docs/repo-settings.md`            | Changed       | Row: code-owner review on the CODEOWNERS list |
| `plans/CH.1-codeowners.md`         | New           | This plan                                     |

## Order of work

1. Commit this plan: `plan(CH.1): approved by @henetiriki`.
2. Add `.github/CODEOWNERS`; push; confirm no errors with `gh api "repos/henetiriki/kinscape/codeowners/errors?ref=spec/CH.1-codeowners"`.
3. Change the ruleset, check script and doc row in one commit; `bash -n scripts/check-github.sh`.
4. Run lint, format check, tests, boundary validator, `npm run words` and `npm run e2e`.
5. PR body lists the post-merge steps for the tech lead: setup, check, then the D1 throwaway PR.

## Risks

- **Plan or bypass doesn't cover code owners:** `check-github.sh` shows ❌ or the throwaway PR merges on the PO's approval. Revert the ruleset line and return to the Intent.
- **A later typo in CODEOWNERS silently drops a path:** GitHub marks the error on the PR that makes it; the tech lead reviews that PR because the file owns itself.
- **Other files still shape agents:** `docs/security.md` (imported by `CLAUDE.md`), `plans/README.md`, `.claude/skills/` and `.github/claude-plugins/` aren't listed. Widening is carried forward in the Spec.
- **More review requests:** GitHub requests the tech lead's review on every PR touching a listed path, including Dependabot's.

## Proof

| Acceptance check                         | Proven by                                                                                           |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| CODEOWNERS shows no errors               | `codeowners/errors` on the branch returns `"errors":[]`, pasted in the PR                           |
| Code-owner check passes                  | After merge, the tech lead runs setup, then `check-github.sh` shows ✅ _Code-owner review required_ |
| PO-only approval on `AGENTS.md` blocked  | The throwaway PR (D1)                                                                               |
| PR outside the list merges as today      | The next Spec PR after setup merges on the PO's approval alone                                      |
| Tech lead's PR on a listed path bypasses | The tech lead's next PR touching a listed path merges by admin bypass                               |

## Out of scope

The chore form and label (CH.2), the agent (CH.3), widening the list to all of `.github/`.
