# Security rules

Code and workflows follow these. The automated review flags a change that breaks one.

- Only `NEXT_PUBLIC_` environment variables reach the browser. Never give a secret that prefix.
- Validate every input from outside the server (route handlers, server actions, search params, uploads) before using it.
- On the server, check that the signed-in Account may access the Tree on every read and write. Never trust an id sent by the client.
- No `dangerouslySetInnerHTML`, `eval` or `new Function` on user or third-party content.
- Database queries take parameters; never build SQL from strings.
- Set `Cache-Control: private, no-store` on Tree data in a new page, route handler or server action.
- Logs and error messages never include secrets, tokens or Person data.

## Workflows

A change to a workflow or action follows these:

- Pin each action and reusable workflow to a full commit SHA. Pin this repo's own too; `actions-pin-update.yml` moves those pins.
- Give a workflow the fewest `permissions:`. Use `id-token: write` only where it uses OIDC.
- Pass `${{ github.event.* }}` text through `env:`.
- Catch API calls that can fail (404, rate limit). One failure must not abort a loop over many items.
- Never read a prompt, settings, marketplace or rule file from the PR head.
- Read comments and reviews with an author-association filter.
- Name the app on a new required check.

## New infrastructure

A Spec that needs a new service, database, environment variable, secret or CODEOWNERS path lists it under **Flagged concerns**. The Spec also carries a tech-lead [**Blocking** decision](how-we-work.md#decisions).

Add a row for a new variable, secret or service to [`infrastructure.md`](infrastructure.md) (Vercel, Supabase) or [`repo-settings.md`](repo-settings.md) (GitHub).
