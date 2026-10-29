# Plan: C368: Read the required checks from the ruleset file

- **Spec:** #368
- **Status:** draft

## Approach

`check-github.sh` sets `DIR` as `setup-github.sh` does and builds the expected "Required checks" value from `$DIR/github/ruleset-main.json`: its contexts, sorted and comma-joined like the live value. The docs point to the JSON.

## Decisions

**D1 · How the script reads the JSON** · Decides: Tech lead

The script needs only `gh` today, and `gh --jq` can't read a local file.

- **A.** `node -e` with `JSON.parse`. Node 24 is already required for the repo.
- **B.** The `jq` binary, reusing the live query's filter. The tech lead must install `jq`.
- **Other:** your own.

Recommended: A, because it adds no tool.

## Files that change

| File                      | What                                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/check-github.sh` | Line 44's expected string → the list read from the JSON                                                                                                     |
| `docs/repo-settings.md`   | _Required status checks_ row: "The contexts in `ruleset-main.json`"; Why keeps "Nothing merges with a red check"                                            |
| `docs/building.md`        | _Merging_: squash, approval, dismissal, conversations, checks and CODEOWNERS sentences → one link to `repo-settings.md#whats-set-and-why`; who merges stays |

## Order of work

1. Edit the script; `bash -n scripts/check-github.sh`.
2. Run `bash scripts/check-github.sh` and paste the _Required checks_ line.
3. Edit the two docs.
4. Run `npm run words`, `npm run format:check`, `npm test`.

## Risks

- Step 2 may be denied in CI; I name the denial in the PR.
- A missing or malformed JSON gives an empty expected value: ❌, not a pass.

## Proof

| Acceptance check                   | Proven by                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| A new context changes the expected | The diff: line 44 has no context names; the value comes only from the JSON              |
| _Required checks_ OK               | Step 2's output in the PR, else the tech lead's `./scripts/check-github.sh` after merge |
| words, format:check and npm test   | Their output                                                                            |

## Out of scope

`ruleset-main.json`, `setup-github.sh` (CODEOWNERS); other hard-coded values.
