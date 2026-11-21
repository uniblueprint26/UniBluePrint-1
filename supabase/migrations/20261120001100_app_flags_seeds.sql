-- Changes: inserts the app flags pro_free_until = "2027-01-31", coming_soon_tiles = false, foundation_visible = true, foundation_ordering_enabled = false if they are missing. Destructive: no (insert only; a row that already exists is left as it is). Undo: delete from public.app_flags where key in ('pro_free_until', 'coming_soon_tiles', 'foundation_visible', 'foundation_ordering_enabled');
--
-- Founder decisions of 20 Nov 2026:
--   Pro is free for every account until 31 January 2027.
--   Coming soon tiles stay OFF during store review.
--   Foundation is visible everywhere; ordering stays closed until January
--   ("Ordering opens in January").
-- foundation_enabled (existing, false) is not touched here.
--
-- Idempotent: ON CONFLICT DO NOTHING, so running it again never resets a flag
-- the founder has changed since (for example turning coming_soon_tiles on after
-- review). To force a value, update the row by hand:
--   update public.app_flags set value = 'true'::jsonb, updated_at = now() where key = 'coming_soon_tiles';
-- The table is readable by the public anon key and writable only by the
-- founder through the dashboard or the service role (see 20261119090000_app_flags.sql).

insert into public.app_flags (key, value) values
  ('pro_free_until',              to_jsonb('2027-01-31'::text)),
  ('coming_soon_tiles',           'false'::jsonb),
  ('foundation_visible',          'true'::jsonb),
  ('foundation_ordering_enabled', 'false'::jsonb)
on conflict (key) do nothing;
