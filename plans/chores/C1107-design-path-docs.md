# Plan: C1107: The design docs agree on one design path, and DESIGN.md gives tokens and facts

- **Chore:** #1107
- **Requirement IDs:** None. The Chore changes docs, the workflow picture and two card bullet lists.
- **Status:** approved

## Approach

Edit the docs so that each states one design path: a design Spec that the tech lead's local Claude Code session draws. `design/CANVAS.md` holds the path in its intro. The other docs link to that intro. In `design/DESIGN.md`, a new section "In the repo" after "Screens" holds each repo-only line. `README_SECTIONS` does not list it, so the design system README loses those lines. The Components text then names tokens, not values. `lib/design/states.mts` gives the IconButton and TextLink cards their bullets. `AGENTS.md` and `.claude/skills/refine/spec.md` are hand-back paths, and steps 3 to 5 need a signed-in account, so the tech lead builds the plan in a local session.

### Text for the main items

- **Item 1, `CANVAS.md` intro:** a numbered list after the current two sentences:
  1. For a user-visible Intent, `/refine spec` slices a design Spec first.
  2. The tech lead starts a local Claude Code session. The session builds the design Spec with [Drawing a board](#drawing-a-board), then step 7 of [Changing the design system](#changing-the-design-system).
  3. Only a local Claude Code session edits the canvas.
- **Item 2:** "Refresh `canvas/` after an install update." The other two sentences stay.
- **Item 3, Design row:** "A user-visible Intent gets a design Spec. The tech lead's local Claude Code session draws its boards ([design path](../design/CANVAS.md)). A [workflow](../design/CANVAS.md#making-the-snapshots-and-jpgs) renders the JPGs." Who decides: Tech lead.
- **Item 6:** "[CANVAS.md](CANVAS.md) gives the path for a design. It also says how to refresh the canvas copy and make the snapshots and JPGs."
- **Item 11:** `AGENTS.md` names `design/source/*.html` as the workflow's output, then says "`design/source/kse-*.svg` and `design/source/fonts.css` are hand-kept sources." "Making the snapshots and JPGs" and "In the repo" get the same fact.
- **Item 18:** "Every control has the five states on its component card. The states are default, hover, focus, pressed and disabled." Then the two sentences of D2. The first sentence stays, because `lib/design/__tests__/system.test.ts` pins it.
- **Item 22:** "- For a user-visible Intent, slice a design Spec first ([design path](../../../design/CANVAS.md))."

### The workflow picture (item 4)

In both SVGs, make these changes:

- Remove the PO-lane Design `rect` and its text, the arrow `M240,222 V250` and the arrow `M312,286 H660`.
- Add the box `rect x=336 y=250 width=216 height=72`: "Design Spec", then "Tech lead's Claude session" and "draws the boards" on two lines.
- Draw Intent to "Draft the Spec" under the Chore box, at y 236.
- Draw "user-visible Intent" from the left edge of "Draft the Spec" to the new box, at y 270.
- Draw "boards merged" from the new box back to "Draft the Spec", at y 302.
- Move the Chore "ready-for-dev" label so that no arrow crosses it.

The `README.md` alt text replaces "the PO designs the screens and Claude drafts the Spec" with this text: "Claude drafts the Spec. For a user-visible Intent, Claude first slices a design Spec, and the tech lead's Claude session draws the boards. When the boards merge, Claude drafts the Spec."

## Decisions

**D5 · The disabled state in the Secondary button bullet** · Decides: Tech lead

Item 18 puts "A Button with an `href` has no disabled state" in the states paragraph. On `main`, the Secondary button bullet (`design/DESIGN.md:206`) already ends with "and it has no disabled state". The Button card shows that bullet. No related issue holds a value for it.

- **A.** Remove "and it has no disabled state" from the bullet. The fact then has one place, the states paragraph. The Button card loses the clause. One clause changes.
- **B.** Keep the bullet as it is. The fact is in two places. No cost.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                               | New / changed | What                                                                              |
| -------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------- |
| `design/CANVAS.md`                                                                                 | changed       | Items 1, 2 and 11                                                                 |
| `design/COMPONENTS.md`                                                                             | changed       | Items 7 to 10                                                                     |
| `design/DESIGN.md`                                                                                 | changed       | Items 6, 11 to 19; D5                                                             |
| `docs/how-we-work.md`                                                                              | changed       | Item 3                                                                            |
| `docs/architecture.md`                                                                             | changed       | Lines 9 and 33 link to `DESIGN.md#in-the-repo`                                    |
| `.claude/skills/refine/spec.md`                                                                    | changed       | Line 21 links to `#in-the-repo`; item 22                                          |
| `AGENTS.md`                                                                                        | changed       | Item 11                                                                           |
| `docs/media/workflow-light.svg`, `docs/media/workflow-dark.svg`                                    | changed       | Item 4                                                                            |
| `README.md`                                                                                        | changed       | Item 5                                                                            |
| `lib/design/states.mts`                                                                            | changed       | `design: ['Icon button']` for IconButton and `design: ['Text link']` for TextLink |
| `scripts/word-count.mts`, `scripts/__tests__/word-count.test.ts`                                   | changed       | Item 21, only for a doc that passes its budget                                    |
| `design/canvas/project/ds/kinscape/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION` | changed       | Steps 4 and 5                                                                     |

### `design/DESIGN.md` in detail

- **In the repo:** the folder table and its intro, the page rule, then one line each for these:
  - "Before you build Google sign-in, file an Intent issue."
  - "`npm run tokens` writes `tokens.json` to `app/tokens.css`."
  - "A media query can't read a variable, so a test checks each `layout` size against `breakpoint`."
  - "The workflow writes the `*.html` files in `design/source/`. `kse-*.svg` and `fonts.css` there are hand-kept sources."
  - "`EventGlyph` copies the paths of `design/source/kse-*.svg`, and a test keeps them in step."
- **Folder table:** `DateText` goes in `actions`, `PlacedAt` in `overlays`. One line after it names `features/map/components/`, `features/people/components/` and `lib/ui/`.
- **Type table:** each Style cell adds its key, such as "Mono M (`mono-m`)". Five rows follow the `tokens.json` order:
  - Credits: 11 / 16 · 400, `--credits`. Credits line and scale bar.
  - Chip: 13.5 / 20 · 600. Chip that is on.
  - Chip off: 13.5 / 20 · 400. Chip that is off.
  - Link: 15 / 22 · 500. Links in running text.
  - Link S: 13 / 20 · 500. Links in helper text and footnotes.
- **Map style:** "Pins: `map.pin`, with its `halo` ring" and "Quiet labels: `map.muted-label`".
- **Shape and depth:** remove the Radius and Shadow rows. Add before the table: "The `radius` and `shadow` notes in `tokens.json` say where each value goes."
- **Item 13:** the eight bullets of the item name `type.label`, `type.title`, `type.caption`, `type.credits`, `radius.panel` and `radius.control`.

## Order of work

1. Edit the docs, the SVGs and `states.mts` (step 1 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system)). Open both SVGs in a browser, and check that no arrow crosses a box or a label.
2. Run `npm run words` once. If a doc passes its budget, raise it to the next multiple of 50, with its pin.
3. Run `npm run design-system` (step 2). Search `.design-system/project/README.md` for the four strings of done check 6.
4. The tech lead, or the local session that the tech lead starts, runs steps 3 to 5. The session needs a signed-in account:
   - `/publish-design-system`, 3.1 to 3.11 (step 3).
   - "Updating the install", 4.1 to 4.6 (step 4).
   - "Refreshing the canvas copy", 5.1 to 5.5 (step 5).
5. No board shows the change. Push the branch. The tech lead runs the workflow Design: Render snapshots (step 6).
6. Run the checks in `AGENTS.md` › Commands.

## Risks

- **A local step 5.4 rewrites snapshots.** In C1096, local text widths changed 47 sources. If 5.4 does not print "No snapshot changed", discard the sources (5.5), and stop for the tech lead: done check 13 then fails.
- **A merge of #863 or #539.** Both edit `design/DESIGN.md`. If one merges first, run steps 3 to 5 again after the merge of `main`.
- **A broken link.** Three links move to `#in-the-repo`. `scripts/__tests__/doc-links.test.ts` fails on a missing anchor.

## Proof

| Acceptance check                                                          | Proven by                                                     |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1, 2: the CANVAS intro, the refresh case, the Design row, no "PO designs" | `git grep -n "PO designs" -- docs design README.md` in the PR |
| 3: the SVG boxes, arrows and alt text                                     | Review of both SVGs and `README.md`                           |
| 4: `COMPONENTS.md` steps                                                  | Review of the diff                                            |
| 5: `kse-*.svg` and `fonts.css` as hand-kept                               | `git grep -n "fonts.css" -- AGENTS.md design/*.md`            |
| 6: no repo-only line in the README                                        | The step 3 search, pasted in the PR                           |
| 7: the links open "In the repo"                                           | `doc-links.test.ts`; review                                   |
| 8: no raw values in three sections                                        | A `git grep` of the six strings in the PR                     |
| 9: each `type` and `map` key in a table                                   | Review against `design/tokens.json`                           |
| 10: the IconButton and TextLink bullets                                   | The card READMEs from `npm run design-system`                 |
| 11: steps 2 to 6 ran, no board changed                                    | The step commits; the workflow run link                       |
| 12: the sha256 match                                                      | The step 4.6 report                                           |
| 13: "No snapshot changed"                                                 | The step 5.4 output                                           |
| 14: the checks pass                                                       | The PR Evidence                                               |
| 15: the design Spec bullet                                                | Review of `spec.md`                                           |

## Out of scope

- The "Used for" text of the current type rows, such as "Credits, footnotes" for Caption.
- The `tokens.json` notes.
- The loop line in `docs/how-we-work.md`: it still names a Design stage.
