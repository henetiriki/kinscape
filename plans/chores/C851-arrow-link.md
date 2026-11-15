# Plan: C851: Make "Edit" with an arrow a shared component

- **Spec:** #851
- **Status:** approved

## Approach

`ArrowLink` shows a text and the `forward` icon. With `href` it is a `KitLink` with the focus ring and the hover and pressed colours. Without `href` it is a `span`, and its module makes it `--brand-pressed` inside a pressed `a`. `RelationshipRow` keeps its `.hidden` composes.

## Decisions

**D1 · Where the kit shows the ArrowLink states** · Decides: Tech lead

Each kit page must match a board snapshot, and no board draws `ArrowLink`.

- **A.** A row on `/design-kit/states`. The design agent adds it to `SG-Controls.dc.html` and `SG-Controls-phone.dc.html`.
- **B.** A section on `/design-kit/inputs?part=3`, on `SG-Inputs-3.dc.html`.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                  | New / changed | What              |
| ------------------------------------------------------------------------------------- | ------------- | ----------------- |
| `app/components/actions/ArrowLink.tsx`, its module and test                           | New           | The component     |
| `PersonRow`, `RelationshipRow`: each file and test                                    | Changed       | Use `ArrowLink`   |
| `lib/design/bundle.mts`, `lib/design/states.mts`, `design/DESIGN.md`, the D1 kit page | Changed       | Add the component |
| `AGENTS.md`, `.claude/skills/refine/spec.md`, `plans/README.md`, `docs/code-rules.md` | Changed       | The rule          |
| The tests that count the controls, the kit page test, `design/screens.json`           | Changed       | New counts, sizes |

## Order of work

1. Build the component, the rows, the kit and the docs.
2. Run steps 2 to 9 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system). The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5 and 8. In step 7, the design agent draws the D1 boards. No board draws the component by hand, so no board gets a swap.
3. Run the two searches. File one follow-up issue.

## Risks

- The pressed colour of the label moves to the component module. The row tests and `npm run design:check` catch a pixel change.

## Proof

| Acceptance check         | Proven by                          |
| ------------------------ | ---------------------------------- |
| Rows, kit, coverage      | `npm test`; `npm run design:check` |
| Design system and export | Step 4.6; `npm run design:export`  |
| The rule                 | `npm run words`                    |

## Deviations

- The kit row shows the label in the Disabled column, because a link has no disabled state.
- **D2 · A label with link attributes:** the tech lead chose a union type. A label takes `children` only.
- **D3 · Who owns the rule:** the tech lead chose `plans/README.md`. `AGENTS.md`, `spec.md` and `code-rules.md` link to it. `spec.md` links to the page rule in `DESIGN.md`.
- **D4 · The `spec.md` cuts:** the tech lead chose to restore "Say which comes first and why." and "say". The cuts "The PO already approved it." and "Discuss slice size only here." stay, to keep the budget.
- Step 3: the searches ran. [#854](https://github.com/henetiriki/kinscape/issues/854) is the follow-up issue.
- The CI `design` job ran `npm run design:check` and `npm run design:export` on the render commit, and passed.
