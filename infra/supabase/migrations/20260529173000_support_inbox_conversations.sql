create table if not exists support_conversations (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid references support_requests(id) on delete set null,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'pending', 'closed', 'archived')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  requester_name text not null,
  requester_email text not null,
  requester_role text,
  requester_avatar_url text,
  assigned_admin_id uuid references auth.users(id) on delete set null,
  last_message_preview text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references support_conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('requester', 'admin', 'system')),
  sender_name text,
  sender_avatar_url text,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed', 'skipped')),
  delivery_error text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table support_messages
  add column if not exists delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed', 'skipped')),
  add column if not exists delivery_error text,
  add column if not exists delivered_at timestamptz;

create index if not exists support_conversations_status_last_message_idx on support_conversations (status, last_message_at desc nulls last, created_at desc);
create index if not exists support_conversations_requester_email_idx on support_conversations (lower(requester_email));
create index if not exists support_messages_conversation_created_at_idx on support_messages (conversation_id, created_at asc);
create index if not exists support_messages_delivery_status_idx on support_messages (delivery_status, created_at desc);

alter table support_conversations enable row level security;
alter table support_messages enable row level security;
revoke all on table support_conversations from anon;
revoke all on table support_conversations from authenticated;
revoke all on table support_messages from anon;
revoke all on table support_messages from authenticated;
grant all on table support_conversations to service_role;
grant all on table support_messages to service_role;
