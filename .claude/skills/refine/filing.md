# Filing a Spec or Chore with `gh`

`SKILL.md` links here. A Bug is already filed: `bug.md` edits it.

After the check round, follow these steps:

1. Ask "Must an open issue close first? Is an earlier issue the reason?" as a question of its own. List each answer under the draft as a link, not as a line of the body.
2. Ask "File it now?" as a question of its own. A yes covers the links.
   - If the answer is not yes, file nothing.
   - If the user asks for a link, give one as _Prefilled links_ in `SKILL.md` describes. File nothing.
3. Read the title prefix and `labels:` from the form in `.github/ISSUE_TEMPLATE/`. If a Chore has a blocker, use `status: blocked` in place of its status label ([Linking issues](../../../docs/how-we-work.md#linking-issues)).
4. Write the body to a new file outside the repo, in the scratchpad or `$TMPDIR`.
5. Write one `### <label>` heading per form box, in the form's order. The Spec-link workflow reads "Intent or milestone". Under an empty optional box, write `_No response_`.
6. Put the title and each label in single quotes. Write a `'` in the title as `'\''`.
7. Run `gh issue create --title '<title>' --label '<label>' --body-file <file>` once. Give one `--label` for each form label.
8. Report the issue number. If step 1 named an issue, set the links as _Links_ says.

## Links

`bug.md` links here. Follow the rules in [Linking issues](../../../docs/how-we-work.md#linking-issues). Run each `gh` call alone.

1. For the issue and each reason, run `gh issue view <number> --json id --jq .id`.
2. Read the issue's links: `gh api graphql -f id=<id> -f query='query($id: ID!) { node(id: $id) { ... on Issue { blockedBy(first: 50) { nodes { number } } relatesTo(first: 50) { nodes { number } } } } }'`.
3. For each blocker that `blockedBy` lacks, run `gh issue edit <number> --add-blocked-by <blocker>`.
4. For each reason that `relatesTo` lacks, run `gh api graphql -f issue=<id> -f other=<reason id> -f query='mutation($issue: ID!, $other: ID!) { addRelatesTo(input: {issueId: $issue, relatedIssueId: $other}) { issue { number } } }'`.
5. For a blocked Bug, run `gh issue view <number> --json labels`. If it has no `status: blocked` label, run `gh issue edit <number> --remove-label '<its status label>' --add-label 'status: blocked'`.
6. If a call fails, stop. File nothing again. Tell the user the issue number and each link still to set. They set it in the issue sidebar.

## If `gh` fails

If `gh` is missing, signed out or fails, say why. Then give a prefilled link, as _Prefilled links_ in `SKILL.md` describes.

If the link does not work, tell the user: **Issues → New issue → the form's name**. Then they copy each block into the box with the same name.
