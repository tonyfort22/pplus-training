-- Apply this in Supabase SQL Editor for the PPLUS project.
-- Purpose: provision public coach avatar storage while keeping writes scoped to the authenticated coach's own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coach-avatars', 'coach-avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists coach_avatars_select_public on storage.objects;
create policy coach_avatars_select_public on storage.objects
for select to public
using (bucket_id = 'coach-avatars');

drop policy if exists coach_avatars_insert_own on storage.objects;
create policy coach_avatars_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'coach-avatars'
  and exists (
    select 1
    from public.coach_profiles
    where coach_profiles.user_id = auth.uid()
      and coach_profiles.id::text = split_part(name, '/', 1)
  )
);

drop policy if exists coach_avatars_update_own on storage.objects;
create policy coach_avatars_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'coach-avatars'
  and exists (
    select 1
    from public.coach_profiles
    where coach_profiles.user_id = auth.uid()
      and coach_profiles.id::text = split_part(name, '/', 1)
  )
)
with check (
  bucket_id = 'coach-avatars'
  and exists (
    select 1
    from public.coach_profiles
    where coach_profiles.user_id = auth.uid()
      and coach_profiles.id::text = split_part(name, '/', 1)
  )
);

drop policy if exists coach_avatars_delete_own on storage.objects;
create policy coach_avatars_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'coach-avatars'
  and exists (
    select 1
    from public.coach_profiles
    where coach_profiles.user_id = auth.uid()
      and coach_profiles.id::text = split_part(name, '/', 1)
  )
);
