---
paths:
  - 'docker/*/Dockerfile'
---

# CI image patterns

| Pattern                                                                                                        | Where                       | Enforced by                                                         |
| -------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------- |
| **CI images are Dockerfiles.** Each CI image is the one `FROM` line of its Dockerfile, which Dependabot reads. | `docker/<image>/Dockerfile` | `scripts/__tests__/playwright-image.test.ts`, `ci-postgres.test.ts` |
