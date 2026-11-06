# Plan: C622: Pattern for Tree-scoped tables

- **Spec:** #622
- **Requirement IDs:** [NFR-09](../../docs/requirements.md#nfr-09), [NFR-10](../../docs/requirements.md#nfr-10)
- **Status:** draft

## Approach

`server/db/TEMPLATE.sql` holds two commented tables, `example_person` and `example_pin`, built to every rule in #622, with the update and create statements as comments. The names keep it applicable after M2.8 adds `person`. `tree-scoped.test.ts` applies the migrations and the template on PGlite; a catalog check (`pg_constraint`) lists each table breaking a rule and expects none. Further cases apply one bad table per rule and expect it named, so a scratch migration fails the same way.

## Decisions

**D1 · Room in `docs/architecture.md`** · Decides: Tech lead

It is within a few words of its 800 budget; the row needs about 35.

- **A.** A terse row naming the template and test; shorten other rows to fit.
- **B.** Raise its budget to 850 in `scripts/word-count.mts`.
- **Other:** your own.

Recommended: A, because the template's comments hold the detail once.

**D2 · UUIDv7 generator** · Decides: Tech lead

- **A.** Not here: M2.8 builds it with the first create; tests use `crypto.randomUUID()`.
- **B.** Add it to `lib/domain/` here, with its test.
- **Other:** your own.

Recommended: A, because #622 lists only the row, template and test.

## Files that change

| File                                      | New / changed | What                       |
| ----------------------------------------- | ------------- | -------------------------- |
| `server/db/TEMPLATE.sql`                  | New           | The example tables         |
| `server/db/__tests__/tree-scoped.test.ts` | New           | Catalog check and template |
| `docs/architecture.md`                    | Changed       | The Patterns row (D1)      |

## Order of work

1. Bad-table cases against a check returning nothing; see each fail.
2. The check, the template, its three cases.
3. The row.
4. Evidence: a scratch migration per rule, its failure pasted, then deleted.

## Proof

| Acceptance check                     | Proven by                 |
| ------------------------------------ | ------------------------- |
| Row names template and test          | Review; `npm run words`   |
| Scratch migration fails per rule     | Bad-table cases; Evidence |
| Three template behaviours            | Template cases on PGlite  |
| Lint, format, tests, boundaries, e2e | CI; Evidence              |
