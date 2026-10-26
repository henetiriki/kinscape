# Plan: B289: 1910 province borders don't follow rivers where a river is the border

- **Spec:** #289
- **Requirement IDs:** BND-01, BND-06, BND-07, NFR-08
- **Status:** approved

## Approach

In the `map:prepare` run, drop afrith's Orange Free State, erase Natural Earth's v4.1.0 Free State (the 1994 file's shape) from the other three, and merge it in as the Orange Free State. The existing 300 km² gap fill closes the slivers afrith's larger Free State leaves. `boundaryVersions` gives that version the `natural-earth-admin-1-v4` source (D1). D2 sets the outer edge. A new data test measures, as the issue did, how many shared border vertices lie within 0.5 km of each river.

## Decisions

**D1 · Source of the 1910 Orange Free State** · Decides: Tech lead

Replaces M1.4's source for one Polity.

- **A.** Natural Earth v4.1.0, as in the 1994 file: the issue's scratch run put 155 of 193 Vaal and 102 of 106 Orange vertices within 0.5 km, and the 1994 shift goes. afrith's README says its Free State follows the current lines anyway.
- **B.** Keep afrith's and close the bug as a known departure in `processing`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Outer edge on the Limpopo, lower Orange and Marico** · Decides: Tech lead

- **A.** Leave afrith's edge; record it in `processing`.
- **B.** Clip to Natural Earth's South Africa outline, as the 1994 file is, keeping afrith's Walvis Bay part (M1.8 D2). Slivers between afrith's edge and the outline join the province they touch.
- **C.** As B, but Walvis Bay is dropped; reverses M1.8 D2.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                                             | New / changed | What                                                       |
| ------------------------------------------------ | ------------- | ---------------------------------------------------------- |
| `scripts/prepare-map-data.mts`                   | Changed       | Free State swap; outline clip and fill (D2)                |
| `scripts/__tests__/prepare-map-data.test.ts`     | Changed       | Commands; Free State source                                |
| `lib/boundaries/__tests__/river-borders.test.ts` | New           | Shared vertices within 0.5 km of the Vaal, Orange (and D2) |
| `data/boundaries/*.geojson`, `public/map/*`      | Changed       | Regenerated                                                |
| `data/sources.json`                              | Changed       | `processing` and dates of both entries                     |

## Order of work

1. Commit this plan: `plan(B289): approved by @<tech-lead>`.
2. Failing data test, then the prepare script with its tests; run `map:prepare`.
3. Count which border the issue's 450 Cape–Transvaal vertices sit on; report it in the PR.
4. Sources; validator, lint, tests, `npm run words`, `npm run e2e`; report GeoJSON size (NFR-02).

## Risks

- **Slivers over 300 km²** stay as gaps: the build checks the largest erased piece and stops and asks if one is left.
- **Gap fill** may give some slivers to the Free State, so it can differ slightly from 1994's.
- **Sliver joining (D2 B):** if mapshaper can't give each sliver to the province it touches in the same run, stop and ask (plan rule 6).
- **Shared simplify:** basemap and 1994 vertices shift slightly, as in M1.8.

## Proof

| Check                                                           | Proven by                                                 |
| --------------------------------------------------------------- | --------------------------------------------------------- |
| Free State–Transvaal on the Vaal, Free State–Cape on the Orange | Data test: at least 80% and 95% of vertices within 0.5 km |
| Outer edge on its rivers (D2 B)                                 | Data test: 1910 share at least the 1994 file's            |
| No overlap; no Free State shift at 1994-04-27                   | Validator; data test: areas within 0.1%                   |
| Free State version cites Natural Earth v4.1.0                   | Prepare script test                                       |
| Lint, tests (100%), validator, e2e pass                         | Their output in the PR                                    |

## Deviations

- Sliver joining: `-buffer 5km topological` extends afrith's three provinces before the erases and outline clip.
- Orange test: only vertices south of 29.7°S; the border near Kimberley isn't a river.
- Outer-edge test: share within 0.5 km among vertices within 3 km, not counts.
- Step 3: 110 shared Cape–Transvaal vertices, 6 near a basemap river (no Molopo).

## Out of scope

- Moving Cape–Transvaal vertices; step 3 only counts them.
- Natal's river borders: the basemap has no Tugela, Buffalo, Pongola or Mzimkulu.
