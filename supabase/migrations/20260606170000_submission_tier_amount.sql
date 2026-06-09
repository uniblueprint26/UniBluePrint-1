-- Foundation flow: record the chosen tier + price + paid flag on each submission.
alter table public.submissions add column if not exists tier text;
alter table public.submissions add column if not exists amount_cents integer;
alter table public.submissions add column if not exists paid boolean not null default false;
