# Plan: C522: Align the requirements with the M2 decisions on #57

- **Spec:** #522
- **Requirement IDs:** [PIN-01](../docs/requirements.md#pin-01), [PIN-02](../docs/requirements.md#pin-02), [PIN-07](../docs/requirements.md#pin-07)
- **Status:** approved

## Approach

Edit only `docs/requirements.md`, as the Chore lists. The Pin row's key fields read `sources (text in M2)`; the "arrives with PIN-07 (M5)" note goes in the Source row's empty Notes cell. Anchors and NFR-04 stay untouched.

## Decisions

**D1 · The second "Also" check** · Decides: Tech lead

The Chore replaces "people, pins and sources", but the second check reads "people, pins or sources".

- **A.** Also change it to "people or pins", matching Intent #57's check.
- **B.** Change only the first check, as worded.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                   | New / changed | What                                                   |
| ---------------------- | ------------- | ------------------------------------------------------ |
| `docs/requirements.md` | Changed       | M2 line, PIN-01, Pin and Source rows, Storage (and D1) |

## Order of work

1. One commit with every edit, citing #57 D3 to D5.

## Proof

| Acceptance check                                      | Proven by                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| Each change stated once; no M2 source records, SQLite | `git grep -n -i -e sqlite -e "source ids" docs/requirements.md` |
| Anchors for PIN-01, PIN-02, NFR-04, NFR-09 resolve    | `git grep -n` on each `id="…"` and `](#…)`                      |
| `npm run words`, `npm run format:check` pass          | Their output in the PR                                          |
