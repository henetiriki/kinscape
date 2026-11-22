---
paths:
  - 'app/screens/**'
  - 'e2e/design-check.spec.ts'
---

# Dev screen patterns

| Pattern                                                                                                                    | Where                                      | Enforced by                                                                     |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| **Dev screens.** `/screens`: screens in `SCREEN_ONLY` until retired; 404 outside Preview/development (`requireDevPage()`). | `app/screens/`, `e2e/design-check.spec.ts` | `npm run design:check`; `/match-design`; `lib/design/__tests__/screens.test.ts` |
