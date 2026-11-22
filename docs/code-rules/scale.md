---
paths:
  - 'server/**'
  - 'app/data/**'
  - 'app/**/route.ts'
---

## Scale

On a request path, calculate the number at M4 scale (about 1,640 Boundary versions; Pins as sized in `docs/requirements.md` NFRs). Do not:

- parse or load reference data per request without a memo;
- loop in a nested or pairwise way over Boundary versions or Pins;
- return a response that grows with the Tree with no pagination or cap.
