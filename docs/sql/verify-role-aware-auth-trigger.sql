-- Run these in Supabase SQL Editor after applying docs/sql/apply-role-aware-auth-trigger.sql
-- Purpose: verify the auth trigger now provisions coach vs athlete correctly.

-- 1) Confirm the function body is role-aware
select pg_get_functiondef('public.handle_new_auth_user()'::regprocedure) as function_definition;

-- You should see logic equivalent to:
-- coalesce(new.raw_user_meta_data ->> 'role', 'athlete')
-- if signup_role = 'coach' then insert into public.coach_profiles ...
-- else insert into public.athlete_profiles ...

-- 2) Confirm the trigger still exists on auth.users
select
  trigger_name,
  event_object_schema,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema = 'auth'
  and event_object_table = 'users'
  and trigger_name = 'on_auth_user_created';

-- 3) Quick counts before/after test signups
select 'coach_profiles' as table_name, count(*) as row_count from public.coach_profiles
union all
select 'athlete_profiles' as table_name, count(*) as row_count from public.athlete_profiles;

-- 4) Inspect the latest provisioned rows from both tables
select
  id,
  user_id,
  display_name,
  organization_name,
  created_at
from public.coach_profiles
order by created_at desc
limit 5;

select
  id,
  user_id,
  first_name,
  last_name,
  created_at
from public.athlete_profiles
order by created_at desc
limit 5;

-- 5) Optional: join auth.users to provisioned profile rows for a quick audit
select
  u.id as auth_user_id,
  u.email,
  u.raw_user_meta_data ->> 'role' as signup_role,
  cp.id as coach_profile_id,
  cp.display_name,
  ap.id as athlete_profile_id,
  ap.first_name,
  ap.last_name,
  u.created_at
from auth.users u
left join public.coach_profiles cp on cp.user_id = u.id
left join public.athlete_profiles ap on ap.user_id = u.id
order by u.created_at desc
limit 20;
