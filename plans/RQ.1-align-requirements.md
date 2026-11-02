# Plan: RQ.1: Align the requirements with what is built and decided

- **Spec:** #505 (Intent #372)
- **Requirement IDs:** NFR-08, MAP-08, PPL-01
- **Status:** approved

## Approach

Only `docs/requirements.md` changes, with the four edits the Spec lists, each from an answer on Intent #372. `npm run format` then realigns the tables whose widths change. MAP-08 stays in M5 (D3 = B), so its line is left alone.

## Files that change

| File                   | New / changed | What                                                                                                                                                                                                                                                                                                   |
| ---------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/requirements.md` | Changed       | _Front end_: "Next.js and TypeScript, with MapLibre GL JS for the map." M4: "(BND-03 to BND-05, NFR-08)". PPL-01 ends "…as fuzzy dates, notes", with no photo. Person row: "given names, surname, maiden name, name variants, …". Polity row: "type (colony, republic, province, homeland, district)". |

## Order of work

1. Commit the approved plan.
2. Make the four edits, then run `npm run format`.
3. Run lint, `format:check`, `words`, tests, the validator and `npm run e2e`.

## Risks

- **Intent still `status: draft`:** #372 has D1–D5 answered but is not marked approved. The PO approves it before this PR merges.
- **Diff outside `docs/requirements.md`:** this plan file is also committed, as rule 2 requires. The last acceptance check is read as "no other file besides the plan".
- **Open question still names field cornetcies:** left as the Spec says (its Flagged concern).

## Proof

| Acceptance check                                            | Proven by                                                                                            |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| NFR-08 under M4 only                                        | Searching the milestone list for "NFR-08" finds only M4                                              |
| MAP-08 still under M5 only                                  | Same search for "MAP-08"; its line is unchanged in the diff                                          |
| PPL-01 names maiden name, not photo                         | The diff of PPL-01                                                                                   |
| Person row lists maiden name                                | The diff of the data model                                                                           |
| Polity row has no field cornetcy                            | Searching the file finds no "field cornetcy"                                                         |
| Front-end line names Next.js, TypeScript, MapLibre; no Vite | The diff of _Suggested tech approach_                                                                |
| Lint, `format:check`, `words` pass; nothing else changed    | Their output in the PR; `git diff --stat origin/main` lists the plan and `docs/requirements.md` only |

## Out of scope

As in the Spec.
