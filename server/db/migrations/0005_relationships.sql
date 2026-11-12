-- PPL-02, NFR-09. A Relationship between two Persons of one Tree. A parent row holds the parent in
-- person_a and the child in person_b, with a subtype. The names have no _id so that CamelCasePlugin
-- maps them both ways. A spouse row holds the marriage in start_
-- and the divorce in end_. A FuzzyDate is six columns under one prefix.
create table relationship (
  tree_id uuid not null references tree (id) on delete cascade,
  id uuid not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  person_a uuid not null,
  person_b uuid not null,
  type text not null,
  subtype text,
  start_qualifier text,
  start_date1 text,
  start_date2 text,
  start_precision text,
  start_valid_from integer,
  start_valid_to integer,
  end_qualifier text,
  end_date1 text,
  end_date2 text,
  end_precision text,
  end_valid_from integer,
  end_valid_to integer,
  primary key (tree_id, id),
  foreign key (tree_id, person_a) references person (tree_id, id),
  foreign key (tree_id, person_b) references person (tree_id, id),
  check (type in ('parent', 'spouse')),
  check (subtype in ('adoptive', 'biological', 'step')),
  check ((type = 'parent') = (subtype is not null)),
  check (type = 'spouse' or (start_qualifier is null and end_qualifier is null)),
  check (start_qualifier in ('EXACT', 'ABT', 'BEF', 'AFT', 'BET', 'FROM', 'EST', 'CAL')),
  check (start_precision in ('day', 'month', 'year')),
  check (start_date1 ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  check (start_date2 ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  check (start_valid_from < start_valid_to),
  check (
    (start_qualifier is null) = (start_date1 is null)
    and (start_qualifier is null) = (start_precision is null)
    and (start_qualifier is null) = (start_valid_from is null)
    and (start_qualifier is null) = (start_valid_to is null)
    and (start_date2 is null or coalesce(start_qualifier in ('BET', 'FROM'), false))
  ),
  check (end_qualifier in ('EXACT', 'ABT', 'BEF', 'AFT', 'BET', 'FROM', 'EST', 'CAL')),
  check (end_precision in ('day', 'month', 'year')),
  check (end_date1 ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  check (end_date2 ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  check (end_valid_from < end_valid_to),
  check (
    (end_qualifier is null) = (end_date1 is null)
    and (end_qualifier is null) = (end_precision is null)
    and (end_qualifier is null) = (end_valid_from is null)
    and (end_qualifier is null) = (end_valid_to is null)
    and (end_date2 is null or coalesce(end_qualifier in ('BET', 'FROM'), false))
  )
);
