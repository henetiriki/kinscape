# Plan: C696: Document the design system workflow and update the canvas install with the Artifact tool

- **Spec:** #696
- **Status:** draft

## Approach

Make the Chore's four edits to `design/CANVAS.md`. Put the prompt in a fenced block at the end of "Updating the install". Keep the four headings.

## Decisions

**D1 · Word budget** · Decides: Tech lead

`design/CANVAS.md` has 471 words, and its budget is 550. The edits add about 400 words.

- **A.** Set the budget to 900 in `scripts/word-count.mts` and its test.
- **B.** Keep 550 and cut the edits.
- **Other:** your own.

Recommended: A, because the prompt alone needs about 120 words.

**D2 · Handing off a board** · Decides: Tech lead

That section names `read_file`, but an acceptance check allows it only as the fallback.

- **A.** Write `read` with `paths`, with `read_file` as the fallback.
- **B.** Leave it, and drop `read_file` from that check.
- **Other:** your own.

Recommended: A, because it is one sentence.

**D3 · Canvas checks** · Decides: Tech lead

The build agent has no `Artifact` tool, so it cannot run the prompt.

- **A.** The tech lead runs it on this branch before the merge, and comments the result.
- **B.** A later Chore runs it.
- **Other:** your own.

Recommended: A, because the new section says so.

## Files that change

| File                                                             | New / changed | What               |
| ---------------------------------------------------------------- | ------------- | ------------------ |
| `design/CANVAS.md`                                               | Changed       | The Chore's edits  |
| `scripts/word-count.mts`, `scripts/__tests__/word-count.test.ts` | Changed       | Budget, if D1 is A |

## Risks

The canvas instructions can forbid a write under `project/ds/`. The build agent cannot read them, so the D3 run checks them first.

## Proof

| Acceptance check                                         | Proven by                       |
| -------------------------------------------------------- | ------------------------------- |
| Section, six parts, anchor; old headings kept            | `git diff`; `doc-links.test.ts` |
| Fallback names only                                      | `git grep` in the PR            |
| Canvas matches; entry set; no board changed; no-diff run | The D3 run                      |
| `npm run words` passes                                   | Output in the PR                |
