-- Campus Connect feed: stable board slugs, seed campus boards, denormalized post author name.

-- 1) Make board.type a stable slug (unique). Idempotent.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'boards_type_key') then
    alter table public.boards add constraint boards_type_key unique (type);
  end if;
end $$;

-- 2) Seed the 8 Campus Connect boards (type = slug used in the /campus/:boardType route).
insert into public.boards (name, description, type) values
  ('Project Collaboration', 'Find teammates for projects', 'projects'),
  ('Problems & Solutions',  'Ask and answer questions',    'problems'),
  ('Shared Notes',          'Share and find lecture notes', 'notes'),
  ('Shared Subscriptions',  'Split subscription costs',     'subscriptions'),
  ('College Reviews',       'Rate and review your college', 'reviews'),
  ('Carpool',               'Find rides to campus',         'carpool'),
  ('Lost & Found',          'Report or find lost items',    'lost-found'),
  ('Campus Suggestions',    'Suggest improvements',         'suggestions')
on conflict (type) do nothing;

-- 3) Denormalized author name on posts (avoids loosening profiles RLS to show post authors).
alter table public.posts add column if not exists author_name text;

-- 4) Allow users to delete their own posts.
drop policy if exists "Users can delete own posts" on public.posts;
create policy "Users can delete own posts" on public.posts
  for delete to authenticated using (auth.uid() = user_id);
