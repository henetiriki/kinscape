# Plan: B844: The relationship boards show the subtitle years without the dates line

- **Spec:** #844 (Bug; boards of M2.11.1, #818; line of M2.11.2, #536)
- **Requirement IDs:** [PPL-02](../../docs/requirements.md#ppl-02), [NFR-06](../../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

The design agent redraws one board, `design/canvas/project/Person-relationships.dc.html`, on the canvas (D2). The board script gets the Person of the page as data: `du Toit, Maria Magdalena`, born `c. 1856`, died `1930`. A new `words(p)` gives the line in words from `reading`, with the rules of `dateWords` in `app/components/actions/dates.ts`. For example, it gives "Born before 1840, died unknown". The subtitle and the Person card of the dialog both take `lineOf(p)` and `words(p)`. Each one shows the line in `KinScape.Text` `mono` inside a `<span aria-hidden="true">`. Before the line, a visually hidden `<span>` holds the words. The hidden span uses the inline style of the caption in `Fuzzy-date-readings.dc.html`. The fixed `who` string goes.

## Decisions

**D2 · Who builds the board** · Decides: Tech lead

AGENTS.md lets only the design agent, or an agent that runs the refresh steps, edit `design/canvas/`. The CI build agent cannot sign in to the canvas.

- **A.** The tech lead gives the design agent the prompt in step 2 of Order of work. Then the tech lead, or a local Claude Code session that they start, runs steps 3 to 6. The CI build agent builds nothing.
- **B.** The CI build agent edits the board in the repo and runs the workflow. Then the tech lead copies the board to the canvas. The repo copy then leads the canvas, against the AGENTS.md rule.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- Add `DateText` to `CONTROLS` and draw `KinScape.DateText`. The Bug's "Must not break" forbids a change to `CONTROLS`.

## Files that change

| File                                                 | New / changed | What                                             |
| ---------------------------------------------------- | ------------- | ------------------------------------------------ |
| `plans/bugs/B844-relationships-subtitle-dates.md`    | New           | This plan                                        |
| `design/canvas/project/Person-relationships.dc.html` | Changed       | Subtitle and Person card take the line and words |
| `design/canvas/VERSION`                              | Changed       | The canvas version of the refresh                |
| `design/source/` and `design/*.jpg`, the 11 boards   | Changed       | Workflow output                                  |

## Order of work

1. Commit this plan: `plan(B844): approved by @<tech lead>`.
2. The design agent gets this prompt: "On `Person-relationships.dc.html`, do the Approach of `plans/bugs/B844-relationships-subtitle-dates.md`. Change no other board."
3. Run "Refreshing the canvas copy" (5.1 to 5.5). Commit `design/canvas/` alone. Discard the exported `source/` changes.
4. Push the branch, then run the workflow Design: Render snapshots on it.
5. Compare `git diff --name-only origin/main` with the 11 boards.
6. Run `npm test`, `npm run design:check`, `npm run words`, lint, typecheck and format check.

## Risks

- `KinScape.Text` may not pass `aria-hidden` from an `x-import`. The outer `<span aria-hidden="true">` covers this.
- A board other than the 11 can change in the render. Step 5 finds it.

## Proof

| Acceptance check                                         | Proven by                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| The subtitle text and Mono line; no `1856–1930`          | `git grep` of the 11 snapshots                                            |
| The subtitle and the 5 cards hide the line, add words    | `git grep` of the snapshots, for example "Born before 1840, died unknown" |
| One `lineOf` and the readings; no fixed string           | The board diff                                                            |
| The 11 JPGs match their snapshots                        | The workflow run on the branch                                            |
| No other board, snapshot or JPG; `relationship-messages` | `git diff --name-only origin/main`                                        |
| `npm test`, `design:check` and `words`                   | Their output in the PR                                                    |
| #536: the rows and the dialog line                       | The board diff keeps them                                                 |
| `NOT_BUILT` and the 93 snapshots                         | `screens.test.ts` and `design.test.ts`                                    |
| No design system step                                    | The diff has no `CONTROLS`, `tokens.json` or `DESIGN.md`                  |

## Deviations

- D2 A gave the board edit to the design agent. The tech lead asked a local Claude Code session to make it, as part of the design agent experiment. The session published the board to the canvas and read no other board.
- The subtitle puts the line and the full stop in a `display: inline-flex` span. The exporter formats with `htmlWhitespaceSensitivity: ignore`, so a plain span puts a space before the full stop.
- The Person card wraps the line in a `display: contents` span, so the card layout does not change.
- `VERSION` line 2 is the canvas version `1794726266-9ced`. The canvas also holds the People loading boards of B841 (#843), which this branch does not carry.
