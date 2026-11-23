---
paths:
  - 'app/components/**'
  - 'app/Links.tsx'
  - 'lib/ui/EventGlyph.tsx'
  - 'features/people/components/FuzzyDateField.tsx'
  - 'features/people/components/PersonField.tsx'
  - 'features/map/components/DateField.tsx'
  - 'features/map/components/SearchBar.tsx'
  - 'features/map/components/ZoomControls.tsx'
  - 'features/map/components/LayersButton.tsx'
  - 'features/map/components/AddPinButton.tsx'
  - 'features/map/components/DateDock.tsx'
  - 'features/map/components/Legend.tsx'
  - 'features/map/components/CountMarker.tsx'
  - 'features/map/components/PinFan.tsx'
  - 'features/map/components/Panel.tsx'
  - 'features/map/components/LayerGroup.tsx'
  - 'features/map/components/FilterFields.tsx'
  - 'features/map/components/SourcesDialog.tsx'
  - 'features/map/components/Credits.tsx'
---

# Component patterns

| Pattern                                                                                                                                                                                                                      | Where                                                                                                                                                                                                                                                                                                     | Enforced by                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Components by role.** One folder per role: its components, their `.module.css` and `__tests__/`.                                                                                                                           | `app/components/`                                                                                                                                                                                                                                                                                         | ESLint `no-restricted-imports`; [components.md](../../design/topics/components.md#in-the-repo)                                       |
| **Variants are data attributes.** `data-size`, `data-state`, `data-form` select the look in the component's `*.module.css` (camelCase classes); a shared rule has its own module, which the component takes with `composes`. | `Button.tsx`, `foundation/focus.module.css`                                                                                                                                                                                                                                                               | Review                                                                                                                               |
| **Slots.** A frame places named boxes over the map, desktop and phone forms.                                                                                                                                                 | `app/components/layout/MapLayout.tsx`                                                                                                                                                                                                                                                                     | Review                                                                                                                               |
| **Navigation.** `LinkContext` sets the element; `Links` gives `next/link`.                                                                                                                                                   | `foundation/link.ts`, `app/Links.tsx`                                                                                                                                                                                                                                                                     | `link.test.tsx`                                                                                                                      |
| **Shared controls run on React 18 and 19.**                                                                                                                                                                                  | `app/components/{actions,feedback,forms,foundation,layout,overlays}/`, `DateField.tsx`, `FuzzyDateField.tsx`, `PersonField.tsx`, `{SearchBar,ZoomControls,LayersButton,AddPinButton,DateDock,Legend,CountMarker,PinFan,Panel,LayerGroup,FilterFields,SourcesDialog,Credits}.tsx`, `lib/ui/EventGlyph.tsx` | `lib/design/__tests__/{react-18.test.tsx,react-18-bundle.test.tsx,bundle.test.ts}` (each `.tsx` file is in `CONTROLS` or `EXCLUDED`) |
