# Plan: C544: apply the collaborators-only interaction limit in setup-github.sh

- **Spec:** #544
- **Status:** approved

## Approach

`setup-github.sh` sets the limit under _Repository settings_ with the PUT the Chore gives. `check-github.sh` reads it with one `gh api … --jq` call that returns the limit, `expires_at` and whether `(.expires_at | fromdateiso8601) - now` is over 30 days, so no `date` flags differ between macOS and Linux. One `check` line compares `"<limit> <ok>"` with `"collaborators_only true"` and shows `expires_at` in its description, so it prints on ✅ and ❌. A missing limit (`{}` or an empty body) defaults to `none false`.

`setup-github.sh` is a code-owner path, so this PR is a hand-back: the tech lead builds it.

## Decisions

**D1 · Where the ❌ cases are proven** · Decides: Tech lead

The Chore needs ❌ for off, wrong and expiring limits.

- **A.** On a scratch repo the tech lead admins, passed as `$1`: no limit, `existing_users`, then `collaborators_only` with `expiry=one_day`.
- **B.** On this repo, briefly changing the live limit, then re-running `setup-github.sh`.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                      | New / changed | What                                              |
| ------------------------- | ------------- | ------------------------------------------------- |
| `scripts/setup-github.sh` | changed       | PUT the limit                                     |
| `scripts/check-github.sh` | changed       | Check limit and expiry                            |
| `docs/repo-settings.md`   | changed       | Row: covers comments, six-month cap, re-run setup |

## Order of work

1. `check-github.sh`, then run it here (✅ while the hand-set limit is on) and per D1 (❌).
2. `setup-github.sh`; run both scripts after merge.
3. `docs/repo-settings.md`.

## Risks

- A user-level limit makes the repo PUT fail (409); `set -e` stops the script, which shows it.

## Proof

| Acceptance check                    | Proven by                                             |
| ----------------------------------- | ----------------------------------------------------- |
| ✅ when on; ❌ off, wrong, <30 days | `check-github.sh` output here and per D1, in Evidence |
| setup then check passes             | Tech lead, after merge                                |
| Doc row; format and words           | `npm run format:check`, `npm run words`               |

## Deviations

- D1: the ❌ cases and the setup-then-check run were proven on this repo (option B), not a scratch repo; output in the PR's Evidence.
