# Plan: C582: Override minimatch to 11 for GHSA-g3hv-75wg-m249

- **Spec:** #582
- **Status:** approved

## Approach

Per D1: A on the issue, nested `package.json` overrides lift only the three vulnerable `minimatch@10.2.6` copies (under `eslint`, `@eslint/config-array`, `@typescript-eslint/typescript-estree`) to `^11.0.1`. The root `3.1.5` is outside the advisory and stays. Per D2: A, the `docs/dependencies.md` › Overrides intro also covers lifting a vulnerable transitive version.

## Files that change

| File                   | New / changed | What                                         |
| ---------------------- | ------------- | -------------------------------------------- |
| `package.json`         | changed       | Three nested `minimatch: ^11.0.1` overrides  |
| `package-lock.json`    | changed       | Only the three `10.2.6` entries, to `11.0.x` |
| `docs/dependencies.md` | changed       | Overrides intro and a `minimatch` row        |

## Order of work

1. Reword the issue body's override line and `npm ls` check to D1: A, and the docs line to D2: A, in one `gh issue edit`; note it in the PR body.
2. Add the overrides, keys alphabetical; run `npm install`.
3. Edit `docs/dependencies.md`.
4. Run lint, `format:check`, `words`, typecheck, tests, `validate:boundaries`, e2e.

## Risks

- A parent breaks on `minimatch` 11: its CommonJS `exports` match 10.2.6, and `glob` already runs 11.0.4. Lint and typecheck exercise all three.
- The unplanned branch `claude/issue-582-20261104-1847` holds this diff; the build may reuse it after checking. Deleting it is for the tech lead.

## Proof

| Acceptance check                                     | Proven by                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| No `minimatch` from 7 up to 11.0.1 (D1)              | `npm ls minimatch --all`; if denied, `git grep` of the lockfile's entries |
| Lint, `format:check`, `words`, typecheck, tests, e2e | Output pasted in the PR                                                   |
| Dependabot closes alert #3                           | The tech lead, after merge                                                |
