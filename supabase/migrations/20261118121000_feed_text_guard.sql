-- Server-side text guard for feed posts, so a modified client cannot bypass the
-- app's check (app/src/lib/moderation.js).
--
-- Keep this list SHORT and in ONE place: public.feed_text_banned_pattern()
-- below. It mirrors only the strongest terms of the client list (slurs and the
-- strongest profanity). The client list is the fuller one. Mild words that are
-- normal Irish usage (feck, arse, arsed, wrecked, ...) are allowed on purpose.
--
-- Words are matched on word boundaries (\m ... \M), so "Scunthorpe", "class" and
-- "assess" pass. Common swaps are folded first: leet digits and symbols between
-- letters, dots and dashes inside a word, and stretched letters.
--
-- Not applied by the build. Raises check_violation with the message
-- 'feed_text_guard: community guidelines', which the app shows as its calm
-- "That doesn't meet our community guidelines. Please reword it." line.

create or replace function public.feed_text_banned_pattern()
returns text
language sql
immutable
set search_path = ''
as $$
  -- Letter runs use + so stretched letters match ("fuuuck"). ' ' is whitespace.
  select '\m(' || array_to_string(array[
    'f+u+c+k+(e?r|ers|ing|in|ed|s)?',
    'm+o+t+h+e+r+f+u+c+k+(e?r|ers)?',
    's+h+i+t+(e|s|y|ty|head)?',
    'b+u+l+l+s+h+i+t+',
    'c+u+n+t+(s|y)?',
    't+w+a+t+(s)?',
    'w+a+n+k+e+r+(s)?',
    'b+i+t+c+h+(es|y)?',
    'w+h+o+r+e+(s)?',
    's+l+u+t+(s)?',
    'a+s{2,}h+o+l+e+(s)?',
    'a+r+s+e+h+o+l+e+(s)?',
    'n+i+g{2,}(e+r+|a+)(s)?',
    'f+a+g{2,}o+t+(s)?',
    'r+e+t+a+r+d+(ed|s)?',
    's+p+a+s+t+i+c+',
    'k+i+k+e+(s)?',
    'k+i+l+l\s+y+o+u+r+s+e+l+f+',
    'k+y+s+'
  ], '|') || ')\M';
$$;

-- Fold the usual disguises, then test. Returns true when the text is clean.
create or replace function public.feed_text_is_clean(t text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  pat text := public.feed_text_banned_pattern();
  folded text;
begin
  if t is null or btrim(t) = '' then
    return true;
  end if;

  -- Leet swaps. '1' is read as both i and l, so check both.
  folded := translate(lower(t), '0345@$7', 'oeasast');
  -- '!' only counts as a letter when it sits inside a word ("sh!t").
  folded := regexp_replace(folded, '([a-z0-9])!(?=[a-z0-9])', '\1i', 'g');
  -- Dots, dashes and underscores between letters ("f.u.c.k", "fu_ck").
  folded := regexp_replace(folded, '([a-z])[._-]+(?=[a-z])', '\1', 'g');

  if folded ~ pat then return false; end if;
  if replace(folded, '1', 'i') ~ pat then return false; end if;
  if replace(folded, '1', 'l') ~ pat then return false; end if;
  return true;
end;
$$;

create or replace function public.feed_posts_text_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.feed_text_is_clean(new.body) then
    raise exception 'feed_text_guard: community guidelines'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_feed_posts_text_guard on public.feed_posts;
create trigger trg_feed_posts_text_guard
  before insert or update of body on public.feed_posts
  for each row execute function public.feed_posts_text_guard();
