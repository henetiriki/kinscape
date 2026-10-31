# Plan: C439: Polish the README diagram: smaller heading, flush edges, document starts

- **Spec:** #439
- **Status:** draft

## Approach

Edit both `docs/media/workflow-light.svg` and `workflow-dark.svg` in one commit; layout, labels and colours otherwise stay.

- **Heading:** title `font-size` 26 → 22.
- **Edges:** `width="900"` and `viewBox="24 0 900 1330"` crop the 24px side margins. The right lane's 1.5px border is centred on x=924, so set its `width` to 279.25 to avoid clipping.
- **Documents:** Bug, Intent and Chore become pages with the top-right corner cut (16px) and a darker fold triangle (`.fold`: light `#ececec`, dark `#30363d`).
- **Widths:** Design and Approve the Spec (PO) become `x=96 width=216`, matching Approve the Spec (Tech lead) and keeping their right edge at 312; their text moves to x=108. Bug's arrow and the dashed arrow into Bug move from x=102 to x=84.

A preview of both files was approved in chat.

## Files that change

| File                                         | New / changed | What                                              |
| -------------------------------------------- | ------------- | ------------------------------------------------- |
| `docs/media/workflow-light.svg`              | Changed       | Title size, viewBox, lane edge, documents, widths |
| `docs/media/workflow-dark.svg`               | Changed       | Same                                              |
| `plans/chores/C439-diagram-heading-edges.md` | New           | This plan                                         |

## Risks

- The two SVGs can drift apart: change both in one commit.
- Flush edges and the dark card show only on GitHub: check both themes on the branch's README.

## Proof

| Acceptance check                       | Proven by                                            |
| -------------------------------------- | ---------------------------------------------------- |
| Heading is 22 in both                  | `git grep -n 'font-size="22"' docs/media`, in the PR |
| Three folded starts; PO boxes 216 wide | `git grep -c 'fold' docs/media`, and the README      |
| Edges line up, no clipped border       | The branch's README on GitHub, light and dark        |
| lint, `format:check`, `words`          | Output in the PR                                     |
