create table if not exists support_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  category text not null,
  description text not null,
  status text not null default 'new',
  source text not null default 'support_page',
  notification_sent_at timestamptz,
  notification_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_status_created_at_idx on support_requests (status, created_at desc);

alter table support_requests enable row level security;
revoke all on table support_requests from anon;
revoke all on table support_requests from authenticated;
grant all on table support_requests to service_role;
