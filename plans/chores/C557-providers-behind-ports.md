# Plan: C557: Enforce that providers stay behind ports

- **Spec:** #557
- **Status:** approved

## Approach

A fitness test in the style of `vercel-imports.test.ts`: a pure `violations(files)` returns `<path>: <rule>` lines, fixture cases cover each rule, and one case runs it over `git ls-files` (as `requirement-links.test.ts` does). Rule 1 reads file contents, case-insensitive. Rule 2 matches `from`, `import()`, `require()` and side-effect specifiers starting `@supabase/` in every tracked code file but the test itself, whose fixtures would flag it. Rule 3 matches `\b(?:auth|storage)\.` and `create\s+policy`, case-insensitive, as SQL is. No code in `server/` changes.

## Files that change

| File                                  | New / changed | What                                    |
| ------------------------------------- | ------------- | --------------------------------------- |
| `scripts/__tests__/providers.test.ts` | new           | the three rules                         |
| `docs/architecture.md`                | changed       | **Providers behind ports.** row         |
| `docs/requirements.md`                | changed       | line 238 links to the row's `#patterns` |

## Order of work

1. Fixture cases, failing on a stub `violations` that returns `[]`; then the rules.
2. The `git ls-files` case, passing on `main`.
3. Docs.

## Risks

- `docs/architecture.md` has an 800-word budget: the row keeps to the Chore's five points, trimmed if `npm run words` fails.

## Proof

| Acceptance check                      | Proven by                    |
| ------------------------------------- | ---------------------------- |
| `npm test` passes with the new test   | pasted output                |
| `'supabase'` in `server/trees/` fails | fixture case naming the file |
| `@supabase/supabase-js` import fails  | fixture case                 |
| `create policy` migration fails       | fixture case                 |
| Row and link exist                    | the diff                     |

## Deviations

- Proof rows 2-4 use fixture cases only, with no local edit of a real file.
- To fit the 800-word budget, `docs/architecture.md` rewords the intro, the screen, migrations, shared-types and NFR-01 rows and the fitness-test line; the shared-types row loses "Node erases `import type`".
- Rule 1 reads every tracked non-binary file under `app/`, `features/`, `lib/`, `server/` and `scripts/`, and exempts only `__tests__/` (not `.test.` or `.spec.` names).
- Rule 2 also matches a backtick specifier; rule 3 also matches a quoted schema (`"auth".`).
