# Security rules

Code and workflows follow these. The automated review flags a change that breaks one.

- Only `NEXT_PUBLIC_` environment variables reach the browser. Never give a secret that prefix.
- Validate every input from outside the server (route handlers, server actions, search params, uploads) before using it.
- On the server, check that the signed-in Account may access the Tree on every read and write. Never trust an id sent by the client.
- No `dangerouslySetInnerHTML`, `eval` or `new Function` on user or third-party content.
- Database queries take parameters; never build SQL from strings.
- In workflows: pin each action and reusable workflow to a full commit SHA, this repo's own included (`actions-pin-update.yml` moves those pins); grant the fewest `permissions:`; pass `${{ github.event.* }}` text through `env:`.
- Logs and error messages never include secrets, tokens or Person data.
