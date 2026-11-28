# Plan: SC.11.1: Boards write each size as a token

- **Spec:** #1205
- **Requirement IDs:** none. The Spec changes no look.
- **Status:** approved

## Approach

The work has two parts. The CI build changes the code: the token file, the `$deprecated` support, the exporter and their tests. A local session then edits the boards from the [board prompt](#the-board-prompt), as step 7 of [Changing the design system](../design/CANVAS.md#changing-the-design-system) says. The exporter change comes first, because the board edits need it to export `var(--type-*)` (Spec D10).

For D10 B, `inlineStyles` reads each custom property of the bundle's `:root` rules before it removes the bundle. It then adds a `<style data-root>` with each name that has no value on `:root` without the bundle. `pageHtml` removes that element after it replaces each `var()`. Only names that the linked `tokens.css` does not give are added, so no `var()` that a board holds today changes its value.

### The mapping

A board value takes a token as the Spec's Behaviour bullet 1 and D4 say. `rulesFor` sets the group.

| Property                                                    | Token                                                                                                       |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `font-size`, `line-height`, `font-weight`, `letter-spacing` | `--type-<role>-size`, `-line`, `-weight`, `-tracking` of the text role that the element draws               |
| `padding*`, `top`, `right`, `bottom`, `left`, `inset`       | `--space-inset-*`                                                                                           |
| a negative margin                                           | `--space-inset-*`                                                                                           |
| `gap`, `row-gap`, `column-gap`, `margin-left/right/inline*` | `--space-gap-*`                                                                                             |
| `margin-top`, `margin-bottom`                               | `--space-stack-*`                                                                                           |
| `width`, `height`, `min-*`, `max-*`                         | the `--size-*` token of the part, for example `--size-control` for a control, `--size-touch` for a hit area |
| `border-radius`                                             | the `--radius-*` token of the part                                                                          |
| `border*` width, `outline`, `outline-offset`                | `--border-*` or `--focus-*`                                                                                 |
| `z-index`, `opacity`, `transition`, `transform`             | `--z-*`, a `map` opacity, `--motion-*`                                                                      |

| `space-N` | 4     | 8    | 12  | 16  | 20  | 24   | 32    | 40    | 48    | 64    |
| --------- | ----- | ---- | --- | --- | --- | ---- | ----- | ----- | ----- | ----- |
| Suffix    | `2xs` | `xs` | `s` | `m` | `l` | `xl` | `2xl` | `3xl` | `4xl` | `5xl` |

On `main`, each board `var(--space-N)` has a name in its role at its value, once the `gap` role gets `2xl` (D7).

### The board prompt

```text
Follow design/CANVAS.md › Changing the design system, step 7, for each board in design/canvas/project/.
Use plans/SC.11.1-board-size-tokens.md › The mapping, and #1205 › Behaviour.
In each inline style and each data-dc-script style, change a size to var(--token) if its part has a token with the same value at a 16px root.
Change each var(--space-N) to its purpose name.
Keep map drawing values, colours, shadows and SVG size attributes.
Change no layout, word or part. Edit no <style> block.
List each kept value with its board, except colours and SVG size attributes.
```

## Decisions

**D12 · How the PR proves checks 1 and 2** · Decides: Tech lead

Check 1 compares the snapshots before and after, with rem as px at a 16px root. Check 2 says that each value with a token of its part is a `var()`. #1209 (SC.15) builds the lasting check: the exporter fails a board size that is not a `var()`.

- **A.** The local session runs a one-time compare of `git diff origin/main -- design/source/` and a one-time scan of the boards with `rulesFor`. It pastes both results in the PR Evidence. It commits no script. Cost: none in the diff.
- **B.** A new Vitest test reads each board's `style` attributes with `rulesFor` and fails a literal that equals a token of its group. Cost: about 80 lines. #1209 then replaces it.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- **Keep each `:root` name of the bundle (D10 B).** Rejected: the bundle copies `app/tokens.css`. A name in both files could then take the bundle's value, and a snapshot could change (check 1).
- **A local session builds the code too.** Rejected: only the board edits and steps 3 to 5 and 7 need claude.ai.

## Files that change

| File                                                                                                                 | New / changed | What                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `design/kinscape.tokens.json`                                                                                        | changed       | The ten `space-N` tokens go. `space.gap.2xl` is `{scale.space.700}` (32px), with a `$description` (D7).                          |
| `app/tokens.css`, `design/tokens.generated.ts`                                                                       | changed       | `npm run tokens` drops `space-N` and adds `space-gap-2xl`.                                                                       |
| `lib/design/system.mts`                                                                                              | changed       | `isDeprecated`, `deprecatedTokens`, the `deprecated` parameter of `systemCss` and the deprecated `:root` block go (D6).          |
| `lib/design/types.ts`                                                                                                | changed       | `$deprecated` goes from `DtcgToken`.                                                                                             |
| `scripts/design-system.mts`                                                                                          | changed       | It passes no deprecated list to `systemCss`.                                                                                     |
| `lib/design/__tests__/system.test.ts`                                                                                | changed       | The `deprecatedTokens` tests and the two deprecated-block tests go. The filter on line 82 drops `$deprecated`. The count is 198. |
| `lib/design/__tests__/design.test.ts`                                                                                | changed       | The `space-N` test becomes: `space` holds only `inset`, `gap` and `stack`, and `space.gap.2xl` is 32px.                          |
| `scripts/design-export.mts`                                                                                          | changed       | `inlineStyles` keeps the bundle's `:root` names that `:root` lacks in `<style data-root>`. `pageHtml` removes it (D10).          |
| `scripts/__tests__/design-export.test.ts`                                                                            | changed       | New tests: `inlineStyles` keeps only a missing `:root` name, and `pageHtml` writes its value and removes the element.            |
| `e2e/design-export.spec.mts`                                                                                         | changed       | A board with `font-size: var(--type-body-size)` exports, and the snapshot holds `0.9375rem` (check 11).                          |
| `design/topics/tokens.md`                                                                                            | changed       | › Names drops "A `space-N` token is deprecated."                                                                                 |
| `design/canvas/project/*.dc.html`                                                                                    | changed       | The local session edits each board ([The board prompt](#the-board-prompt)).                                                      |
| `.design-system/project/`, `design/canvas/project/ds/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION` | changed       | The design system steps write them.                                                                                              |
| `design/source/`, `design/*.jpg`                                                                                     | changed       | The workflow Design: Render snapshots writes them.                                                                               |

## Order of work

1. Write the `design-export.test.ts` tests. See them fail. Change `scripts/design-export.mts`. Add the e2e test.
2. Edit `design/kinscape.tokens.json`. Run `npm run tokens`.
3. Remove the `$deprecated` support and its tests. Edit `design.test.ts` and `tokens.md`.
4. Step 2: run `npm run design-system`.
5. Run the checks in AGENTS.md › Commands.
6. Steps 3 to 5: the tech lead runs them, or a local Claude Code session that the tech lead starts. The session needs a signed-in account. The CI build asks for them in the PR and keeps the PR a draft.
7. Step 7: the same session edits the boards from [The board prompt](#the-board-prompt). It runs `npm run design:export`, publishes the boards, compares the sha256 and commits `design/canvas/`. Then it runs the workflow Design: Render snapshots once.
8. The session proves checks 1 and 2 as D12 says. It writes the kept values and the kept shadows in the PR body, by board.

## Risks

- **The `design` job fails between steps 2 and 7.** The boards still hold `var(--space-N)`, and `:root` no longer has them. The PR stays a draft until step 7.
- **A board edit changes the look.** The compare of check 1 names each snapshot that differs after rem to px. The session fixes the board before it publishes.
- **A local export differs from the workflow.** The workflow in the pinned image is the proof (`design/CANVAS.md`).
- **#1206 merges first.** Its role renames then reach the boards before this PR. The session uses the new role names.

## Proof

| Acceptance check                                           | Proven by                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| 1. The snapshots match at a 16px root                      | The compare of D12, in the PR Evidence, on the workflow's snapshots |
| 2. Each size with a token of its part is a `var()`         | The scan of D12, in the PR Evidence                                 |
| 3. No `var(--space-[0-9]` outside `plans/`                 | `git grep` in the PR Evidence                                       |
| 4. No `space-N` token                                      | `design.test.ts`                                                    |
| 5. The PR lists each kept value                            | The PR body                                                         |
| 6. The checks pass                                         | CI, and the pasted output                                           |
| 7. Steps 2 to 7 are done                                   | The commits of steps 2 to 5 and 7, and the workflow run             |
| 8. The canvas copy matches `.design-system/project/`       | The sha256 compare of step 5                                        |
| 9. No `$deprecated` in `lib/` and `scripts/`               | `git grep` in the PR Evidence                                       |
| 10. `space.gap.2xl` is 32px, and the two gaps use it       | `design.test.ts`; `git grep space-gap-2xl` in the PR Evidence       |
| 11. A board `var(--type-body-size)` exports with its value | `design-export.test.ts`; `e2e/design-export.spec.mts`               |

## Out of scope

- The exporter check that fails a board size with no token, and the `data-own` reasons: SC.15 (#1209).
- The `:focus-visible` rule on the three Map boards (D5): SC.15.
- New scale values: SC.12 to SC.14.

## Deviations

- Big: The CI build did not edit the boards or run steps 3 to 5 and 7. They need claude.ai. The boards still hold `var(--space-N)`, so the `design` job fails until step 7.
- `.design-system/` is gitignored, so step 4 commits no file.
- Big: `Map-style.dc.html` and `Map-style-phone.dc.html` link no design system, so no `var()` resolves on them. They keep their literals (check 2). A later Chore adds the link.
- Big: The workflow snapshots of `map-desktop`, `map-desktop-filters` and `map-phone` write some literal colours as the board spells them, not as `rgb()` (check 1). Their sizes and JPGs are the same.
- A one-off script made the board edits. It keeps a size literal where no token names the part (D4). The PR lists each one.
