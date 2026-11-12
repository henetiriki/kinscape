-- PPL-01, NFR-09. A Person in a Tree. A FuzzyDate is six columns under one prefix (birth_, death_).
-- `living` is not stored: the server derives it on read.
create table person (
  tree_id uuid not null references tree (id) on delete cascade,
  id uuid not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  given_names text not null default '',
  surname text not null default '',
  maiden_name text not null default '',
  variants text[] not null default '{}',
  -- GEDCOM 7: male, female, intersex, unknown.
  sex text not null default 'U',
  deceased boolean not null default false,
  notes text not null default '',
  birth_qualifier text,
  birth_date1 text,
  birth_date2 text,
  birth_precision text,
  birth_valid_from integer,
  birth_valid_to integer,
  death_qualifier text,
  death_date1 text,
  death_date2 text,
  death_precision text,
  death_valid_from integer,
  death_valid_to integer,
  primary key (tree_id, id),
  check (sex in ('M', 'F', 'X', 'U')),
  check (birth_qualifier in ('EXACT', 'ABT', 'BEF', 'AFT', 'BET', 'FROM', 'EST', 'CAL')),
  check (birth_precision in ('day', 'month', 'year')),
  check (birth_date1 ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  check (birth_date2 ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  check (birth_valid_from < birth_valid_to),
  check (
    (birth_qualifier is null) = (birth_date1 is null)
    and (birth_qualifier is null) = (birth_precision is null)
    and (birth_qualifier is null) = (birth_valid_from is null)
    and (birth_qualifier is null) = (birth_valid_to is null)
    and (birth_date2 is null or coalesce(birth_qualifier in ('BET', 'FROM'), false))
  ),
  check (death_qualifier in ('EXACT', 'ABT', 'BEF', 'AFT', 'BET', 'FROM', 'EST', 'CAL')),
  check (death_precision in ('day', 'month', 'year')),
  check (death_date1 ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  check (death_date2 ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  check (death_valid_from < death_valid_to),
  check (
    (death_qualifier is null) = (death_date1 is null)
    and (death_qualifier is null) = (death_precision is null)
    and (death_qualifier is null) = (death_valid_from is null)
    and (death_qualifier is null) = (death_valid_to is null)
    and (death_date2 is null or coalesce(death_qualifier in ('BET', 'FROM'), false))
  )
);
