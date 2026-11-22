---
paths:
  - '**/__tests__/**'
  - 'e2e/**'
  - 'vitest.config.mts'
  - 'playwright.config.ts'
---

## Test quality

- Write a test that can fail: no `toBeDefined()` where you know the value.
- Make an `include` pattern in `vitest.config.mts` match each test file.
- When a database adapter exists, test a behaviour on it, not only on the memory adapter.
- Use an existing fake, not a hand-rolled one.
- Tag the test of each shipped behaviour with its requirement (`// MAP-03`).
- Put a test of how a shared component looks in a gallery spec that `e2e/gallery.config.ts` lists.
- Put a test of how it behaves in the Vitest test of the component.
- Put a behaviour that jsdom cannot prove in an e2e spec on an app route.
- Put an e2e test that needs a fixture Account in `e2e/fixture-*.spec.ts`.
