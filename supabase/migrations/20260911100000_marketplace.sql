-- Ad Board marketplace: skills marketplace (offer/find a skill) and buy &
-- sell (post items for sale/wanted). Cross-Ireland like Course Connect, not
-- scoped to a campus. No auto-expiry — the poster manually marks a listing
-- sold/filled or removes it, same pattern as student_ads. RLS scoped so
-- everyone can browse but only the poster can change or remove their own
-- listing, matching every other board's convention.

create table if not exists public.marketplace_skills (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  poster_name    text,
  listing_type   text not null check (listing_type in ('Offering a skill', 'Looking for a skill')),
  title          text not null,
  category       text not null check (category in (
                   'Tutoring & Academic', 'Creative & Design', 'Tech & Development',
                   'Photography & Video', 'Fitness & Wellness', 'Music & Performance',
                   'Writing & Editing', 'Other'
                 )),
  description    text not null,
  rate_type      text not null check (rate_type in ('Fixed price', 'Hourly rate', 'Budget (negotiable)')),
  rate_amount    numeric(8,2),
  contact_method text not null,
  status         text not null default 'active' check (status in ('active', 'closed')),
  created_at     timestamptz not null default now()
);

alter table public.marketplace_skills enable row level security;

create policy "read_marketplace_skills" on public.marketplace_skills
  for select to authenticated using (true);
create policy "insert_own_marketplace_skill" on public.marketplace_skills
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_marketplace_skill" on public.marketplace_skills
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_marketplace_skill" on public.marketplace_skills
  for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.marketplace_listings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  poster_name    text,
  listing_type   text not null check (listing_type in ('For sale', 'Wanted')),
  title          text not null,
  category       text not null check (category in (
                   'Electronics', 'Textbooks & Notes', 'Furniture',
                   'Clothing', 'Tickets', 'Sports & Fitness', 'Other'
                 )),
  description    text not null,
  condition      text check (condition in ('New', 'Like new', 'Good', 'Fair', 'Well used')),
  price          numeric(8,2),
  photo_url      text,
  contact_method text not null,
  status         text not null default 'active' check (status in ('active', 'sold')),
  created_at     timestamptz not null default now()
);

alter table public.marketplace_listings enable row level security;

create policy "read_marketplace_listings" on public.marketplace_listings
  for select to authenticated using (true);
create policy "insert_own_marketplace_listing" on public.marketplace_listings
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_marketplace_listing" on public.marketplace_listings
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_marketplace_listing" on public.marketplace_listings
  for delete to authenticated using (auth.uid() = user_id);
