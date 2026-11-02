# Plan: C515: The fix agent never changes a PR's draft state

- **Spec:** #515
- **Status:** approved

## Approach

Add one bullet to `.github/agent/fix-review.md` › **The fix**, after "A finding you judge wrong…":

> - Never change the PR's draft state, labels or reviewers. A finding whose remedy is not a code or plan change gets a thread reply saying it is for a person.

The test case `tells Claude to leave test changes and comment text alone, in fix-review.md` gains `expect(text).toContain('draft state, labels or reviewers');`. The assertion is added first and seen to fail (rule 12). `.github/agent/**` is a code-owner path, so the tech lead builds it (rule 13).

## Decisions

**D1 · A non-code finding in the gap-list comment** · Decides: Tech lead

That finding is a PR comment, not a thread, so "a reply on its thread" can't apply.

- **A.** Leave the rule as the Chore words it: the closing PR comment already lists what wasn't fixed, with the reason.
- **B.** Add "(in the gap-list comment's case, in your closing comment)" to the rule.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                         | New / changed | What                   |
| -------------------------------------------- | ------------- | ---------------------- |
| `.github/agent/fix-review.md`                | Changed       | The new rule           |
| `scripts/__tests__/load-agent-files.test.ts` | Changed       | Assert the rule phrase |

## Order of work

1. Add the assertion; run `npm test -- scripts/__tests__/load-agent-files.test.ts` and see it fail.
2. Add the rule; see the test pass.

## Risks

- Runs fetch `fix-review.md` from `main`, so the rule applies only after merge.

## Proof

| Acceptance check                        | Proven by                                            |
| --------------------------------------- | ---------------------------------------------------- |
| `fix-review.md` on `main` has the rule  | The diff                                             |
| Test passes, and fails without the rule | Step 1's failing line and step 2's pass, in Evidence |

## Out of scope

- `.github/agent/settings.json` and `review.md` (the Chore's Constraints).

## Deviations

- The rule is shortened to fit `fix-review.md`'s 300-word budget: "a thread reply", and "and no action" dropped (the first sentence already forbids the action).
