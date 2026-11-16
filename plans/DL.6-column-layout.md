# Plan: DL.6: ColumnLayout: one page frame for the People screens

- **Spec:** #899
- **Requirement IDs:** [NFR-05](../docs/requirements.md#nfr-05)
- **Status:** approved

## Approach

`ColumnLayout` renders the frame that the six People components draw today: a `header` slot, a `<main>` that scrolls, the `children` and an optional `actions` slot that it wraps in `ActionBar`. `column` sets `data-column`, and one rule per value in its stylesheet copies today's width, gap, padding and phone background. `list` and `detail` take `var(--layout-list-width)`. Each People component keeps its own content rules (`.top`, `.empty`, the groups). The card shows each `column` value at 1440 wide, with a fixed state height (D3).

## Decisions

**D3 · How a card state bounds the frame height** · Decides: Tech lead

The frame is `height: 100dvh`. In a gallery file each of the six states is then 900px tall, and the card passes the 4000px limit of `checkPreview`. #923 and #924 say: "set it in the card and not in the component".

- **A.** `Card` gets an optional `frame` (px). `previewHtml` writes `.ks-case > :last-child { height: <frame>px; }`, which beats the one-class rule of the component. The card sets `frame: 480`.
- **B.** The frame reads `height: var(--column-layout-height, 100dvh)`, and the card sets the variable. The component holds a hook that only the card uses.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · Who writes the note of `layout.list-width`** · Decides: Tech lead

#913 (DL.12) says "DL.6 adds `layout.list-width` and writes its note", and counts 39 `layout` tokens. On `main`, `noteProblems` fails for a note on a `layout` token, because no `layout` token needs one yet.

- **A.** If #913 merged first, this Spec writes the note. If not, it writes none, and the build comments on #913 that its count becomes 40 and that DL.12 writes the note.
- **B.** This Spec waits for #913 (`gh issue edit 899 --add-blocked-by 913`).
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                                                     | New / changed | What                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------- |
| `app/components/layout/ColumnLayout.tsx`, `.module.css`                                                                  | New           | The frame; one phone query, as `breakpoint` says                                          |
| `app/components/layout/__tests__/ColumnLayout.test.tsx`                                                                  | New           | Slots; CSS per value at both sizes, read as `AuthLayout.test.tsx` reads its CSS (check 4) |
| `design/tokens.json`, `app/tokens.css`                                                                                   | Changed       | `layout.list-width: 960px`; `npm run tokens`                                              |
| `features/people/components/{PeopleList,PeopleLoading,PersonRelationships,PersonForm,PersonNotFound,EditOnComputer}.tsx` | Changed       | Use `ColumnLayout`                                                                        |
| Their `.module.css`, `PeoplePage.module.css`                                                                             | Changed       | Lose `.page`, `.main`, `.content`; `PeoplePage` keeps `.top` and `.empty`                 |
| `features/people/components/__tests__/*`                                                                                 | Changed       | Only a test that selects a removed class                                                  |
| `lib/design/types.ts`, `lib/design/cards.mts`                                                                            | Changed       | `Group` and `GROUPS` gain `Layout`; `PHONE_CARDS` gains `ColumnLayout`; `frame` (D3)      |
| `lib/design/states.mts`                                                                                                  | Changed       | The card: six states, `contain`, `width: 1440`                                            |
| `lib/design/bundle.mts`                                                                                                  | Changed       | `CONTROLS` gains `ColumnLayout`                                                           |
| `lib/design/__tests__/{react-18.test.tsx,bundle.test.ts,cards.test.ts}`                                                  | Changed       | Six cases; the `layout` folder; `frame`                                                   |
| `design/DESIGN.md`, `docs/architecture.md`                                                                               | Changed       | Behaviour item 8                                                                          |
| `design/tokens.json` `notes`                                                                                             | Changed       | Only as D4 says                                                                           |
| `.design-system/`, `design/canvas/project/ds/`, `canvas.json`, `VERSION`, `design/cards/ColumnLayout-{1440,390}.png`     | Changed       | Steps 2 to 6                                                                              |
| The eight boards of Behaviour item 7, their snapshots                                                                    | Changed       | Step 7                                                                                    |

## Order of work

1. Write `ColumnLayout.test.tsx`. See it fail on a CSS value.
2. Add the token, `ColumnLayout` and its stylesheet. Commit with the test.
3. Move the six components to `ColumnLayout`, in one commit. `PersonForm` puts its Dialog and Toast in `children`. Run `npm test`, `npm run e2e` and `npm run design:check`.
4. Add the card, `CONTROLS`, `PHONE_CARDS` and the React 18 cases. Run `npm run design-system` (step 2) and `npm run design:gallery`.
5. Update the docs. Push. Keep the PR a draft, and ask in it for steps 3 to 7.
6. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5 (`/publish-design-system`, "Updating the install", "Refreshing the canvas copy"). The session needs a signed-in account.
7. The tech lead runs Design: Render snapshots (step 6).
8. The same person or session swaps the eight boards with the [board swap prompt](../design/COMPONENTS.md#board-swap-prompt) and refreshes the canvas copy. The tech lead runs the workflow again (step 7).

## Risks

- A phone board can show no media query of a mounted component. Then that board keeps its frame, the PR names it, and the build files a Bug (check 10).
- Nobody published a card in a new group or at a stated width. If the Design System rejects `Layout` or the width, stop and comment on #893.
- The Dialog and Toast of `PersonForm` move into `main`. They are `position: fixed`, and `ColumnLayout` sets no `transform` or `contain`. The `person-*` entries of `npm run design:check` prove no pixel changed.
- The estimate is near the 600-line cap. If the diff passes it, follow the [too-big rule](README.md#too-big).

## Proof

| Acceptance check | Proven by                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1                | `npm run design:check`; `git diff main -- design/screens.json` is empty                                            |
| 2                | `e2e/widths.spec.ts`                                                                                               |
| 3                | `git grep -e 100dvh -e 960px -- 'features/people/components/*.css'` is empty                                       |
| 4                | `ColumnLayout.test.tsx`                                                                                            |
| 5                | `bundle.test.ts`, `react-18.test.tsx`                                                                              |
| 6                | `scripts/__tests__/design-system.test.ts`; line 1 of `.design-system/project/components/ColumnLayout/preview.html` |
| 7                | `git ls-files design/cards/ColumnLayout-*`                                                                         |
| 8                | The PR lists who ran each step                                                                                     |
| 9                | `sha256sum` of both trees in the PR                                                                                |
| 10               | The board files; the step 7 workflow run                                                                           |
| 11               | `npm test`, `npm run typecheck`, `npm run lint`                                                                    |

## Out of scope

As the Spec says. A `frame` for `SignInLayout` or `MapLayout`: #923 and #924.

## Deviations
