-- NFR-09. An Account is a provider-neutral sign-in identity; it is not linked to a Person.
create table account (
  id uuid primary key default gen_random_uuid(),
  issuer text not null,
  subject text not null,
  unique (issuer, subject)
);

create table tree (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- Deleting a Tree or an Account deletes its rows here.
create table tree_account (
  tree_id uuid not null references tree (id) on delete cascade,
  account_id uuid not null references account (id) on delete cascade,
  primary key (tree_id, account_id)
);

create index tree_account_account_id_idx on tree_account (account_id);
