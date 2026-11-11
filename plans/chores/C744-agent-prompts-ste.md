# Plan: C744: Fix STE and repeated rules in the agent prompts

- **Spec:** #744
- **Status:** draft

## Approach

Each file gets the edit that _What to change_ names, and keeps each phrase that a test asserts. `review-code.md` says "Read `docs/code-rules.md` in the checkout." once, above `## Rules`, and each section keeps its link. In `build.md`, only step 6 says "leave it a draft": a run that stops never runs `gh pr ready`. In `refresh.md`, step 3 fixes "a reference from step 2".

## Decisions

**D1 · Where the other rules of `build.md` go** · Decides: Tech lead

Lines 9 and 11 also hold rules that are not steps, for example the hand-back stop and test first.

- **A.** A bullet list before the seven steps.
- **B.** Sub-items of the step that each rule applies to.
- **Other:** your own.

Recommended: A, because each condition then comes before its steps.

**D2 · Where `refresh.md` links the stale-facts rule** · Decides: Tech lead

`refresh-settings.json` denies label changes to the unblock run.

- **A.** In _Plan run_, in place of the removed sentence.
- **B.** In step 4, for both runs. _Unblock run_ then overrides the label swap.
- **Other:** your own.

Recommended: A, because only the plan run can set a label.

## Files that change

The nine files that _What to change_ names, and this plan.

## Risks

- `.github/agent/**` is a hand-back path. The tech lead builds.
- `build.md` is near its 300-word budget. Each list number counts as a word.
- `plan-rule-citations.test.ts` fails on "rule" and a number in an agent file. Cite STE rules by name.

## Proof

| Done check                  | Proven by          |
| --------------------------- | ------------------ |
| `npm test` passes           | `npm test`         |
| `npm run words` passes      | `npm run words`    |
| One numbered list, in order | The diff           |
| The read line appears once  | The `grep -c` line |

## Out of scope

- The other audit Chores, #745 to #748.

## Deviations
