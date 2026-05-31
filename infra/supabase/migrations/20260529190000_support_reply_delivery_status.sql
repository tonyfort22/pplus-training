alter table support_messages
  add column if not exists delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed', 'skipped')),
  add column if not exists delivery_error text,
  add column if not exists delivered_at timestamptz;

create index if not exists support_messages_delivery_status_idx on support_messages (delivery_status, created_at desc);
