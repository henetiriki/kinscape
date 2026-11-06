-- NFR-09, NFR-10. Template for a Tree-scoped table: copy what you need into migrations/NNNN_<name>.sql
-- and rename. `migrate` never applies this file; server/db/__tests__/tree-scoped.test.ts does, and
-- checks every table with a tree_id column against these rules.

-- Every table: tree_id first, primary key (tree_id, id), version, created_at, updated_at.
-- id has no default: the client sends a UUIDv7.
create table example_person (
  tree_id uuid not null references tree (id) on delete cascade,
  id uuid not null,
  version integer not null default 1,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tree_id, id)
);

-- A reference to another Tree-scoped row is a composite foreign key, so a row never points into
-- another Tree. A FuzzyDate is six columns under one prefix; a table queried by day indexes
-- (tree_id, <name>_valid_from, <name>_valid_to).
create table example_pin (
  tree_id uuid not null references tree (id) on delete cascade,
  id uuid not null,
  person_id uuid not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  placed_qualifier text,
  placed_date1 text,
  placed_date2 text,
  placed_precision text,
  placed_valid_from integer,
  placed_valid_to integer,
  primary key (tree_id, id),
  foreign key (tree_id, person_id) references example_person (tree_id, id),
  check (placed_qualifier in ('EXACT', 'ABT', 'BEF', 'AFT', 'BET', 'FROM', 'EST', 'CAL')),
  check (placed_precision in ('day', 'month', 'year')),
  check (placed_date1 ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  check (placed_date2 ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  check (placed_valid_from < placed_valid_to),
  check (
    (placed_qualifier is null) = (placed_date1 is null)
    and (placed_qualifier is null) = (placed_precision is null)
    and (placed_qualifier is null) = (placed_valid_from is null)
    and (placed_qualifier is null) = (placed_valid_to is null)
  )
);

create index example_pin_placed_idx
  on example_pin (tree_id, placed_valid_from, placed_valid_to);

-- Create (the client's UUIDv7; a retry is a no-op):
--   insert into example_person (tree_id, id, name) values ($1, $2, $3)
--   on conflict (tree_id, id) do nothing
--
-- Update (the version the client read; zero rows updated is a `conflict`, never an overwrite):
--   update example_person set name = $4, version = version + 1, updated_at = now()
--   where tree_id = $1 and id = $2 and version = $3
--
-- Read: join through openTree; the Tree id comes from the Viewer's Tree, never from the client.
