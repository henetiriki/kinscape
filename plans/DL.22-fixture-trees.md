# Plan: DL.22: Two fixture Trees: one family, and one Person alone

- **Spec:** #956
- **Requirement IDs:** None (test data only)
- **Status:** approved

## Approach

`memoryStore` already takes seed People and Relationships and refuses writes to a read-only Tree (DL.7). So this Spec adds data and passes it on, and the store does not change.

Each row of `FIXTURES` in `server/auth/fixtures.mts` gets `persons` and `relationships`. The researcher row gets two empty lists and stays first, because `e2e/fixture-accounts.spec.ts` reads `const [researcher] = FIXTURES`. The memory branch of `appAdapters` puts both lists in the seed Tree. The Tree ids already go to the read-only list.

Two local helpers build the rows from GEDCOM text with `personInputSchema.parse` and `relationshipInputSchema.parse`. Each Person gets `deceased: true`. A bad date or id then throws when the module loads, so each test that imports `FIXTURES` fails.

The file exports `MARIA`, the `PersonInput` of Maria Magdalena du Toit. The Family Tree and the Alone Tree both hold this one object. DL.22.3 (#959) needs `MARIA.id`, and DL.23 (#960) copies her fields.

The fixed ids:

| Row                                                                | Id                                                             |
| ------------------------------------------------------------------ | -------------------------------------------------------------- |
| Accounts `r.family`, `r.alone`                                     | `00000000-0000-4000-8000-0000000000a3`, `…a4`                  |
| Trees "Family Tree", "Alone Tree"                                  | `00000000-0000-4000-8000-0000000000b3`, `…b4`                  |
| Maria                                                              | `01900000-0000-7000-8000-0000000000a1`                         |
| `o1` to `o12` of `SAMPLE_PEOPLE`                                   | `01900000-0000-7000-8000-000000000101` to `…112`               |
| Parents `p1` to `p3`, children `c1` and `c2`, spouses `s1` to `s3` | `…000000000201` to `…203`, `…211` and `…212`, `…221` to `…223` |

The passwords are `family-password` and `alone-password`. Each differs from the wrong passwords of the sign-in tests.

## Alternatives considered

- Build the dates with `fuzzyDateOf`, as `app/screens/` does. Then no schema checks the rows, and a typo gives a wrong date with no error.
- Import the rows from `app/screens/`. The layer rules do not let `server/` import `app/screens/`, and DL.22.2 and DL.22.3 delete those rows.
- Put the rows in a second file. Spec item 8 names one file, and one file keeps each Account beside its Tree.

## Files that change

| File                                     | New / changed | What                                                                                                                                                                     |
| ---------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `server/auth/fixtures.mts`               | Changed       | Two Accounts, 13 People, 8 Relationships, `MARIA`                                                                                                                        |
| `server/adapters.mts`                    | Changed       | The seed Tree of each fixture takes its `persons` and `relationships`                                                                                                    |
| `server/auth/__tests__/fixtures.test.ts` | New           | Check 6, and the emails start with "r"                                                                                                                                   |
| `server/__tests__/adapters.test.ts`      | Changed       | Checks 1 to 5 through `openTree`. The two tests that read `[fixture]` for check 7 loop over `FIXTURES`. The researcher test gets a title that names only the researcher. |
| `e2e/fixture-accounts.spec.ts`           | Changed       | One test for checks 1 to 3, one for check 4. The researcher test does not change.                                                                                        |
| `plans/DL.22-fixture-trees.md`           | New           | This plan                                                                                                                                                                |

## Order of work

1. Write `fixtures.test.ts` and the new `adapters.test.ts` tests. See them fail on the missing Accounts.
2. Add the rows to `fixtures.mts`, and pass them on in `adapters.mts`. See the tests pass.
3. Add the two browser tests. Run them with a local `npm run e2e`.
4. Run the checks in `AGENTS.md` › Commands. Paste the output in Evidence.

## Risks

- **Two copies of the sample data.** `app/screens/` keeps its rows until DL.22.2, DL.22.3 and DL.23 delete them (Spec item 11). If the copies differ, the design check of DL.22.3 shows it.
- **`deceased` on the Relationships rows.** `SAMPLE_RELATIONSHIPS` gives the parents and children `deceased: false`, and `SAMPLE_PEOPLE` gives them `true`. Each of them has a death date, so the date line is the same.
- **The order of the rows.** `groupRelationships` sorts each group by name. This gives the order of the board `Person-relationships`, so no sort changes.

## Proof

| Acceptance check                                      | Proven by                                                                                          |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1. `r.family` sees 13 People                          | `adapters.test.ts` (list of 13); `fixture-accounts.spec.ts` ("13 people in this Tree, by surname") |
| 2. Three parents, three spouses, two children by name | `adapters.test.ts` (8 Relationships); `fixture-accounts.spec.ts`, each name in its group           |
| 3. The form of Maria                                  | `adapters.test.ts` (her fields); `fixture-accounts.spec.ts` (maiden name, notes, variants)         |
| 4. `r.alone` sees one Person and no Relationship      | `adapters.test.ts`; `fixture-accounts.spec.ts` ("1 person", the three empty groups)                |
| 5. A write to either Tree is refused                  | `adapters.test.ts`: each of the four writes, then the lists do not change                          |
| 6. Each Person deceased, both ends in the Tree        | `fixtures.test.ts`                                                                                 |
| 7. No fixture Account without the memory adapters     | `adapters.test.ts`, for each row of `FIXTURES`                                                     |
| 8. `fixture-accounts.spec.ts`                         | A local `npm run e2e` (in no CI job until DL.22.1, #957)                                           |
| 9. Tests, types, lint, e2e, 100% coverage             | Output in Evidence                                                                                 |

## Out of scope

Each item of the Spec's "Out of scope / carried forward". No change to `app/screens/`, `design/screens.json` or `memoryStore`.
