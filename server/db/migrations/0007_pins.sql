-- PIN-02, PIN-03, NFR-09. A Pin joins a Person to a Place on a date. The composite foreign keys
-- so that a row cannot point into another Tree. The date is required, so its columns are not null,
-- except date2, which only a range uses. The schema checks the length of address, sources and notes.
create table pin (
  tree_id uuid not null references tree (id) on delete cascade,
  id uuid not null,
  person_id uuid not null,
  place_id uuid not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_type text not null,
  address text not null default '',
  sources text not null default '',
  notes text not null default '',
  date_qualifier text not null,
  date_date1 text not null,
  date_date2 text,
  date_precision text not null,
  date_valid_from integer not null,
  date_valid_to integer not null,
  primary key (tree_id, id),
  foreign key (tree_id, person_id) references person (tree_id, id),
  foreign key (tree_id, place_id) references place (tree_id, id),
  check (event_type in ('birth', 'baptism', 'residence', 'marriage', 'divorce', 'death', 'burial', 'land', 'occupation', 'other')),
  check (date_qualifier in ('EXACT', 'ABT', 'BEF', 'AFT', 'BET', 'FROM', 'EST', 'CAL')),
  check (date_precision in ('day', 'month', 'year')),
  check (date_date1 ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  check (date_date2 ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  check (date_valid_from < date_valid_to),
  check (date_date2 is null or date_qualifier in ('BET', 'FROM'))
);

-- M2.12.4 queries the Pins of a Tree by day.
create index pin_date_idx
  on pin (tree_id, date_valid_from, date_valid_to);
