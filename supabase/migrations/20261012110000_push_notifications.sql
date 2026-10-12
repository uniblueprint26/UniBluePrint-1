-- Real push notification delivery: a token-storage table, plus the dispatch
-- hook the notification_center migration already set aside a slot for.
--
-- ═══ What already existed before this migration ═══════════════════════════
-- public.create_notification() (20260915090000_notification_center.sql) is
-- the single choke point every in-app notification already goes through —
-- welcome, coach_booking, the four Foundation Blueprint moments, chat_message,
-- board_reply. That migration's header spelled out two equally clean ways to
-- add push without touching any of those writers again: hook inside
-- create_notification() itself, or attach a plain `after insert on
-- public.notifications` trigger that calls a push-send Edge Function via
-- pg_net. This migration takes the trigger route — every existing and future
-- writer gets push for free, with zero changes to any of them.
--
-- ═══ What this migration adds ═══════════════════════════════════════════
--   1. public.push_tokens — one row per (user, device). A user can have
--      several (phone + another phone, a reinstall before the old token
--      expires, web in a pinch) — unique on the token itself, not on
--      (user_id, token), so re-registering an existing token updates it in
--      place and a token that moves to a different signed-in user (shared/
--      resold device) is simply reassigned rather than erroring.
--   2. The pg_net extension, and a trigger on public.notifications that
--      fires send-push-notification (supabase/functions/send-push-
--      notification) with just the new row's id. The Authorization header
--      carries the project's anon key — the same public key already shipped
--      in the app bundle (app/src/lib/supabase.js), not a secret — which is
--      enough to satisfy the Edge Function's default JWT check. The function
--      itself uses its own service-role key (auto-injected, never stored
--      here) to read push_tokens/notifications across users and call Expo.
--
-- ═══ Not covered here ═══════════════════════════════════════════════════
-- iOS production delivery additionally needs APNs credentials configured via
-- `eas credentials` — an Apple-Developer-account action, not a schema or
-- server-side concern, so there is nothing to add for it in this file.
-- Android/FCM delivery through Expo's push service needs no extra setup here.

-- ── 1. push_tokens ────────────────────────────────────────────────────────

create table public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  token      text not null unique,
  platform   text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_push_tokens_user on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "read_own_push_tokens" on public.push_tokens
  for select to authenticated using (auth.uid() = user_id);
create policy "insert_own_push_tokens" on public.push_tokens
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_push_tokens" on public.push_tokens
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_push_tokens" on public.push_tokens
  for delete to authenticated using (auth.uid() = user_id);

create or replace function public.touch_push_tokens_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists push_tokens_touch_updated_at on public.push_tokens;
create trigger push_tokens_touch_updated_at
  before update on public.push_tokens
  for each row execute function public.touch_push_tokens_updated_at();

-- Upsert entry point for the client: registers a token for the signed-in
-- user, or re-points it if the same token already belongs to someone else
-- (device changed hands) or just needs its updated_at bumped (re-registered
-- on app foreground, same token, nothing actually changed).
create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'A token is required';
  end if;
  if p_platform not in ('ios', 'android', 'web') then
    raise exception 'platform must be ios, android, or web';
  end if;

  insert into public.push_tokens (user_id, token, platform)
  values (auth.uid(), p_token, p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        updated_at = now();
end;
$$;

grant execute on function public.register_push_token(text, text) to authenticated;

-- ── 2. Dispatch: notifications -> Expo push, via pg_net + the Edge Function ─

create extension if not exists pg_net;

create or replace function public.dispatch_push_for_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Best-effort fan-out: a push-send failure must never roll back (or even
  -- slow down) the notification insert the whole app already depends on.
  begin
    perform net.http_post(
      url     := 'https://ozpeofkvnpikhopkgcxc.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        -- Public anon key, identical to the one in app/src/lib/supabase.js —
        -- satisfies the Edge Function's default JWT check, nothing secret.
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cGVvZmt2bnBpa2hvcGtnY3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTE5OTUsImV4cCI6MjEwMTM2Nzk5NX0.Ge0LCzTX7aEigdtmZL-yJHrvJsqNNowmmZ2g5knZxCg'
      ),
      body    := jsonb_build_object('notification_id', new.id)
    );
  exception when others then
    null; -- pg_net being unavailable or the function being down must not block the insert
  end;
  return new;
end;
$$;

drop trigger if exists trg_dispatch_push_for_notification on public.notifications;
create trigger trg_dispatch_push_for_notification
  after insert on public.notifications
  for each row execute function public.dispatch_push_for_notification();
