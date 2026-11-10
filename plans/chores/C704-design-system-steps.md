# Plan: C704: Put the design system steps into plans and Chores

- **Spec:** #704
- **Status:** draft

## Approach

Add one line to the plan template, two rules to `plans/README.md` and one question to `/refine chore`. Each one links to [Changing the design system](../../design/CANVAS.md#changing-the-design-system), so the steps stay in one file. The Chore edits hand-back paths, so the tech lead builds it.

## Decisions

**D1 · The `plans/README.md` word budget** · Decides: Tech lead

`plans/README.md` is at its 750-word budget. The two rules add about 70 words.

- **A.** Raise the budget to 800 in `scripts/word-count.mts` and its test.
- **B.** Shorten other rules to fit 750.
- **Other:** your own.

Recommended: A, because B changes rules that the Chore does not name.

## Files that change

| File                                            | New / changed | What                                |
| ----------------------------------------------- | ------------- | ----------------------------------- |
| `plans/chores/C704-design-system-steps.md`      | New           | This plan                           |
| `plans/TEMPLATE.md`                             | Changed       | The _Order of work_ line            |
| `plans/README.md`                               | Changed       | The two rules, each with an anchor  |
| `.claude/skills/refine/chore.md`                | Changed       | The design system question          |
| `scripts/__tests__/plan-rule-citations.test.ts` | Changed       | The two new anchors in `RULE_NAMES` |
| `scripts/word-count.mts`, its test              | Changed       | D1: A only                          |

## Order of work

1. Add the template line under _Order of work_.
2. Add the rule `design-system`: the build agent asks the tech lead in the PR for steps 3 to 5. It keeps the PR a draft until they are done.
3. Add the rule `canvas-follow-up`, with the C689 plan as its example.
4. Add both anchors to the citations test.
5. Add the question to _What to settle_ in `chore.md`.
6. Apply D1. Run all checks.

## Proof

| Acceptance check                                         | Proven by               |
| -------------------------------------------------------- | ----------------------- |
| A `CONTROLS` Chore plan lists steps 2 to 5               | The template line       |
| `plans/README.md` holds both rules                       | The citations test      |
| A design system `/refine chore` draft has the two checks | The `chore.md` question |
| `npm run words` passes                                   | Its output in the PR    |
