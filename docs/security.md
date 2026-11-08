# Security rules

Code and workflows follow these. The automated review flags a change that breaks one.

- Only `NEXT_PUBLIC_` environment variables reach the browser. Never give a secret that prefix.
- Validate every input from outside the server (route handlers, server actions, search params, uploads) before using it.
- On the server, check that the signed-in Account may access the Tree on every read and write. Never trust an id sent by the client.
- No `dangerouslySetInnerHTML`, `eval` or `new Function` on user or third-party content.
- Database queries take parameters; never build SQL from strings.
- Workflows follow the rules under _Workflows_ in [review-code.md](../.github/agent/review-code.md#workflows).
- Logs and error messages never include secrets, tokens or Person data.

## New infrastructure

A Spec that needs a new service, database, environment variable, secret or CODEOWNERS path lists it under **Flagged concerns** and carries a **Blocking** tech-lead [decision](how-we-work.md#decisions).
