# Plan: C436: Redraw the README workflow diagram with entry points and two columns

- **Spec:** #436
- **Status:** draft

## Approach

Rewrite the Mermaid block as `flowchart TB` with subgraphs `People`, declared first, and `Claude and CI`; boxes and routes as #436 lists, each `<b>Title</b><br>one line`. Arrow labels: `status: ready-for-po` or `ready-for-dev` into Approve the Spec, `ready-for-dev` into the tech lead's box, `ready-for-agent` into Plan agent. The sentence above becomes "Who acts at each stage and the `status:` label that hands it on."

## Decisions

**D1 · Where Preview sits** · Decides: Tech lead

- **A.** Checks and code review → Preview → Merge, labelled "visible change, status: ready-for-po", beside Review and steer.
- **B.** Review and steer → Preview → Merge.
- **Other:** your own.

Recommended: A, because Claude sets the label when the PR is ready, not after review ([building](../../docs/building.md#merging)).

**D2 · Hand-offs that set no `status:` label** · Decides: Tech lead

Plan agent → Approve the plan, and Checks → Review and steer, change no label.

- **A.** Label them with the event ("draft plan PR", "PR ready").
- **B.** Leave them unlabelled.

Recommended: A, because each hand-off then says what arrives.

**D3 · Feedback loop and "nothing pointing at" the starts** · Decides: Tech lead

- **A.** A dashed "new Intent or Bug" arrow from Feedback to Intent and Bug.
- **B.** No arrow; Feedback's line says "files a new Intent or Bug".

Recommended: A, because #436 asks for the loop; dashed keeps it apart from the flow.

## Files that change

| File                                  | New / changed | What                       |
| ------------------------------------- | ------------- | -------------------------- |
| `README.md`                           | Changed       | Diagram; sentence above it |
| `plans/chores/C436-readme-diagram.md` | New           | This plan                  |

## Risks

- Mermaid may put `People` on the right: reorder declarations until it renders left.

## Proof

| Acceptance check                     | Proven by                              |
| ------------------------------------ | -------------------------------------- |
| Starts, Spec route, columns; renders | The branch's README on GitHub          |
| No `⚙` above the diagram             | `git grep -n "⚙" README.md`, in the PR |
| lint, `format:check`, `words`        | Output in the PR                       |
