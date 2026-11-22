# Plan: C1136: Run @claude replies on issues with Opus on high effort

- **Spec:** #1136
- **Status:** approved

## Approach

`model_args` in `claude-respond.yml` gets one more condition. Opus on high effort runs if the title contains "(plan)", or if `github.event.issue` is set and `github.event.issue.pull_request` is not. Every other thread keeps Sonnet. The condition reads no issue Type, so an Intent thread also gets Opus. This is the new value:

```yaml
model_args: >-
  ${{ (contains(github.event.issue.title || github.event.pull_request.title, '(plan)') || github.event.issue && !github.event.issue.pull_request) && '--model opus --effort high' || '--model sonnet' }}
```

The comment above `model_args` gives the reason: a respond run on an issue edits the body and runs the Spec checks, and the plan run reads that body on Opus.

A new test in `load-agent-files.test.ts` evaluates `model_args` against one event payload for each trigger of the workflow. `review-condition.test.ts` already has an `evaluate` helper for this. D1 decides where the test gets its evaluator.

`claude-respond.yml` is a [hand-back path](../README.md#hand-back). CI builds the test rows. The tech lead builds the workflow row in a local session.

## Decisions

**D1 · Where the expression evaluator lives** · Decides: Tech lead

The new test must evaluate a GitHub expression. `evaluate` in `scripts/__tests__/review-condition.test.ts` does that, but it builds its own `github` context from a `Pr`. `docs/code-rules.md` says "no copied helper".

- **A.** Move the expression part of `evaluate` to a new helper, `scripts/__tests__/expression.ts`. The helper takes the expression text and a `github` context. `review-condition.test.ts` builds its context and calls the helper. The new test does the same. Cost: one new helper file and about 20 changed lines in `review-condition.test.ts`.
- **B.** The new test matches the text of `model_args` with a regular expression. Cost: no new file, but the test cannot prove which model a thread gets.
- **C.** The new test has its own copy of `evaluate`. Cost: one copied helper, which the reviewer flags.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                         | New / changed | What                                                                                                                                                    |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/claude-respond.yml`       | changed       | Hand-back row. `model_args` as in the Approach. The comment above it gives the reason. No other input changes.                                          |
| `scripts/__tests__/load-agent-files.test.ts` | changed       | A new `describe` block for `model_args` of `claude-respond.yml` (Proof). Lines 695 to 698: reword the comment and the test name. Keep `--model sonnet`. |
| `scripts/__tests__/expression.ts`            | new           | D1 A only. `evaluate(source, github)`: strips `${{ }}` and runs the expression with `vars`, `fromJSON`, `contains` and `format`.                        |
| `scripts/__tests__/review-condition.test.ts` | changed       | D1 A only. Calls the helper with its own `github` context. Each case keeps its result.                                                                  |

## Order of work

1. D1 A: move the evaluator to `expression.ts`. Run `review-condition.test.ts`, and see each case pass.
2. Write the new `model_args` test. See the issue-thread cases fail on `--model sonnet`.
3. Reword the comment and the test name at lines 695 to 698.
4. CI pushes these rows and keeps the PR a draft. `npm test` fails on the issue-thread cases until step 5.
5. The tech lead edits `model_args` and its comment in `claude-respond.yml` in a local session. The new test then passes.
6. Run the checks in [Verifying your work](../../AGENTS.md#verifying-your-work), with `npm run words` last.

## Risks

- GitHub `contains` on a string ignores case. JavaScript `includes` does not. The test uses the lower-case "(plan)", so the results agree.
- A respond run on an issue costs more on Opus. The issue asks for this.
- The helper runs the expression with `new Function`. The expression is from the repo, not from a user or a third party ([security rules](../../docs/security.md)).

## Proof

| Acceptance check                                                                                                                       | Proven by                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| An `@claude` comment on a Spec, Bug, Chore or Intent runs Opus on high effort                                                          | New test: `issues` event and `issue_comment` on an issue with no `pull_request` give Opus              |
| An `@claude` comment or review on a PR that is not a plan PR runs Sonnet                                                               | New test: `issue_comment` on a PR, `pull_request_review` and `pull_request_review_comment` give Sonnet |
| A plan PR keeps Opus on high effort                                                                                                    | New test: `issue_comment` and `pull_request_review` on a "(plan)" title give Opus                      |
| The run log shows the model                                                                                                            | After the merge: the run log of the next `@claude` comment on an issue and on a PR                     |
| The unblock refresh stays on Sonnet; the comment at lines 695 to 698 no longer says that an `@claude` comment on a Spec runs on Sonnet | The test at line 696 still checks `--model sonnet`; review of the new comment                          |
| No other input of `claude-respond.yml` changes                                                                                         | `git diff origin/main -- .github/workflows/claude-respond.yml` shows only `model_args` and its comment |
| `lint`, `typecheck`, `format:check`, `words` and `test` (100% coverage) pass                                                           | The checks in [Verifying your work](../../AGENTS.md#verifying-your-work)                               |

## Out of scope

- The models of `claude-build.yml`, `claude-fix-review.yml`, `claude-resolve-conflict.yml`, `claude-plan.yml` and `claude-unblock.yml`.

## Deviations
