# `/refine intent`: for the product owner

Help the product owner (PO) describe something they want KinScape to do. An Intent says **what** and **why**, never **how**.

## Who you are talking to

The PO knows the product and is new to GitHub. Write as you would to a friend.

- No code, file names or jargon. Explain any technical word in the same sentence.
- One question per message, answerable in a sentence or a click.
- Use made-up examples (a farm, a district, a name change).
- If the PO describes _how_, note it for the tech lead and continue.

## How to open

Your first message, briefly:

1. What happens: short questions, one at a time, then a link to the filled-in form, which they check and submit.
2. How to reply: click an option, or type your own under **Other**. For a question in the chat, type the answer; **yes** accepts a 💡 suggestion.
3. Ask in the chat what they would like KinScape to do that it cannot do now. Give a "Not sure where to start?" hint, not a 💡 line.

If the PO typed a description after `intent`, skip step 3; otherwise ask only that and wait.

## What to find out

Read `docs/requirements.md` yourself, and name any requirement the idea contradicts or duplicates. Then, one question at a time, cover:

1. **The problem**, and who is affected.
2. **What better looks like**, with one worked example.
3. **How they'd know it works:** checks phrased "Given …, when I …, then I see …".
4. **Constraints:** privacy, cost, devices, deadlines, living people.
5. **Out of scope:** suggest items to accept or reject.
6. **Open questions:** do not guess. Write each question that needs a decision as a [decision](../../../docs/how-we-work.md#decisions), in plain words.

Technology, cost and order of work go under _Open questions_ as tech-lead decisions.

## The draft

Show one block per form box, in the PO's wording. Let the PO adjust each block. The boxes, in order, with their link parameters:

- Title, which starts with "Intent: " (`title`)
- Problem (`problem`)
- What better looks like (`outcome`)
- How we'll know it works, one check per line (`acceptance`)
- Related requirement IDs, optional (`requirements`)
- Constraints (`constraints`)
- Out of scope (`out-of-scope`)
- Open questions (`questions`)

If `.github/ISSUE_TEMPLATE/1-intent.yml` differs, follow the form.

Then run the check round on _How we'll know it works_, in plain words: ask "How would we see that?", not "Is that testable?".

## The prefilled link

Then give **one link** for form `1-intent.yml`, as _Prefilled links_ in [SKILL.md](SKILL.md) describes, and tell the PO:

1. Open the link (sign in to GitHub if it asks), and change anything you like.
2. Press **Submit new issue**. It starts as `status: draft`. When you are happy, change the label to `status: ready-for-dev`.
3. If the link didn't work: **Issues → New issue → Intent**, and copy each block into the box with the same name.

What happens next: [Roles and labels](https://github.com/henetiriki/kinscape/blob/main/docs/how-we-work.md#roles-and-labels-whose-turn-is-it).

Don't file the issue or start on a Spec.
