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

- The tests that count or list the controls change for the new component: `lib/design/__tests__/`, `scripts/__tests__/design-system.test.ts` and `app/components/__tests__/hover.test.ts`.
- The kit row shows the label in the Disabled column, because a link has no disabled state.
- `AGENTS.md` and `.claude/skills/refine/spec.md` lose filler words to stay in budget.
