-- The app reads and writes through Drizzle as the postgres role, which bypasses RLS.
-- The anon and authenticated roles only need: own profile row, and storage scoped below.
begin;

do $$
declare t record;
begin
	for t in
		select c.relname from pg_class c
		join pg_namespace n on n.oid = c.relnamespace
		where n.nspname = 'public' and c.relkind in ('r', 'p')
	loop
		execute format('alter table public.%I enable row level security', t.relname);
		execute format('revoke all on table public.%I from anon, authenticated', t.relname);
	end loop;
end $$;

revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

grant select on public.profiles to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
	for select to authenticated using (id = (select auth.uid()));


create or replace function public.is_content_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select exists (
		select 1 from public.user_roles
		where user_id = (select auth.uid()) and role in ('admin', 'editor')
	);
$$;
revoke execute on function public.is_content_manager() from public, anon;
grant execute on function public.is_content_manager() to authenticated;

drop policy if exists "Allow All 1oj01fe_0" on storage.objects;
drop policy if exists "Allow All 1oj01fe_1" on storage.objects;
drop policy if exists "Allow All 1oj01fe_2" on storage.objects;
drop policy if exists "Allow All 1oj01fe_3" on storage.objects;
drop policy if exists "Allow authenticated users to upload images bukh8m_0" on storage.objects;
drop policy if exists "Allow authenticated users to upload images bukh8m_1" on storage.objects;
drop policy if exists "Allow authenticated users to upload images bukh8m_2" on storage.objects;
drop policy if exists "Allow authenticated users to upload images bukh8m_3" on storage.objects;

drop policy if exists "avatars_owner_all" on storage.objects;
create policy "avatars_owner_all" on storage.objects
	for all to authenticated
	using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
	with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "athlete_images_managers_all" on storage.objects;
create policy "athlete_images_managers_all" on storage.objects
	for all to authenticated
	using (bucket_id = 'athlete-images' and (select public.is_content_manager()))
	with check (bucket_id = 'athlete-images' and (select public.is_content_manager()));

commit;

-- http lives in public and is owned by supabase_admin, so the revoke above cannot reach it.
-- Reinstalling it in extensions takes it off the PostgREST surface (only public is exposed).
begin;
drop extension if exists http;
create extension if not exists http with schema extensions;
commit;
notify pgrst, 'reload schema';

-- avatars are served via getPublicUrl, so the bucket is public; the old SELECT policy only enabled listing every user's folder.
begin;
update storage.buckets set public = true where id = 'avatars';
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
commit;
