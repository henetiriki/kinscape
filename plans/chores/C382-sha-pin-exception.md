# Plan: C382: Narrow the SHA-pin exception and keep the workflow security rules in review.md

- **Spec:** #382
- **Status:** approved

## Approach

`review.md` becomes the one home of the workflow security rules: the review loads it from `main`, so a PR can't weaken it. Its SHA-pin bullet names the two paths that may use `@main`; `docs/security.md` links there. The stub `gh` rejects any call that isn't `repos/owner/repo/contents/.github/agent/<file>?ref=main`, so a wrong ref or repo fails the script tests. A new test pins `action.yml` to one `run:` step.

## Decisions

**D1 · Which of this repo's actions and workflows may skip SHA pinning** · Decides: Tech lead

- **A.** Only `.github/actions/**` and `.github/workflows/claude*.yml`, used as `henetiriki/kinscape/<path>@main`.
- ~~**B.** Any path in `.github/CODEOWNERS` (today's wording).~~
- ~~**C.** None: pin own actions to a SHA too.~~

**Answer: A** (@henetiriki, #382)

## Files that change

| File                                         | What                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `.github/agent/review.md`                    | _In workflows_: the SHA-pin bullet states D1; the lead-in says these rules live only here, loaded from `main` |
| `docs/security.md`                           | Workflow bullet → "Workflows follow _In workflows_ in [review.md](../.github/agent/review.md#the-rules)"      |
| `.github/agent/rules.md`                     | Delete line 1's comment                                                                                       |
| `scripts/__tests__/load-agent-files.test.ts` | Stub rejects a wrong call; new one-`run:` test                                                                |

## Order of work

1. Change the stub; with `?ref=main` → `?ref=$GITHUB_REF` in `action.yml`, see the tests fail, then revert.
2. Add the one-step test; see it fail with a second step added, then revert.
3. Edit the three docs.
4. Run lint, tests, words, format:check, the boundary validator and e2e.

## Risks

An agent editing a workflow sees only the link; it names the section.

## Proof

| Acceptance check                                        | Proven by                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| No CODEOWNERS-based exception; two paths named          | `git grep -n CODEOWNERS docs/security.md .github/agent/review.md` output |
| Workflow bullets only in `review.md`                    | The diff                                                                 |
| Wrong ref and second step fail                          | Steps 1–2's failing lines in Evidence                                    |
| `rules.md` starts `# CI agent rules`; words and CI pass | Step 4 output, CI                                                        |

## Out of scope

`claude-code-review.yml`, `action.yml`, other review rules.
