create table if not exists athlete_groups (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references coach_profiles(id) on delete cascade,
  name text not null,
  description text,
  access_level text not null default 'private' check (access_level in ('private', 'public')),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by_user_id uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint athlete_groups_coach_name_key unique (coach_id, name)
);

create table if not exists athlete_group_memberships (
  id uuid primary key default gen_random_uuid(),
  athlete_group_id uuid not null references athlete_groups(id) on delete cascade,
  athlete_id uuid not null references athlete_profiles(id) on delete cascade,
  added_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint athlete_group_memberships_group_athlete_key unique (athlete_group_id, athlete_id)
);

create index if not exists idx_athlete_groups_coach_status on athlete_groups(coach_id, status, updated_at desc);
create index if not exists idx_athlete_group_memberships_group on athlete_group_memberships(athlete_group_id);
create index if not exists idx_athlete_group_memberships_athlete on athlete_group_memberships(athlete_id);
