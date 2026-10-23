# Plan: DM.12.6.3: Menu, Avatar and Popup

- **Spec:** #198 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** draft

## Approach

- **Avatar:** a 44 round brand button with an initial; `state` and `expanded` draw the kit's looks.
- **Menu:** the Avatar, and `MenuPanel` 8 below it, right-aligned (`map-account-menu`). Item groups, split by dividers. Per the menu-button pattern: opening focuses the first item; arrows wrap; a `disabled` item is `aria-disabled`; activating focuses the Avatar, closes, then runs `onSelect`; Tab or an outside click closes.
- **Popup:** `form` `floating` (non-modal dialog; Esc and Close call `onClose`) or `sheet` (a region; no Close, Copy chain or inset). A pin with `href` is a TextLink. The caller places `PopupPointer`, as with `CalloutPointer`.
- **Kit:** Menu and Popup before Callout, in part 2. `Matrix` takes `columns` and inert rows; `Variant` gains `desktop`, so a phone shows only the sheet Popup, as its board does.

## Decisions

**D1 · Size** · Decides: Tech lead

About 1,300 changed lines; the cap is 600. DM.12.6.1 and DM.12.6.2 merged at 1,400.

- **A.** One PR.
- **B.** Split: Menu and Avatar here; Popup and `screens.json` in a new Spec.

Recommended: B, as rule 7 asks.

**D2 · What Copy chain copies** · Decides: PO

- **A.** A line per level, smallest first: `District: Kimberley`, `Colony: Cape Colony (Was Griqualand West until 1880)`.
- **B.** Names on one line: `Kimberley, Cape Colony`.

Recommended: A, because the level says what each name was.

**D3 · When copying fails** · Decides: PO

Nothing draws this.

- **A.** Board 05's error Toast: "Couldn't copy the chain." with Try again.
- **B.** Nothing shows.

Recommended: A, or the user pastes old text.

**D4 · A popup with no pins** · Decides: PO

- **A.** No pins box.
- **B.** A "No pins here" line.

Recommended: A, because the chain is the answer.

**D5 · Esc in a Menu inside a Dialog** · Decides: Tech lead

- **A.** The Menu cancels the key and closes; a second Esc closes the Dialog.
- **B.** Esc closes both.

Recommended: A: innermost first, as popovers do.

**D6 · Who shows the Copy chain Toast** · Decides: Tech lead

- **A.** Popup calls `onCopied(ok)`; the caller shows it, as the screen places Toasts.
- **B.** Popup renders it.

Recommended: A.

**D7 · The kit's live Menu** · Decides: Tech lead

A `menuitem` is valid only in a `menu`.

- **A.** The drawn menu and item states are inert looks. The Avatar's Default cell opens a live Menu with the board's items; Sources and attributions opens the Sources dialog, the others only close.
- **B.** As A, but every item only closes.

Recommended: A, so e2e sees the second item activate.

## Files that change

| File                                               | New / changed | What                                   |
| -------------------------------------------------- | ------------- | -------------------------------------- |
| `app/components/` Avatar, Menu, Popup              | New           | Components, CSS, tests                 |
| `app/design-kit/inputs/Board.tsx`                  | Changed       | `columns`, inert rows, `desktop`       |
| `app/design-kit/surfaces/` sections, samples, page | Changed / new | Two sections; client samples; test     |
| `design/screens.json`                              | Changed       | Desktop 1440 × 7892; part 2 390 × 6712 |
| `e2e/menu-popup.spec.ts`                           | New           | 1440 and 390                           |

## Order of work

1. Avatar and Menu, with tests.
2. Popup, with tests.
3. Kit, `screens.json`, e2e, then the checks.

## Risks

- jsdom has no dialog `cancel`, so a unit test proves D5 by the cancelled keydown.

## Proof

| Acceptance check        | Proven by                                                       |
| ----------------------- | --------------------------------------------------------------- |
| Every variant, in order | Page test; design check scores in the PR                        |
| Down, Enter; Esc; Tab   | e2e: Sources dialog opens; Avatar focused; focus leaves, closed |
| Pin link or text; `ol`  | `Popup.test.tsx`                                                |
| Copy chain              | e2e: clipboard text and success Toast                           |
| 44 × 44 hit areas       | e2e: a point 21px from each centre hits the button              |
| `screens.json`          | The design check runs them                                      |
| Tests, e2e, build       | Their output in the PR                                          |

## Out of scope

- Focus when a Popup opens or closes (MAP-07).
