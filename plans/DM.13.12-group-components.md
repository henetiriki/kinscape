# Plan: DM.13.12: Group app/components by purpose; screens build from components

- **Spec:** #264 (Intent #111)
- **Requirement IDs:** none (a refactor)
- **Status:** draft

## Approach

- **Move.** `git mv` the 54 components, their stylesheets, tests and the five shared files into the seven folders of Spec D1 and D4, one commit with renames only.
- **Paths.** Every import of another file in `app/components` becomes `@/app/components/<folder>/X`, tests too (Spec D2). Stylesheets in the same folder keep `./` (`TokenField` and `SelectField` share `./TextField.module.css`; `Banner` takes `./Toast.module.css`). `composes` tries the alias; if `npm run build` rejects it, `../<folder>/X.module.css`, recorded under Deviations.
- **Lint.** `import/no-unresolved` (the TypeScript resolver `eslint-config-next` already sets) catches a missing path. `no-restricted-imports` bans `../` inside `app/components` and any relative path into it from the rest of `app/`.
- **Scans.** `hover.test.ts` reads `app/components` recursively and expects 49 stylesheets; `design.test.ts` globs `app/components/**/*.tsx` outside `__tests__` and expects 54.
- **Rule.** `DESIGN.md` › Components: the folder map and page rule. `plans/README.md`: a rule 9 on missing components. `TEMPLATE.md`: `## Components`. `AGENTS.md` line 12 points to `DESIGN.md` at the same length.

## Decisions

**D1 · The diff passes the 600-line cap** · Decides: Tech lead

About 1,200 changed lines (`git diff -M`; renames count 0): ~600 path rewrites, ~450 moved test cases (~220 with D2 B), ~150 lint, scans and docs.

- **A.** One PR over the cap, in commits by kind: the moves alone, path rewrites, test splits, lint, docs.
- **B.** Split off the rule and docs as a new Spec (the Spec's fallback). This one stays ~1,150, still over.
- **C.** Split by folder: this Spec moves `foundation`, `actions`, `forms` with lint and scans; a new Spec moves `feedback`, `overlays`, `map`, `auth` and writes the docs. ~600 each; between merges `app/components` holds folders and loose files.
- **Other:** your own.

Recommended: A, because nearly every line is a path or a moved case, and a split leaves the folder half-moved.

**D2 · Four more tests span folders** · Decides: Tech lead

Spec D5 names `Parts` and `Toggles`. Also: `Alert` (an `Icon` case), `Menu` (two `Avatar` cases), `Surface` (`ProgressBar`, `Callout`), `DateParts` (`BottomSheet`).

- **A.** Split them too, as D5 A.
- **B.** Move each whole to its main component's folder, importing across; the acceptance check then names eight tests that follow D5, not four.
- **Other:** your own.

Recommended: A, because the acceptance check puts each component's test beside it.

## Files that change

| File                                                                    | What                                                                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `app/components/**`                                                     | Moved; imports and `composes` rewritten; split tests keep their name, or take a lone component's |
| `app/components/__tests__/{hover,onSurface}.*`                          | Recursive scan and count; new paths and `composes` text                                          |
| `app/page.tsx`, `app/design-kit/**`, `app/__tests__/page.test.tsx`      | 86 import and mock paths                                                                         |
| `lib/design/__tests__/design.test.ts`                                   | Recursive `.tsx` list and count; lines 70, 93, 119                                               |
| `eslint.config.mjs`                                                     | The two rules                                                                                    |
| `design/DESIGN.md`, `plans/README.md`, `plans/TEMPLATE.md`, `AGENTS.md` | The rule                                                                                         |

## Order of work

1. Run `npm run design:check`; keep its list.
2. Commit the `git mv`s alone.
3. Rewrite paths and `composes`; run `npm run build`.
4. Split tests; recursive scans with counts.
5. Lint rules; lint, typecheck, test.
6. Docs; `npm run words`.
7. Lint, test, validator, e2e, `design:check`.

## Risks

- **`import/no-unresolved` misreads CSS or JSON:** the rule ignores those extensions; `tsc` covers them.
- **`plans/README.md` (600 words):** at about 490, the rule stays under 110.
- **`AGENTS.md`** is a CODEOWNERS path, so it needs the tech lead's review.

## Proof

| Acceptance check                             | Proven by                                                    |
| -------------------------------------------- | ------------------------------------------------------------ |
| Only folders; each test beside its component | `git diff -M --stat` in the PR                               |
| Scans read as many files                     | Count assertions in `hover.test.ts`, `design.test.ts`        |
| Named paths found                            | `onSurface.test.tsx`, `design.test.ts` pass                  |
| No missing path, no `../`                    | The lint rules; a broken import fails `npm run lint` locally |
| Docs and template                            | The diff; `npm run words`                                    |
| ≤ 0.5% on `blocking` screens; 100%           | e2e, `design:check`, test, validator output in the PR        |
