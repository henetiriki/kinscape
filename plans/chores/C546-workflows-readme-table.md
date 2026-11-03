# Plan: C546: Workflows README as a table plus three small diagrams

- **Spec:** #546
- **Status:** approved

## Approach

`generate()` gets a table builder and a diagram builder. `FAMILIES` lists the three event groups; any other event throws. Each diagram, headed by its events, draws event → workflow edges, dotted `calls` edges, and one `classDef` per prefix.

## Decisions

**D1 · The `workflow_call` row** · Decides: Tech lead

`read()` drops `workflow_call`; the table must list it.

- **A.** Move that filter from `read()` into the diagram builder.
- **B.** Keep `read()`; infer the row for any workflow another one calls.

**Answer: A** (@henetiriki)

**D2 · Prefix fills** · Decides: Tech lead

- **A.** `design/tokens.json` tints and their `-border` strokes: Actions `error-bg`, Backlog `warning-bg`, CI `info-bg`, Claude `brand-tint`, Design `surface-2`.
- **B.** Other colours you name.

**Answer: A** (@henetiriki)

**D3 · An unknown prefix** · Decides: Tech lead

- **A.** The generator fails, as for an unknown event.
- **B.** The node gets no fill.

**Answer: A** (@henetiriki)

## Files that change

| File                                          | What                                    |
| --------------------------------------------- | --------------------------------------- |
| `scripts/workflows-diagram.mts`               | Table, `FAMILIES`, diagrams             |
| `scripts/__tests__/workflows-diagram.test.ts` | Table and diagram cases replace graph's |
| `.github/workflows/README.md`                 | Regenerated                             |
| `design/tokens.json`                          | Notes name the new use                  |

## Order of work

1. Rewrite the tests; see them fail.
2. Change the script; `npm run workflows:diagram`.
3. Lint, `format:check`, `words`, tests, `validate:boundaries`, `e2e`.
4. View the README on github.com.

## Risks

- Handed back (rule 13): the tech lead builds it.

## Proof

| Acceptance check                       | Proven by                        |
| -------------------------------------- | -------------------------------- |
| README written; up-to-date test passes | `npm test`; rerun leaves no diff |
| Table and three coloured ELK diagrams  | Tech lead views it on github.com |
| Lint, `format:check`, `words`          | CI                               |

## Deviations

- Claude strokes `brand`, Design `line-strong`: those tints have no `-border` token.
- Cells escape `\`, `|`, `<` and `>`; the Filter code span only `|`.
- `tokens.json` notes name the new use.
- A family with no listener is left out.
- Colours are read beside the script, not under `root`.
- `FAMILIES` is a list: lint sorts object keys.
