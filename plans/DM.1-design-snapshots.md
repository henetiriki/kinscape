# Plan: DM.1: Design snapshots in the repo

- **Spec:** #112 (Intent #111)
- **Status:** draft

## Approach

The tech lead has committed the exported snapshots (Spec D1): one per `DESIGN.md` › Screens row, 20 in all, each linking `fonts.css`. Prettier formats them like any other file. The Spec says 13 screens and states; the table has 14, plus six boards.

`scripts/design-shots.mts` opens each `design/source/<name>.html` from `file://` in Playwright's Chromium. It fails on any non-`file:` request, waits for `document.fonts.ready`, and writes `design/<name>.jpg` only if the bytes changed. Names containing `phone`: 390 × 844, 2x. `style-*` and `map-style`: full page, 1440 wide. Others: 1440 × 900. Launching the browser sits behind a `v8 ignore`, as in `prepare-map-data.mts`; the rest is injected and tested.

`scripts/__tests__/design-shots.test.ts` fails when a Screens row lacks a snapshot or JPG, or a snapshot lacks a row. It also fails on `<script`, `var(`, `calc(`, any `http(s)` load, or a local `url()` or `href` that doesn't resolve (`#id` must match an `id`; bare `#` passes).

## Decisions

**D1 · Where the font files come from** · Decides: Tech lead

- **A.** `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/public-sans` and `@fontsource/jetbrains-mono` (OFL-1.1) as dev dependencies, referenced in `node_modules`. Offline after `npm ci`; DM.2 can reuse them (NFR-03).
- ~~**B.** Copy the woff2 files and `OFL.txt` into `design/source/fonts/`. Dependabot never updates them.~~
- ~~**Other:** your own.~~

Recommended: A, because the Spec asks for local packages and everyone runs `npm ci`.

**Answer: A** (Tech lead)

**D2 · Where the `@font-face` rules live** · Decides: Tech lead

- **A.** One `design/source/fonts.css`, linked by every snapshot.
- ~~**B.** Inline in every snapshot: 20 copies.~~
- ~~**Other:** your own.~~

Recommended: A, because a font change then touches one file.

**Answer: A** (Tech lead)

**D3 · Keeping unchanged JPGs unchanged** · Decides: Tech lead
Chromium draws text differently on macOS and Linux, so rendering everything elsewhere rewrites every JPG.

- **A.** `npm run design:shots -- <name>…` renders only the named snapshots, or all with none. `DESIGN.md` says to name the ones you changed.
- ~~**B.** Always render all, inside the pinned Playwright Docker image. Needs Docker.~~
- ~~**Other:** your own.~~

Recommended: A, because it works on any machine without Docker.

**Answer: A** (Tech lead)

## Files that change

| File                                     | New / changed | What                                     |
| ---------------------------------------- | ------------- | ---------------------------------------- |
| `design/source/*.html`                   | New           | 20 snapshots, committed by the tech lead |
| `design/source/fonts.css`                | New           | `@font-face` rules (D2 A)                |
| `design/*.jpg`                           | Changed       | Re-rendered                              |
| `scripts/design-shots.mts`               | New           | The renderer                             |
| `scripts/__tests__/design-shots.test.ts` | New           | Screens table and snapshot rules         |
| `package.json`, `package-lock.json`      | Changed       | `design:shots`; fonts (D1 A)             |
| `design/DESIGN.md`                       | Changed       | Source column, how to refresh            |

## Order of work

1. On approval, commit the plan.
2. Font packages and `fonts.css`, naming each family as the snapshots do (`'Public Sans'`, not the packages' `Variable` names).
3. Tests, then the script.
4. Render all JPGs; list visible differences from the canvas JPGs in the PR.
5. `DESIGN.md`; run the checks.

## Risks

- **Variables or `calc()` in an export:** the test fails and the design session re-exports; the build doesn't hand-edit values.
- **Board widths unmeasured:** `file` and `identify` were denied. The build reads the current JPG sizes and records any difference under Deviations.

## Proof

| Acceptance check                       | Proven by                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| Opens offline, renders like its JPG    | The script fails on any network request; the JPGs are its output              |
| Values written, not computed           | Test: no `var(`, `calc(` or `<script`                                         |
| A colour change rewrites only its JPGs | Change one colour in `map-date-invalid.html`, run, paste `git status`, revert |
| Every row has a snapshot and JPG; test | Test on the real files, plus a fixture with a missing file                    |
| Repo stays green                       | `lint`, `format:check`, `test`, `validate:boundaries`, `words`, `e2e` output  |

## Out of scope

Token files, slimming `DESIGN.md` (DM.2), the design check (DM.3) and the app's own fonts.
