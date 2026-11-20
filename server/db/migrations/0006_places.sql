-- PIN-02, NFR-09. A Place in one Tree: a point and how exactly it is known. A double precision
-- column holds a JavaScript number exactly. The schema checks the range of latitude and
-- longitude, not this table.
create table place (
  tree_id uuid not null references tree (id) on delete cascade,
  id uuid not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  latitude double precision not null,
  longitude double precision not null,
  precision text not null,
  primary key (tree_id, id),
  check (precision in ('street', 'building', 'erf', 'farm', 'suburb', 'town', 'district', 'province', 'approximate'))
);
