-- NFR-03. A failed sign-in holds the SHA-256 of the trimmed, lower-cased email, never the email.
create table sign_in_failure (
  email_key text not null,
  failed_at timestamptz not null
);

create index sign_in_failure_email_key_failed_at_idx on sign_in_failure (email_key, failed_at);
create index sign_in_failure_failed_at_idx on sign_in_failure (failed_at);
