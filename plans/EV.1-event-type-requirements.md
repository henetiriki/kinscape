# Plan: EV.1: Requirements: finish PIN-03 and EXP-09

- **Spec:** #305 (Intent #302)
- **Requirement IDs:** PIN-03, EXP-01, EXP-09
- **Status:** draft

## Approach

Only `docs/requirements.md` changes. The Spec's D1–D3 answers restore EXP-01's row as it was before #300, word for word and a Must, and delete the EXP-09 row. The Build milestones stay as they are, since M3 already lists EXP-01 to EXP-05. PIN-03 names "baptism or christening" and the residence examples, with the types D1 sets. `npm run format` realigns both tables.

## Decisions

**D1 · Event types in PIN-03 after the revert** · Decides: PO

The answers restore EXP-01, whose range pins name "land ownership", and say #304 adds back the two removed glyphs. The Spec and Intent #302 keep eight types, without land ownership or occupation.

- **A.** Eight types, as the Spec says: birth, baptism or christening, residence (census, voters roll, will), marriage, divorce, death, burial, other. EXP-01 then names land ownership, which is not a type.
- **B.** Ten types: A's eight, plus land ownership and occupation after burial, where they were before #300. #302's check that neither is a type, and its Out of scope line, are reworded. #304 needs two more SVGs.
- **Other:** your own.

Recommended: B, because it matches "add back the two removed glyphs", and EXP-01 then names only real types.

## Files that change

| File                   | New / changed | What                                                  |
| ---------------------- | ------------- | ----------------------------------------------------- |
| `docs/requirements.md` | Changed       | PIN-03 as D1 says; EXP-01 as before #300; EXP-09 gone |

## Order of work

1. Record D1, reword the Spec's Behaviour and Acceptance checks to match the D1–D3 answers, then commit the approved plan.
2. Edit PIN-03, EXP-01 and EXP-09, then run `npm run format`.
3. Run `npm run format:check`, `npm run words`, lint, tests, the validator and `npm run e2e`.

## Risks

- **Intent not approved:** #302 is `status: ready-for-po` with its own D1–D3 open. The PO records the same answers there before this PR merges.
- **EV.2:** under D1 B, #304 has only eight `kse-*.svg` shapes. The designer adds two before it is built.

## Proof

| Acceptance check                                     | Proven by                               |
| ---------------------------------------------------- | --------------------------------------- |
| PIN-03 lists the types with "baptism or christening" | The diff; PO review                     |
| EXP-01 reads as before #300, Must, in M3             | The diff against PR #300's removed line |
| No EXP-09                                            | Searching the file finds no "EXP-09"    |
| "land ownership" only in EXP-01 (and PIN-03 under B) | Searching the file                      |
| `format:check` and `words` pass                      | Their output in the PR                  |

## Out of scope

As in the Spec. `plans/bugs/B297-event-glyphs.md` keeps its record of #300.
