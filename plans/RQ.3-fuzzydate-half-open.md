# Plan: RQ.3: FuzzyDate paragraph is half-open

- **Spec:** #631
- **Requirement IDs:** [PIN-04](../docs/requirements.md#pin-04), [BND-01](../docs/requirements.md#bnd-01)
- **Status:** draft

## Approach

A docs-only edit to the FuzzyDate paragraph in `docs/requirements.md` (line 180). Replace its second sentence with the Spec's wording, word for word; leave the first sentence as it is. The code already matches: `lib/domain/dates/fuzzy-date.mts` derives `validFrom = earliestDay` and `validTo = latestDay + 1` (#623), and `docs/architecture.md` already names the half-open `Validity`.

## Files that change

| File                   | New / changed | What                                       |
| ---------------------- | ------------- | ------------------------------------------ |
| `docs/requirements.md` | changed       | Second sentence of the FuzzyDate paragraph |

## Order of work

1. Replace the sentence.
2. Run `npm run format`, then lint, `format:check`, `words`, tests, `validate:boundaries` and `e2e`.

## Risks

- Prettier may escape the quotes or rewrap the line. Check with `git diff --word-diff` that the rendered text is the Spec's sentence.

## Proof

| Acceptance check                        | Proven by                                                          |
| --------------------------------------- | ------------------------------------------------------------------ |
| Second sentence reads as the Spec gives | `git diff --word-diff` against the Spec's sentence                 |
| First sentence unchanged                | `git diff --word-diff` shows no change before "All date filtering" |
| No "earliest–latest pair" in `docs`     | `git grep -n "earliest–latest pair" docs` returns nothing          |
| Every CI check passes                   | CI on the PR                                                       |

## Out of scope

The Intent's Pin check and Pin storage (M2.12, #537). The M2 milestone line ("inside its earliest to latest dates"), which already agrees. Any code.
