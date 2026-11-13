# Plan: C796: Replace the avoided words with the glossary terms

- **Spec:** #796
- **Status:** draft

## Approach

Replace each same-meaning use of an [**Avoid** word](../../docs/glossary.md#glossary-terms) with its term. The done check's search also finds code, so code changes too.

## Decisions

**D1 · Design system steps for `DESIGN.md`** · Decides: Tech lead

[Changing the design system](../../design/CANVAS.md#changing-the-design-system) lists every `DESIGN.md` change. The line 3 edit is in no `README_SECTIONS` section (`lib/design/system.mts`).

- **A.** Run steps 2 and 3. If step 3.6 lists no path, skip steps 4 to 9.
- **B.** Skip all steps.
- **Other:** your own.

Recommended: A, because step 3.6 proves that nothing changed.

## Files that change

| File                                                                                       | New / changed | What                                                                                |
| ------------------------------------------------------------------------------------------ | ------------- | ----------------------------------------------------------------------------------- |
| `design/CANVAS.md`                                                                         | changed       | "artboard" → "board"; heading and lines 18, 21, 69 → "Refreshing the canvas copy"   |
| `design/DESIGN.md`                                                                         | changed       | Line 3: "The design agent made them"                                                |
| `docs/writing.md`, `.claude/skills/refine/SKILL.md`                                        | changed       | STE rule 5 and line 45 name the glossary too                                        |
| `AGENTS.md`, `.claude/skills/refine/chore.md`                                              | changed       | Links → `#refreshing-the-canvas-copy`                                               |
| `scripts/design-export.mts`, `scripts/types.ts`, `scripts/__tests__/design-export.test.ts` | changed       | "artboard" → "board" in comments, errors, test names, `ARTBOARD_DIR` and `Artboard` |
| `.github/workflows/ci.yml`, `.github/workflows/design-agent-shots.yml`                     | changed       | Comment: "artboard" → "board"                                                       |

## Order of work

1. Edit the docs and skills.
2. Edit the script and its tests in one commit.
3. Do D1.
4. Run the checks in `AGENTS.md`.

## Risks

- `AGENTS.md`, `docs/writing.md`, `.claude/skills/**` and `.github/workflows/**` are hand-back paths. The tech lead builds with `/build-local`.
- The test file has a `board` helper. Rename the `artboard` helper without a name clash.

## Proof

| Acceptance check                 | Proven by                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------- |
| Search finds only other meanings | `git grep -i` for each word outside `plans/`, `design/canvas/`, `design/source/` |
| Renamed-heading links resolve    | `npm test` (`doc-links` checks anchors)                                          |
| `npm run words` passes           | `npm run words`                                                                  |

## Out of scope

Uses with another meaning stay: "frame" (JPEG, render), "tab" (GitHub, map Tabs), "kit" (`/design-kit`, UI kit), "screenshot" (PR), "DS.5" (Spec id), "the copy" (file copies).
