# Plan: C522: Align the requirements with the M2 decisions on #57

- **Spec:** #522
- **Requirement IDs:** [PIN-01](../../docs/requirements.md#pin-01), [PIN-02](../../docs/requirements.md#pin-02), [PIN-07](../../docs/requirements.md#pin-07), [NFR-03](../../docs/requirements.md#nfr-03), [NFR-10](../../docs/requirements.md#nfr-10)
- **Status:** approved

## Approach

Edit only `docs/requirements.md`, as the Chore lists. Each fact is said once: the M2 line cites PIN-01 for "clicking the map and typed coordinates", and the PIN-01 row says place search is delivered with EXP-04. The PIN-07 (M5) note goes in the Source row. The Viewer line sits under the Key concepts table. NFR-04 stays.

## Decisions

**D1 · The second "Also" check** · Decides: Tech lead

The Chore replaces "people, pins and sources", but the second check reads "people, pins or sources".

- **A.** Change it to "people or pins" too.
- **B.** Change only the first check.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · PlaceName's `source id`** · Decides: Tech lead

- **A.** Leave it: place names (BND-08) aren't in M2, and the Source row says when records arrive.
- **B.** Make it `sources` (text), like the Pin row.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                   | New / changed | What                                                                                   |
| ---------------------- | ------------- | -------------------------------------------------------------------------------------- |
| `docs/requirements.md` | Changed       | M2 line, PIN-01, Pin and Source rows, Storage, NFR-03, NFR-10, Not in v1, Key concepts |

## Order of work

1. One commit with every edit, citing #57.

## Deviations

- NFR-09 also changed ("sources too, from M5"): the M2 line cites it, and #522's "no leftover mention of source records in M2" covers it.

## Proof

| Acceptance check                                                   | Proven by                                                             |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| No M2 source records, no SQLite                                    | `git grep -n -i -e sqlite -e "source ids" docs/requirements.md`       |
| NFR-03 and "Not in v1" agree                                       | `git grep -n -i publish docs/requirements.md`                         |
| NFR-10, Viewer and the unpublished check exist                     | `git grep -n -e NFR-10 -e Viewer -e unpublished docs/requirements.md` |
| Anchors for PIN-01, PIN-02, NFR-03, NFR-04, NFR-09, NFR-10 resolve | `git grep -n` on each `id="…"` and `](#…)`                            |
| `npm run words`, `npm run format:check` pass                       | Their output in the PR                                                |
