# Writing rules

## All text

For chat replies, plans, PRs, issues and docs:

- Lead with the answer.
- Say each fact once, in one file.
- Link to that file from elsewhere.
- Write what to do.
- Put history in commits and PR comments.
- Give a reason only where the reader would misapply the rule without it.
- Write one line for each deviation.
- Omit a section that would only say "none". A required form box can say "None".
- If a reader does not need text, delete it. Add text only if a reader needs it.

`scripts/word-count.mts` sets the word budget for each file, and CI enforces it (`npm run words`). CI does not enforce two more rules, but reviewers check them:

- Keep chat replies short, and give detail on request.
- Write each PR body as its template says.

## Readers

Write for a reader who did not see the conversation, the `/refine` interview or the review thread. Do not write "as agreed", "per review" or question numbers such as "Q3".

## Code comments

A comment tells why the code is as it is now. Name the real constraint. Do not tell history ("was", "previously", "keep the existing behaviour", "fixed").

## STE

These rules apply to all text in the repo, issues and PRs. This includes PR bodies, agent comments, code comments, docs, agent prompts and skills. Intents and the root `README.md` do not follow STE. When a change edits a line, make that line follow the rules.

Text follows these 16 rules of Simplified Technical English (ASD-STE100). Code, commands and file names are technical names.

1. Write one instruction per sentence.
2. Keep an instruction to 20 words or fewer, and a description sentence to 25.
3. Use the active voice.
4. Give each word one meaning.
5. The [_Key concepts_](requirements.md#key-concepts) and [glossary](glossary.md) terms are approved technical names.
6. Use no more than three nouns in a noun cluster.
7. Use a verb, not a noun, for an action.
8. Do not use an -ing form for an action.
9. Use only the simple present, past and future tenses.
10. Do not use phrasal verbs.
11. Keep the articles "a", "an" and "the".
12. Write an instruction in the imperative.
13. Put a condition before its instruction.
14. Give each paragraph one topic and no more than six sentences.
15. Use a vertical list for a sequence or for more than two items.
16. Put a warning before the step that it applies to.

These exemptions apply:

- A bold lead-in that names a rule (for example "**A failed publish**") is a label. Rule 12 does not apply to it.
- Rules 11, 12 and 15 do not apply to a table cell or a form hint.
- In a skill, a line that the agent says to the PO does not follow STE. The agent's own instructions follow STE.
