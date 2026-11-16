# Plan: DL.21.1: One rule for who deletes a generated design file

- **Spec:** #928
- **Requirement IDs:** None. The Spec changes agent instructions and docs only.
- **Status:** approved

## Approach

`design/CANVAS.md` › "Making the snapshots and JPGs" gets a sub-heading, "Who deletes a generated file" (anchor `#who-deletes-a-generated-file`). It holds the rule of Behaviour 1: who deletes, when, and a list of the four other records. The sentence "Nobody edits them by hand" gets a link to it. `AGENTS.md`, `design/COMPONENTS.md` step 4 and `.github/agent/review.md` link to that anchor and do not repeat the rule.

The new review rule replaces the last sentence of the generated-files bullet:

> Report no finding for a commit that only deletes them, if the board of each deleted snapshot and JPG is not in `design/canvas/project/canvas.json`, and the card of each deleted card image is not in `CARDS`, on the PR head. If another non-merge commit whose message is not `chore: export and render design snapshots` changes them, report one finding.

The review finds the card of `design/cards/<name>-<width>.png` by `name` (`lib/design/cards.mts`).

This is a [hand-back](README.md#hand-back): `AGENTS.md` and `.github/agent/**` are code owner paths. The tech lead builds it. No [design system input](../design/CANVAS.md#changing-the-design-system) changes.

## Decisions

**D3 · Room for the rule in `design/CANVAS.md`** · Decides: Tech lead

`CANVAS.md` has a budget of 1000 words, and `wc -w` gives 992 today. The rule and its link add about 110 words. The Spec says: cut words in the same file, and raise no budget without the tech lead. No related issue holds a value.

Which words make room?

- **A.** Cut the two "Fallback, without the `Artifact` tool" paragraphs (about 70 words), and tighten other lines of `CANVAS.md`. A session with no `Artifact` tool then has no written fallback.
- **B.** Raise the `CANVAS.md` budget in `scripts/word-count.mts` to 1100. The plan then lists that file.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                         | New / changed | What                                                                                            |
| -------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| `design/CANVAS.md`                           | Changed       | The sub-heading and the rule; a link after "Nobody edits them by hand"; the D3 cut, if D3 is A  |
| `AGENTS.md`                                  | Changed       | After "Never edit those three.": "A deletion follows [the deletion rule](…)."                   |
| `.github/agent/review.md`                    | Changed       | The new rule sentences (Approach)                                                               |
| `design/COMPONENTS.md`                       | Changed       | Step 4: swap, delete the draft board, then link to the rule; no "who" and no list of records    |
| `scripts/__tests__/load-agent-files.test.ts` | Changed       | "the generated design files in review.md" expects the two new sentences in place of the old one |
| `scripts/word-count.mts`                     | Changed       | If D3 is B: the `CANVAS.md` limit is 1100                                                       |
| `plans/DL.21.1-deletion-rule.md`             | New           | This plan                                                                                       |

The test changes because Behaviour 4 changes the rule that it checks ([failing-tests rule](README.md#failing-tests)).

## Order of work

1. Change the expected sentences in `load-agent-files.test.ts`. Run `npm test -- --coverage.enabled=false scripts/__tests__/load-agent-files.test.ts`. See `toContain` fail on the new sentence, and paste that line in Evidence.
2. Edit `review.md`. Run the test again and see it pass.
3. Edit `CANVAS.md`, as D3 says.
4. Edit `AGENTS.md` and `COMPONENTS.md`.
5. Run `git grep -n -e "Lower the two counts" -e "deletes its snapshot" -- design AGENTS.md` (checks 2 and 6). Expect no output.
6. Run the checks in `AGENTS.md` › Commands. Paste the output in Evidence.

## Risks

- **`AGENTS.md` and `review.md` are close to their budgets** (700 and 550). The link adds about 8 words, and the review rule about 40. If `npm run words` fails on either file, stop and ask the tech lead which words to cut (Spec).
- **The review misjudges "the board is gone".** No script checks it (Spec). If it gets it wrong twice, the tech lead files a Chore for a script.
- **Unlikely case:** a card leaves `PHONE_CARDS` but stays in `CARDS`, and a commit deletes its `-390` image. The review reports one finding. Likelihood: low; no Spec on #893 removes a phone width. Fix cost: one more clause in the rule. This plan builds nothing for it.
- **A Screens row is in `design/DESIGN.md`, a design system input.** `README_SECTIONS` in `lib/design/system.mts` does not hold "Screens", so a deleted row changes no design system file.

## Proof

| Acceptance check                                  | Proven by                                                    |
| ------------------------------------------------- | ------------------------------------------------------------ |
| 1. `CANVAS.md` says who, when and which records   | `CANVAS.md` in the diff                                      |
| 2. `AGENTS.md` links; the rule is in one file     | `AGENTS.md` in the diff; `git grep` of step 5                |
| 3. `review.md` allows the deletion, no message    | `review.md` in the diff; `load-agent-files.test.ts`          |
| 4. A deletion gets no finding                     | The tech lead, on the first such PR after the merge, on #893 |
| 5. A changed JPG of a live board gets one finding | The tech lead, in the same way                               |
| 6. `COMPONENTS.md` step 4 links, no second copy   | `COMPONENTS.md` in the diff; `git grep` of step 5            |
| 7. `npm test`, `words`, `format:check` pass       | Their output                                                 |

## Out of scope

Each item of the Spec's "Out of scope / carried forward".

## Deviations
