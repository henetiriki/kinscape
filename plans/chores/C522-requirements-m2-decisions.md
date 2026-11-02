# Plan: C522: Align the requirements with the M2 decisions on #57

- **Spec:** #522
- **Requirement IDs:** [PIN-01](../../docs/requirements.md#pin-01), [PIN-02](../../docs/requirements.md#pin-02), [PIN-07](../../docs/requirements.md#pin-07), [NFR-03](../../docs/requirements.md#nfr-03), [NFR-10](../../docs/requirements.md#nfr-10)
- **Status:** draft

## Approach

Edit only `docs/requirements.md`, as the Chore lists (#57 D3 to D5, D7 to D9). The Pin row reads `sources (text in M2)`; the PIN-07 (M5) note goes in the Source row. NFR-04 stays. New: NFR-03 reads "Private in v1" with a publish-later line and "Not in v1" gains public publishing; NFR-10 (Must); Viewer in Key concepts; the M2 line adds NFR-10 and the unpublished-Tree check.

## Decisions

**D1 · The second "Also" check** · Decides: Tech lead

The Chore replaces "people, pins and sources", but the second check reads "people, pins or sources".

- **A.** Also change it to "people or pins".
- **B.** Change only the first check.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Where the publish-ready rule lives** · Decides: Tech lead

- **A.** New NFR-10, as the Chore says. The M2 line cites one ID. (Recommended)
- **B.** Add the same text to NFR-09. NFR-09 then mixes Account access with publishing.
- **Other:** your own.

## Files that change

| File                   | New / changed | What                                                                                   |
| ---------------------- | ------------- | -------------------------------------------------------------------------------------- |
| `docs/requirements.md` | Changed       | M2 line, PIN-01, Pin and Source rows, Storage, NFR-03, NFR-10, Not in v1, Key concepts |

## Order of work

1. One commit with every edit, citing #57.

## Proof

| Acceptance check                                                   | Proven by                                                             |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| No M2 source records, no SQLite                                    | `git grep -n -i -e sqlite -e "source ids" docs/requirements.md`       |
| NFR-03 and "Not in v1" agree                                       | `git grep -n -i publish docs/requirements.md`                         |
| NFR-10, Viewer and the unpublished check exist                     | `git grep -n -e NFR-10 -e Viewer -e unpublished docs/requirements.md` |
| Anchors for PIN-01, PIN-02, NFR-03, NFR-04, NFR-09, NFR-10 resolve | `git grep -n` on each `id="…"` and `](#…)`                            |
| `npm run words`, `npm run format:check` pass                       | Their output in the PR                                                |
