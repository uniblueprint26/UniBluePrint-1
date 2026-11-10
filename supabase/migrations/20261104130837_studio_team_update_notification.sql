-- ═══════════════════════════════════════════════════════════════════════════
-- "What's new" team-update notification -- reuses studio_greetings (Studio
-- Phase 12) rather than a new table: a scope='team' row already IS exactly
-- "a message for everyone who opens this team's hub", which is the same
-- content founder/co_director/admin can already write via
-- create_studio_greeting()/the Team Greetings panel on the Founder Hub.
--
-- Why a NEW read path instead of reusing get_active_studio_greeting(): that
-- function's resolution order (checked live, see
-- 20261026120000_studio_phase12_greetings.sql) is user-scoped greeting FIRST,
-- team-scoped second -- correct for the hero GreetingBanner, but it means a
-- person with an active personal greeting (checked live: every named team
-- member currently has one, e.g. "Welcome Back Rach!!!!") would NEVER see a
-- team-wide update there, since their personal greeting always wins. Rather
-- than changing that resolution order (which would break the existing
-- personal-welcome feature for everyone), this adds an INDEPENDENT read of
-- just the active team-scoped row, for a separate small notification
-- element (TeamUpdateBell.jsx) in StudioShell's header -- so a real "stuff
-- was added to the dashboard" update reaches everyone on that hub, whether
-- or not they also have a personal greeting.
create or replace function public.get_active_team_update(_team text)
returns table (id uuid, message text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select g.id, g.message, g.created_at
  from public.studio_greetings g
  where g.scope = 'team' and g.team = _team and g.is_active
  order by g.created_at desc
  limit 1
$$;

revoke execute on function public.get_active_team_update(text) from public, anon;
grant execute on function public.get_active_team_update(text) to authenticated;

comment on function public.get_active_team_update(text) is
  'Latest active scope=team studio_greetings row for _team, ignoring any user-scoped greeting the caller might also have -- the read path for TeamUpdateBell.jsx''s notification indicator, kept separate from get_active_studio_greeting() (used by the hero GreetingBanner) specifically so a team-wide update is never hidden behind someone''s personal "Welcome Back" message.';
