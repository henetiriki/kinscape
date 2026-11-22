---
paths:
  - 'data/**'
  - 'server/boundaries/app-data.ts'
  - 'app/data/polities/route.ts'
---

# Reference data patterns

| Pattern                                                                                                                      | Where                                                                  | Enforced by                   |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------- |
| **Reference data is files, validated.** `validate:boundaries` stops bad data; `/data/polities` is per request, 401 unsigned. | `data/`, `server/boundaries/app-data.ts`, `app/data/polities/route.ts` | `npm run validate:boundaries` |
