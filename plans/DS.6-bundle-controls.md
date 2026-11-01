# Plan: DS.6: Bundle the shared controls for the canvas

- **Spec:** #449
- **Requirement IDs:** None (design tooling)
- **Status:** draft

## Approach

`lib/design/bundle.mts` holds `CONTROLS` (#448's 12 names and paths, in display order) and pure helpers: the header, a virtual entry re-exporting `CONTROLS`, the size and string checks, and gathering declarations. `scripts/design-system.mts` gains `buildControls`: Vite's `build()` (`configFile: false`, `write: false`, an IIFE named `KinScape`, `react` and `react-dom` external as `React` and `ReactDOM`), then the TypeScript API with `emitDeclarationOnly` writing to memory. `run` becomes async and writes `components/bundle.js` (header, then minified code), `bundle.css` (`app/tokens.css`, then Vite's CSS) and `index.d.ts`, throwing on a failed check. Pages have no `react/jsx-runtime`, so a Vite plugin resolves it to a shim over `React.createElement`.

## Decisions

**D1 · Where `<Name>Props` comes from** · Decides: Tech lead

No control exports its props type, and lint allows exported types only in `types.ts`.

- **A.** The gathering step writes `export type <Name>Props = Parameters<typeof <Name>>[0]` beside each control's generated declaration. No app code changes.
- **B.** Move each control's props into a named type in its folder's `types.ts` and re-export it. Spelled out, but about 250 lines move, passing the 600-line cap.
- **Other:** your own.

Recommended: A, because the declaration the type reads sits directly above each alias, and the diff stays within the cap.

**D2 · Where the mount test runs** · Decides: Tech lead

- **A.** A `bundle` block in `react-18.test.tsx`: a JSDOM page with `runScripts: 'dangerously'` runs React 18's UMD files from `react-18` and `react-dom-18`, then the bundle. It reuses `CASES` as it is, and a `VirtualConsole` catches errors and warnings.
- **B.** A Playwright blank page. A real browser, but `CASES` can't load there (CSS modules, function props), so its props are copied into data.
- **Other:** your own.

Recommended: A, because it uses `CASES` without copying it, and the check is about errors, not layout.

## Files that change

| File                                      | New / changed | What                                                                              |
| ----------------------------------------- | ------------- | --------------------------------------------------------------------------------- |
| `package.json`, `package-lock.json`       | changed       | `vite` 8.3.5 in `devDependencies` (D2 on #449)                                    |
| `lib/design/bundle.mts`                   | new           | `CONTROLS`, header, entry, JSX shim, checks, gathering                            |
| `lib/design/__tests__/bundle.test.ts`     | new           | Each helper; each check fails naming its problem                                  |
| `lib/design/system.mts`                   | changed       | `libraries`: `react` and `react-dom` at 18                                        |
| `lib/design/__tests__/system.test.ts`     | changed       | The index's new `libraries`                                                       |
| `scripts/design-system.mts`               | changed       | `buildControls`; `run` async, writing `components/`                               |
| `scripts/__tests__/design-system.test.ts` | changed       | Awaits `run`; header, strings, sizes, types file                                  |
| `lib/design/__tests__/react-18.test.tsx`  | changed       | Mounts each control's first case (by `element.type`) from the bundle (D3 on #449) |

## Order of work

1. Add `vite` with `npm install --save-dev --save-exact vite@8.3.5`.
2. Write `bundle.test.ts` and see it fail on behaviour, then `bundle.mts`.
3. Update the `libraries` test, then `systemIndex`.
4. Update the script test, then `buildControls` and `run`.
5. Add the mount test.
6. Run lint, `format:check`, `typecheck`, `words`, `npm test`, `validate:boundaries`, `e2e`, and `npm run design-system` twice.

## Risks

- After merge, `/publish-design-system` sends `components/` and React 18 too, before DS.7's previews. The tech lead may hold publishing until DS.7.
- The shim must pass `key` and keep React 18 from warning; the mount test fails on any warning.
- JSDOM may reject modern CSS in `bundle.css`. Then I stop and ask rather than filter the errors.
- `'use client'` lines make Rolldown warn; the build silences only that warning.

## Proof

| Acceptance check                                                     | Proven by                                 |
| -------------------------------------------------------------------- | ----------------------------------------- |
| Every control mounts from the bundle under React 18                  | `react-18.test.tsx` › bundle              |
| Header lists exactly the controls; no `</script`, `<!--`; under 6 MB | `design-system.test.ts`, `bundle.test.ts` |
| Stylesheet has no `</style`; under 2 MB                              | `design-system.test.ts`, `bundle.test.ts` |
| Types file declares each control and `<Name>Props`                   | `design-system.test.ts`                   |
| Index `libraries`; no other key differs                              | `system.test.ts`                          |
| Two builds are byte-identical                                        | `design-system.test.ts` › byte-identical  |
| Lint, `format:check`, `words`, tests, e2e                            | Output pasted in the PR                   |

## Out of scope

- Previews, READMEs, publishing and the publish skill's wording: DS.7.
