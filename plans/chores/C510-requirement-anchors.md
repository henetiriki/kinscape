# Plan: C510: Anchor requirement IDs and check links to them

- **Spec:** #510
- **Status:** approved

## Approach

Prefix each of the 53 ID cells with `<a id="<id>"></a>` and turn the 40 plain mentions into `[NFR-09](#nfr-09)` links (a range links both ends), then `npm run format`. A new test, written first, uses `git grep` like `repo-names.test.ts`. It fails, naming the ID, when an ID row has no anchor or its anchor doesn't match, or when a `requirements.md#<id>` link in tracked markdown, or a `(#<id>)` link inside `requirements.md`, has no anchor. Pure helpers in the test run on inline fixtures (a bare row, `#map-99`), then on the repo.

## Files that change

| File                                          | New / changed | What                           |
| --------------------------------------------- | ------------- | ------------------------------ |
| `docs/requirements.md`                        | Changed       | 53 anchors, 40 links           |
| `scripts/__tests__/requirement-links.test.ts` | New           | Anchor and link check          |
| `plans/TEMPLATE.md`                           | Changed       | Linked Requirement IDs example |

## Order of work

1. Write the test; see it fail on the missing anchors.
2. Add anchors and links; run `npm run format`.
3. Update `plans/TEMPLATE.md`.
4. Run lint, `format:check`, `words` and `npm test`.

## Risks

- GitHub prefixes `id` with `user-content-` and resolves `#map-03` with script; I check it on the branch's rendered file before marking ready.

## Proof

| Acceptance check                       | Proven by                                     |
| -------------------------------------- | --------------------------------------------- |
| `#map-03` scrolls to the row           | Branch's rendered file, linked in the PR      |
| Missing anchor or `#map-99` fails      | Fixture cases in the new test; failing output |
| Lint, format, words and tests pass     | Their output                                  |
| `TEMPLATE.md` shows the linked example | The diff                                      |

## Out of scope

Autolink references; plain IDs in old plans, issues and other docs.
