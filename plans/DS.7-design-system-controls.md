# Plan: DS.7: The shared controls in the design system

- **Spec:** #450
- **Requirement IDs:** None (design tooling)
- **Status:** approved

## Approach

`scripts/design-system.mts` writes `components/<Name>/README.md` and `preview.html` per control. The TypeScript program it builds for `index.d.ts` gives each control's JSDoc and props to pure helpers in a new `lib/design/cards.mts`: `controlReadme` and `previewHtml` (line 1, a root, one script mounting each state in a new `lib/design/states.mts`). The namespace and bundle file names become constants in `bundle.mts`; `readme()` builds its canvas section from them.
The five summaries (D3 on #450):

- `Button`: "An action: primary for the one main action in a view, secondary for the rest."
- `IconButton`: "An action shown only as an icon, such as zoom, close or step, named by its `label`."
- `Chip`: "A pill that turns one filter on or off, such as an Event type."
- `Tabs`: "A row of tabs that switches panels, such as Layers and Filters."
- `Checkbox`: "A checkbox with no label of its own: name it with `aria-label`, or use `CheckboxField`."

## Decisions

**D1 · Where the preview states come from** · Decides: Tech lead

`CASES` (`react-18.test.tsx`) holds the states as JSX, which a script can't use.

- **A.** `states.mts` lists each control's states as props, labelled as in `CASES`; handlers get a no-op. A test fails if the labels differ from `CASES`.
- **B.** As A, and `CASES` is built from `states.mts`: about 250 more changed lines, past the cap.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Which props the table lists** · Decides: Tech lead

Six controls also take their HTML element's attributes.

- **A.** The props declared in the repo, then a line saying the rest go to the element.
- **B.** All of them, about 300 rows each.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Which `DESIGN.md` bullets each control takes** · Decides: Tech lead

- **A.** By name: `Button` takes Buttons, Primary button and Secondary button; `TextField`, `Segmented`, `Chip`, `Tabs`, `Alert` and `Toast` their one. A missing bullet fails the build.
- **B.** As A, but `Button` takes only Buttons.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                | New / changed | What                                                    |
| --------------------------------------------------- | ------------- | ------------------------------------------------------- |
| `app/components/{actions,forms}/` (five controls)   | changed       | The summaries above                                     |
| `lib/design/bundle.mts`                             | changed       | `NAMESPACE`, bundle file names                          |
| `lib/design/states.mts`                             | new           | Each control's group, height, bullets, states (D1, D3)  |
| `lib/design/cards.mts`, `__tests__/cards.test.ts`   | new           | README, preview, checks                                 |
| `lib/design/system.mts`, `__tests__/system.test.ts` | changed       | `readme()` appends the canvas section                   |
| `scripts/design-system.mts`                         | changed       | Docs and props from the program; writes 24 files        |
| `scripts/__tests__/design-system.test.ts`           | changed       | The 24 files, line 1, no links, sizes                   |
| `lib/design/__tests__/react-18.test.tsx`            | changed       | Mounts each preview from the bundle; labels match CASES |
| `design/canvas/project/ds/kinscape/**`              | changed       | The tech lead's refreshed copy                          |

## Order of work

1. Tests first: `cards.mts`, `states.mts`, `readme()`, the script.
2. Preview tests, then summaries.
3. The checks in `AGENTS.md`.
4. The tech lead, signed in: publish, update the install, refresh the copy, `design:export`, Evidence.

## Risks

- Only a publish shows whether the type accepts the cards.

## Proof

| Acceptance check                                       | Proven by                                       |
| ------------------------------------------------------ | ----------------------------------------------- |
| Each control has a card with a live preview and README | Publish output and a screenshot                 |
| Each preview renders; line 1; links nothing            | `react-18.test.tsx` › previews, `cards.test.ts` |
| Each README under 64 KB, summary first                 | `design-system.test.ts`, `cards.test.ts`        |
| Canvas holds the bundle; `design/source/` unchanged    | The refreshed copy; `design:export` output      |
| Lint, `format:check`, `words`, tests, e2e              | Output pasted in the PR                         |

## Deviations

- The new types live in `lib/design/types.ts` (lint rule); `states.mts` also holds each card's `pad`.
- Each `preview.html` is a complete document, as the Type format says.
- A README names each form's required props for a union (`Button`); `Docs.forms` carries them.
- Coverage excludes `design/canvas/**` (the published `bundle.js`, which no test imports).
- About 1,100 lines, past the 600-line cap (rule 7); @henetiriki chose one PR.

## Out of scope

- Boards and exporter support: DS.8.
- The publish skill's description (code-owner path).
