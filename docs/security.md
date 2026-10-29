# Security rules

Code and workflows follow these. The automated review flags a change that breaks one.

- Only `NEXT_PUBLIC_` environment variables reach the browser. Never give a secret that prefix.
- Validate every input from outside the server (route handlers, server actions, search params, uploads) before using it.
- On the server, check that the signed-in Account may access the Tree on every read and write. Never trust an id sent by the client.
- No `dangerouslySetInnerHTML`, `eval` or `new Function` on user or third-party content.
- Database queries take parameters; never build SQL from strings.
- Workflows grant the fewest `permissions:` they need, pin each action to a full commit SHA (except this repo's own actions and reusable workflows, used at `@main` and covered by `.github/CODEOWNERS`), and pass `${{ github.event.* }}` text to scripts through `env:`.
- Logs and error messages never include secrets, tokens or Person data.
