# Plan: C830: Leave generated design files out of the review

- **Spec:** #830
- **Status:** approved

## Approach

A root `.gitattributes` marks `design/source/*.html` and `design/*.jpg` as `linguist-generated=true`, so GitHub collapses them. A new bullet under Findings in `review.md` holds the issue's three sentences. These are the patterns that `design-agent-shots.yml` commits. The file has about 462 counted words, so the 32 new words fit its 500-word budget.

## Decisions

**D1 · A test for the two edits** · Decides: Tech lead

`docs/code-rules.md` asks for a test that fails when a new rule breaks. The issue lists two edits only. Does the build add a test?

- **A.** No test. The PR Evidence holds the `git check-attr` output.
- **B.** Add `scripts/__tests__/gitattributes.test.ts`: it runs `git check-attr` on the four done-check paths. Add a `review.md` case to `load-agent-files.test.ts`.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                                         | New / changed  | What                   |
| -------------------------------------------- | -------------- | ---------------------- |
| `.gitattributes`                             | New            | The two patterns       |
| `.github/agent/review.md`                    | Changed        | Findings: one bullet   |
| `scripts/__tests__/gitattributes.test.ts`    | New (D1 B)     | `git check-attr` cases |
| `scripts/__tests__/load-agent-files.test.ts` | Changed (D1 B) | The new sentence       |

## Risks

- `.github/agent/**` is a hand-back path: the tech lead builds ([hand-back rule](../README.md#hand-back)).
- The review reads `review.md` from `main`. The two review checks work only after the merge.

## Proof

| Acceptance check                                | Proven by                                   |
| ----------------------------------------------- | ------------------------------------------- |
| `git check-attr` prints `set` and `unspecified` | Evidence, or the D1 B test                  |
| `review.md` sentences, `npm run words`          | Review of the diff; CI                      |
| The next design PR collapses the files          | The tech lead, on that PR                   |
| A hand edit gives one finding                   | The tech lead, on a test PR after the merge |
| `lint`, `format:check`, `test`                  | CI                                          |
