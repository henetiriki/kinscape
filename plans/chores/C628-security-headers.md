# Plan: C628: Security headers

- **Chore:** #628
- **Requirement IDs:** [NFR-03](../../docs/requirements.md#nfr-03)
- **Status:** approved

## Approach

`next.config.ts` exports `securityHeaders(isDev)` and sends them with `X-Robots-Tag` on every response; `poweredByHeader: false`. CSP: `default-src 'self'; script-src 'self' 'unsafe-inline'` (plus `'unsafe-eval'` in development); `style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`. Also `Referrer-Policy: same-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. The app calls no other host.

## Decisions

**D1 · Inline scripts** · Decides: Tech lead

- **A.** `script-src 'self' 'unsafe-inline'` now; a nonce via `proxy.ts` later.
- ~~**B.** A nonce via `proxy.ts` now.~~

**Answer: A** (@henetiriki)

**D2 · Extra directives from Next's guide** · Decides: Tech lead

- **A.** Add `object-src 'none'; base-uri 'self'; form-action 'self'`.
- ~~**B.** Only the listed directives.~~

**Answer: A** (@henetiriki)

**D3 · The Vercel Toolbar on previews** · Decides: Tech lead

- **A.** On Preview only, allow the toolbar's sources from Vercel's docs (`vercel.live`, `vercel.com`, `assets.vercel.com`, `ws-us3.pusher.com`).
- ~~**B.** Turn the toolbar off.~~

**Answer: A** (@henetiriki)

## Files that change

| File                                              | What                                                 |
| ------------------------------------------------- | ---------------------------------------------------- |
| `next.config.ts`, `__tests__/next-config.test.ts` | Headers; development CSP; `poweredByHeader`          |
| `e2e/gate.spec.mts`                               | `/sign-in` carries each header and no `X-Powered-By` |
| `e2e/smoke.spec.ts`                               | The map renders with no CSP violation                |

## Risks

- A MapLibre worker or image is blocked: the smoke e2e fails and names the directive.

## Proof

| Acceptance check             | Proven by             |
| ---------------------------- | --------------------- |
| The config sends each header | `next-config.test.ts` |
| `/sign-in` carries them      | `e2e/gate.spec.mts`   |
| The map still renders        | `e2e/smoke.spec.ts`   |

## Deviations

- D3 added in review: `securityHeaders({ dev, preview })` adds the toolbar's sources when `VERCEL_ENV` is `preview`.
