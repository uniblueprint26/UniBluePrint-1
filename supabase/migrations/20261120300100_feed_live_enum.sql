-- Live, step 1 of 2: the new post kind.
--
-- A new enum value cannot be used in the same transaction that adds it, so this
-- file only adds the value. Everything that uses it is in
-- 20261120300200_feed_live.sql, which must run after this one has committed.

alter type public.feed_post_type add value if not exists 'live';
