# Plan: C439: Shrink the README diagram heading and remove its side margins

- **Spec:** #439
- **Status:** draft

## Approach

In both `docs/media/workflow-light.svg` and `workflow-dark.svg`, change the title's `font-size` from 26 to 22. Then crop the 24px side margins with `width="900"` and `viewBox="24 0 900 1330"`. The title and the panels sit at x=24 and the right lane ends at x=924, so they land on the edges. The right lane's 1.5px border is centred on x=924, so move its right edge in by 0.75px (`width="279.25"`) to avoid clipping it. Layout, labels and colours stay as they are. Both files change in one commit.

## Files that change

| File                                         | New / changed | What                           |
| -------------------------------------------- | ------------- | ------------------------------ |
| `docs/media/workflow-light.svg`              | Changed       | Title size, viewBox, lane edge |
| `docs/media/workflow-dark.svg`               | Changed       | Same                           |
| `plans/chores/C439-diagram-heading-edges.md` | New           | This plan                      |

## Risks

- The two SVGs can drift apart: change both in one commit.
- Flush edges and the dark card show only on GitHub: check both themes on the branch's README.

## Proof

| Acceptance check                 | Proven by                                            |
| -------------------------------- | ---------------------------------------------------- |
| Heading is 22 in both            | `git grep -n 'font-size="22"' docs/media`, in the PR |
| Edges line up, no clipped border | The branch's README on GitHub, light and dark        |
| lint, `format:check`, `words`    | Output in the PR                                     |
