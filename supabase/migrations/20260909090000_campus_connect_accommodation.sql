-- Phase 4, Campus Connect: Accommodation board + shared photo storage bucket
-- used by every board that takes an optional photo (Accommodation, Lost and
-- Found, Student Ads). One bucket, one policy set, path-namespaced per user
-- (`${user_id}/${timestamp}.jpg`) so RLS can be a simple ownership check on
-- the leading path segment — same pattern as the existing `ad-images` bucket.

-- ── 1. Shared storage bucket for Campus Connect post photos ─────────────────
insert into storage.buckets (id, name, public)
values ('campus-board-photos', 'campus-board-photos', true)
on conflict (id) do nothing;

create policy "campus_board_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'campus-board-photos');

create policy "campus_board_photos_own_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'campus-board-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "campus_board_photos_own_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'campus-board-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "campus_board_photos_own_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'campus-board-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── 2. Accommodation board ───────────────────────────────────────────────────
-- post_type: Looking for room / Room available / Flat to share
create table if not exists public.accommodation_posts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  poster_name         text,
  post_type           text not null check (post_type in ('Looking for room', 'Room available', 'Flat to share')),
  title               text not null,
  description         text not null,
  rent_per_month      numeric(8,2),
  location            text not null,
  available_from      date,
  contact_preference  text not null,
  photo_url           text,
  created_at          timestamptz not null default now()
);
alter table public.accommodation_posts enable row level security;

create policy "read_accommodation_posts" on public.accommodation_posts
  for select to authenticated using (true);
create policy "insert_own_accommodation_post" on public.accommodation_posts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_accommodation_post" on public.accommodation_posts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_accommodation_post" on public.accommodation_posts
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'accommodation_posts') then
    alter publication supabase_realtime add table public.accommodation_posts;
  end if;
end $$;
