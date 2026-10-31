# Plan: C436: Redraw the README workflow diagram with entry points and three lanes

- **Spec:** #436
- **Status:** draft

## Approach

Replace the Mermaid block with a `<picture>` of `docs/media/workflow-dark.svg` (dark theme) and `workflow-light.svg` (default), with alt text describing the flow. Write both SVGs by hand: lanes PO | Tech lead | Claude and CI, a grey People panel, a blue Merge box, elbow arrows labelled with the `status:` label or event. The dark file keeps the layout with dark fills and light text. The sentence above becomes "Who acts at each stage and the `status:` label that hands it on."

## Decisions

**D1 · Preview** · Decides: Tech lead. **Answer: A** (@henetiriki): Checks → Preview → Merge.

**D2 · Hand-offs with no `status:` label** · **Answer: A**: label them with the event.

**D3 · Feedback loop** · **Answer: A**: a dashed arrow to the starts.

**D4 · Light and dark** · **Answer: B** (@henetiriki): two SVGs in a `<picture>`, not one white SVG.

**D5 · Approve the Spec** · Decides: Tech lead. **Answer: A** (@henetiriki): two boxes, one per lane (PO: user-visible; tech lead: engineering-only).

## Alternatives considered

Mermaid can't place boxes in lanes.

## Files that change

| File                                  | New / changed | What                        |
| ------------------------------------- | ------------- | --------------------------- |
| `docs/media/workflow-light.svg`       | New           | Light diagram               |
| `docs/media/workflow-dark.svg`        | New           | Dark diagram                |
| `README.md`                           | Changed       | `<picture>`; sentence above |
| `plans/chores/C436-readme-diagram.md` | New           | This plan                   |

## Risks

- The SVGs can drift apart: change both in one commit.
- Dark-theme switching shows only on GitHub: check both themes on the branch's README.

## Proof

| Acceptance check                   | Proven by                              |
| ---------------------------------- | -------------------------------------- |
| Starts, Spec route, lanes; renders | The branch's README, light and dark    |
| Alt text                           | The `<picture>` in `README.md`         |
| No `⚙` above the diagram           | `git grep -n "⚙" README.md`, in the PR |
| lint, `format:check`, `words`      | Output in the PR                       |
