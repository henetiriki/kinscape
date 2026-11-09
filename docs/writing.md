# Writing rules

## All text

For chat replies, plans, PRs, issues and docs:

- Lead with the answer.
- Say each fact once, in one file, and link to it from elsewhere.
- Instructions say what to do. History belongs in commits and PR comments; give a reason only where the rule would be misapplied without it.
- One line per deviation.
- Leave out any section that would only say "none". A required form box may say "None".
- Prefer deleting text to adding it.

Word budgets for files are in `scripts/word-count.mts` (`npm run words`), enforced in CI. Review rules, not enforced: chat replies short with detail on request; PR body per its template.

## Readers

Write for a reader who did not see the conversation, the `/refine` interview or the review thread. Do not write "as agreed", "per review" or question numbers such as "Q3".

## Code comments

A comment tells why the code is as it is now. Name the real constraint. Do not tell history ("was", "previously", "keep the existing behaviour", "fixed").

## STE

These rules apply to all text in the repo, issues and PRs. This includes PR bodies, agent comments, code comments, docs, agent prompts and skills. Intents and the root `README.md` do not follow STE. Existing text follows the rules when a change edits it.

Text follows these 16 rules of Simplified Technical English (ASD-STE100). Code, commands and file names are technical names.

1. Write one instruction per sentence.
2. Keep an instruction to 20 words or fewer, and a description sentence to 25.
3. Use the active voice.
4. Give each word one meaning.
5. The [_Key concepts_](requirements.md#key-concepts) terms are approved technical names.
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
