create table if not exists public.student_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);
create index if not exists student_follows_followed_idx on public.student_follows(followed_id);
alter table public.student_follows enable row level security;
create policy "follows: read own" on public.student_follows for select to authenticated
  using ((select auth.uid()) in (follower_id, followed_id));
create policy "follows: follow as self" on public.student_follows for insert to authenticated
  with check ((select auth.uid()) = follower_id);
create policy "follows: unfollow as self" on public.student_follows for delete to authenticated
  using ((select auth.uid()) = follower_id);

create or replace function public.is_mutual_follow(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from student_follows where follower_id = a and followed_id = b)
     and exists (select 1 from student_follows where follower_id = b and followed_id = a);
$$;
create or replace function public.same_institution(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select institution from profiles where id = a) = (select institution from profiles where id = b), false);
$$;
revoke all on function public.is_mutual_follow(uuid, uuid) from public, anon;
revoke all on function public.same_institution(uuid, uuid) from public, anon;
grant execute on function public.is_mutual_follow(uuid, uuid) to authenticated;
grant execute on function public.same_institution(uuid, uuid) to authenticated;

alter table public.feed_posts add column if not exists audience text not null default 'course'
  check (audience in ('campus','course','friends'));
alter table public.feed_posts alter column user_id drop not null;
create index if not exists feed_posts_audience_created_idx on public.feed_posts(audience, created_at desc);

drop policy if exists "Authenticated can read feed posts" on public.feed_posts;
create policy "feed_posts: read by audience" on public.feed_posts for select to authenticated using (
  user_id is null
  or user_id = (select auth.uid())
  or audience = 'course'
  or (audience = 'campus' and public.same_institution((select auth.uid()), user_id))
  or (audience = 'friends' and public.is_mutual_follow((select auth.uid()), user_id))
);

create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  source text not null default 'custom' check (source in ('foundation','custom')),
  service_key text,
  done boolean not null default false,
  remind_every text check (remind_every in ('daily','weekly','monthly')),
  remind_message text check (char_length(remind_message) <= 140),
  remind_ok boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists user_goals_user_idx on public.user_goals(user_id, created_at);
alter table public.user_goals enable row level security;
create policy "goals: own select" on public.user_goals for select to authenticated using ((select auth.uid()) = user_id);
create policy "goals: own insert" on public.user_goals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "goals: own update" on public.user_goals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "goals: own delete" on public.user_goals for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.explore_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('scholarships','discounts','support','societies','volunteering','freshers')),
  title text not null,
  subtitle text,
  body text,
  url text,
  tags text[] not null default '{}',
  institution text,
  sort int not null default 100,
  source text not null default 'ubp' check (source in ('ubp','student')),
  status text not null default 'published' check (status in ('published','pending','rejected')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists explore_content_kind_idx on public.explore_content(kind, status, sort);
alter table public.explore_content enable row level security;
create policy "explore: read published" on public.explore_content for select to authenticated
  using (status = 'published' or created_by = (select auth.uid()));
create policy "explore: suggest pending" on public.explore_content for insert to authenticated
  with check (source = 'student' and status = 'pending' and created_by = (select auth.uid()));
