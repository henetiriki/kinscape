# Plan: DM.13.7: Map furniture board at 0.5%, no report mode

- **Spec:** #228 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** draft

## Approach

Four screens go `blocking`, then `report` goes (D2): `style-8-components-map` (5.19%), `style-8-components-map-phone` (16.37%), `style-8-components-map-2-phone` (15.93%) and `style-7-components-surfaces-2` (3.29%, left `report` by DM.13.6). Scores are on `22645ee`. I re-measure first on CI (the e2e run, which needs Chromium).

Board 08 pages like board 07: a phone shows one part at a time (`?part=2`: event glyphs, legend, Date dock) with the part link; a desktop shows everything. The Date dock section is new: its dock, measurements and accessibility tables are drawn kit-only (D1), without touching `DateDock`.

Differences found on the old snapshots, to confirm after the #256 re-export:

- **Desktop:** glyph-card glyphs sit at normal line height; `EventGlyph` uses 1. The page fixes it, not the component.
- **Phone:** no Zoom card row (Layers button only); Event glyphs are a table, not the card grid; `Matrix` rows need a `desktop` flag, as `Variant` has.
- **Surfaces part 2, desktop:** found with `/match-design`; the phone part passes, so the cause is a desktop-only row or layout.

## Decisions

**D1 · Drawing the Date dock** · Decides: Tech lead

The snapshots draw Play, speed, Jump to, epoch ticks, key hints, a contested note and a phone sheet (MAP-08, MAP-09; not built). `DateDock` has none of them.

- **A.** Kit-only static drawing from the snapshot; `DateDock` and the map untouched.
- **B.** The real `DateDock`, plus a static drawing of the missing parts.

**Answer: A** (@henetiriki)

**D2 · Where `report` goes** · Decides: Tech lead

- **A.** `sweepProblems` flags an entry that isn't `blocking`; `check.mts` accepts only `blocking`, dropping `reported` and its label.
- **B.** Only `sweepProblems` flags it.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                | What                                                             |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `app/design-kit/map-furniture/page.tsx`, `page.module.css`                          | Parts, part link, lead and eyebrow                               |
| `app/design-kit/map-furniture/sections.tsx`                                         | Date dock section and tables; glyph table; Zoom row desktop-only |
| `app/design-kit/inputs/Board.tsx`, `page.module.css`                                | `Matrix` `desktop` flag                                          |
| `app/design-kit/surfaces/*`                                                         | Desktop part 2 fix (known after the first measure)               |
| `app/design-kit/map-furniture/__tests__/page.test.tsx`, `e2e/map-furniture.spec.ts` | Parts, dock, glyph table; part 2 opens `?part=2`                 |
| `lib/design/sweep.mts`, `check.mts`, their tests                                    | Flag `report`; D2                                                |
| `design/screens.json`, `design/DESIGN.md`                                           | Four entries `blocking`; no `report`                             |

## Order of work

1. Rebase on `main`; run the full design check; record every score.
2. Surfaces part 2, desktop.
3. Board 08: desktop, phone part 1, then the Date dock (phone part 2).
4. Flip the four to `blocking`; the `report` check (test first); D2; `DESIGN.md`.
5. Lint, typecheck, test, validator, e2e.

## Risks

- **Size:** Date dock ~300, board 08 fixes ~200, Surfaces unknown. If the diff passes ~600 lines, stop and ask for the Date dock to be split (README rule 7).
- **Shared layout:** `Board.tsx` serves boards 06 to 08; the `desktop` flag is opt-in and `blocking` screens catch a shift.

## Proof

| Acceptance check                       | Proven by                                   |
| -------------------------------------- | ------------------------------------------- |
| Four screens `blocking`, none `report` | `screens.json`; `screens.test.ts`           |
| Each ≤ 0.5%, other blocking pass       | `npm run e2e`; PR score table               |
| A `report` entry fails tests           | `screens.test.ts` on a stubbed entry        |
| No `report` in `DESIGN.md`             | The diff; `grep -n report design/DESIGN.md` |
| Tests, e2e, validator, 100%            | Output in the PR                            |

## Out of scope

The other boards; removing `mode` or `ignore`; building Play, Jump to or the phone sheet; `EventGlyph`'s line height elsewhere.
