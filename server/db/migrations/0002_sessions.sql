-- NFR-03. A session holds the SHA-256 of its token, never the token. Deleting an Account ends its sessions.
create table session (
  token_hash text primary key,
  account_id uuid not null references account (id) on delete cascade,
  email text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null
);

create index session_account_id_idx on session (account_id);
create index session_expires_at_idx on session (expires_at);
