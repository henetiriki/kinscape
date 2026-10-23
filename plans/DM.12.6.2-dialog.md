# Plan: DM.12.6.2: Dialog, Sources dialog and phone sheet headers

- **Spec:** #197 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06, NFR-08
- **Status:** approved

## Approach

- **Modal:** Sheet's native `<dialog>` code (`showModal`, scrim click, `onClose`) as a base for Sheet and Dialog.
- **Dialog:** `title`, `subtitle`, `footnote`, children. `DialogPanel` draws it on Surface `modal`; `form` forces `centred` or `sheet` for the kit, else the phone query picks. Close is first in tab order, so takes focus. The body scrolls under a fixed head.
- **Sheet:** `{ title, subtitle? } | { tabs }`. `SheetPanel` draws handle and head. Tabs gains `fill`: tabs share the row, 44 tall.
- **Sources dialog:** on Dialog. MapShell passes `open` instead of mounting it.
- **Kit:** `/design-kit/surfaces` gets Dialog after Progress bar (part 1) and the sheet headers before Callout (part 2).

## Decisions

**D1 · What the Sources dialog says** · Decides: PO

Board 07 adds a subtitle, a footnote and the column name "Checked".

- **A.** The board's words. Each source keeps its author and processing under the title.
- **B.** Today's: title and table only.

Recommended: A, because the board is the approved design.

**Answer: A** (@henetiriki)

**D2 · Table on desktop, list on a phone** · Decides: Tech lead

- **A.** A `<table>` and a `<ul>`; CSS shows one. Each link is in the DOM twice.
- **B.** One table that CSS restacks; on a phone it still reads as a table.

Recommended: A, because each width gets the semantics board 07 asks for.

**Answer: A** (@henetiriki)

**D3 · Kit Dialog content** · Decides: Tech lead

- **A.** The real sources from `data/sources.json`.
- **B.** Board 07's seven placeholder rows.

Recommended: A, so the kit invents no layers. The design check differs only in row text.

**Answer: A** (@henetiriki)

**D4 · Name of a sheet with a Tabs header** · Decides: Tech lead

- **A.** The Tabs' `label`, e.g. "Layers and filters".
- **B.** The selected tab's label.

Recommended: A, because the name stays the same as tabs switch.

**Answer: A** (@henetiriki)

**D5 · Short, wide windows** · Decides: Tech lead

- **A.** The sheet form applies below 640 wide or below 500 tall (the kit's phone rule, Intent 104). The Spec's Dialog line is reworded to say so.
- **B.** Width only, as the Spec says.

Recommended: A, because a centred dialog is cramped below 500 tall.

**Answer: A** (@henetiriki)

## Files that change

| File                                            | New / changed | What                                  |
| ----------------------------------------------- | ------------- | ------------------------------------- |
| `app/components/Modal.tsx`                      | New           | Native dialog base                    |
| `app/components/Dialog.tsx`, `.module.css`      | New           | Dialog, `DialogPanel`                 |
| `app/components/Sheet.tsx`, `.module.css`       | Changed       | Onto Modal; three heads; `SheetPanel` |
| `app/components/` Tabs, SourcesDialog, MapShell | Changed       | `fill`; onto Dialog; `open`           |
| `app/components/__tests__/*`                    | New / changed | A test per component                  |
| `app/design-kit/surfaces/` sections and test    | Changed       | Two sections                          |
| `design/screens.json`                           | Changed       | Phone part 1, height 7380             |
| `e2e/dialog.spec.ts`                            | New           | 1280 and 390                          |

## Order of work

1. Modal, then Sheet on it, with tests.
2. Tabs `fill`, the three heads, then Dialog.
3. Sources dialog and MapShell.
4. Kit sections, `screens.json` and e2e. Then the AGENTS.md checks and the design check.

## Risks

- Needs DM.12.6.1 (#200: plan approved, not built). The build rebases on `main` once it merges.
- The kit menu's Sheet head changes size, so `design-kit-menu-phone` may score differently. The PR shows both scores.

## Proof

| Acceptance check            | Proven by                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| 1280: centred, modal, focus | e2e: centred, 760 wide, `:modal`, Close focused; Esc closes and focuses Attributions        |
| Scrim closes                | e2e corner click; `Modal.test.tsx`                                                          |
| 390: sheet, rows, Close     | e2e: at the bottom edge; handle and list shown, table hidden; Close in view after scrolling |
| Same sources and links      | `SourcesDialog.test.tsx`: each title and licence `href`; `smoke.spec.ts` unchanged          |
| Three headers               | `Sheet.test.tsx`: Close in each; click and arrow switch the tab                             |
| Kit variants in order       | Page test of section and variant order; design check scores in the PR                       |
| `screens.json` entry        | The design check runs it                                                                    |
| Tests, e2e, build, coverage | Their output in the PR                                                                      |
