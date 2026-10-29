# Security rules

Code and workflows follow these. The automated review flags a change that breaks one.

- Only `NEXT_PUBLIC_` environment variables reach the browser. Never give a secret that prefix.
- Validate every input from outside the server (route handlers, server actions, search params, uploads) before using it.
- On the server, check that the signed-in Account may access the Tree on every read and write. Never trust an id sent by the client.
- No `dangerouslySetInnerHTML`, `eval` or `new Function` on user or third-party content.
- Database queries take parameters; never build SQL from strings.
- Workflows follow the rules under _In workflows_ in [review.md](../.github/agent/review.md#the-rules).
- Logs and error messages never include secrets, tokens or Person data.
