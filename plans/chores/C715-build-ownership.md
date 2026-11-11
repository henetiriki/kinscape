# Plan: C715: Build ownership and a local design agent

- **Spec:** #715
- **Status:** approved

## Approach

1. `build.md`: after the first command, the agent comments "Build started" on the PR.
2. `plans/README.md`: add rule 17, `build-ownership`, with the five points as a list.
3. `COMPONENTS.md`: before the board swap prompt, say where the design agent runs. In steps 2 to 4, name a local session in the Chore branch's clone, one at a time. Link to the **Who** item in `CANVAS.md`; do not repeat it.

## Decisions

**D1 · How full files make room** · Decides: Tech lead

`plans/README.md` (800) and `build.md` (300) are at their budgets. The rule adds about 70 words, the comment about 15.

- **A.** Raise the budgets to 900 and 350 in `word-count.mts`, with test cases.
- **B.** Cut text that another file holds. C712 cut most of it.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                            | What               |
| ----------------------------------------------- | ------------------ |
| `.github/agent/build.md`                        | Start comment      |
| `plans/README.md`                               | Build ownership    |
| `design/COMPONENTS.md`                          | Local design agent |
| `scripts/__tests__/plan-rule-citations.test.ts` | `RULE_NAMES`       |
| `scripts/word-count.mts`                        | D1 A: budgets      |
| `scripts/__tests__/word-count.test.ts`          | D1 A: budget cases |

## Order of work

1. Add `build-ownership` to `RULE_NAMES`. See the test fail.
2. With D1 A, change the budget cases, see them fail, then change `word-count.mts`.
3. Edit the three docs.

## Risks

`build.md` and `plans/README.md` are hand-back paths: the tech lead builds.

## Proof

| Done check                           | Proven by                    |
| ------------------------------------ | ---------------------------- |
| Start comment, rule, `npm run words` | Review, `npm run words`      |
| `COMPONENTS.md` local rule           | Review, `npm run words`      |
| "Build started" before first push    | The next approved Chore's PR |

## Out of scope

Labels, workflows, new scripts.

## Deviations

- `COMPONENTS.md` step 3 says the tech lead gives the OK on the install's file list, as the issue asks.
